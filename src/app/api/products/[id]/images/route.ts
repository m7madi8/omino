import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  saveProductImageFile,
  PRODUCT_IMAGE_MAX_BYTES,
} from '@/lib/storage/product-images';
import {
  addProductImages,
  getProductDetail,
  reorderProductImages,
} from '@/server/services/product-service';

const reorderSchema = z.object({
  action: z.literal('reorder'),
  imageIds: z.array(z.string().uuid()).min(1),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantContext('products.write');
    const { id: productId } = await params;
    const body = await request.json();
    const parsed = reorderSchema.parse(body);
    await reorderProductImages(ctx.organizationId, productId, parsed.imageIds);
    const product = await getProductDetail(ctx.organizationId, productId);
    return NextResponse.json({ product });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }
    return handleApiError(err);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantContext('products.write');
    const { id: productId } = await params;
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'file is required' }, { status: 400 });
    }

    if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
      return NextResponse.json({ error: 'FILE_TOO_LARGE' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveProductImageFile(ctx.organizationId, productId, buffer);
    const isPrimary = formData.get('isPrimary') === 'true';
    const altText = String(formData.get('altText') || '').trim() || undefined;

    await addProductImages(ctx.organizationId, productId, [
      {
        url: saved.url,
        altText,
        isPrimary,
      },
    ]);

    const product = await getProductDetail(ctx.organizationId, productId);
    return NextResponse.json({ product, imageUrl: saved.url }, { status: 201 });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'INVALID_FILE_TYPE') {
        return NextResponse.json({ error: 'INVALID_FILE_TYPE' }, { status: 400 });
      }
      if (err.message === 'FILE_TOO_LARGE') {
        return NextResponse.json({ error: 'FILE_TOO_LARGE' }, { status: 400 });
      }
    }
    return handleApiError(err);
  }
}
