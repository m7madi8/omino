import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  archiveProduct,
  getProductDetail,
  updateProduct,
  addProductImages,
} from '@/server/services/product-service';

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  brand: z.string().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  productType: z.enum(['PHYSICAL', 'DIGITAL', 'SERVICE']).optional(),
  trackInventory: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantContext('products.read');
    const { id } = await params;
    const product = await getProductDetail(ctx.organizationId, id);
    return NextResponse.json({ product });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantContext('products.write');
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const product = await updateProduct(
      ctx.organizationId,
      ctx.userId,
      id,
      parsed.data
    );
    return NextResponse.json({ product });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantContext('products.write');
    const { id } = await params;
    await archiveProduct(ctx.organizationId, ctx.userId, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantContext('products.write');
    const { id } = await params;
    const body = await request.json();

    if (body.action === 'addImages') {
      const images = z
        .array(
          z.object({
            url: z.string().url(),
            altText: z.string().optional(),
            isPrimary: z.boolean().optional(),
          })
        )
        .parse(body.images);
      await addProductImages(ctx.organizationId, id, images);
      const product = await getProductDetail(ctx.organizationId, id);
      return NextResponse.json({ product });
    }

    return NextResponse.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
  } catch (err) {
    return handleApiError(err);
  }
}
