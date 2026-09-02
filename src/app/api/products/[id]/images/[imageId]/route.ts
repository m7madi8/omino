import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  getProductDetail,
  removeProductImage,
  setProductImagePrimary,
} from '@/server/services/product-service';

const patchSchema = z.object({
  action: z.enum(['setPrimary']),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const ctx = await requireTenantContext('products.write');
    const { id: productId, imageId } = await params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }

    if (parsed.data.action === 'setPrimary') {
      await setProductImagePrimary(ctx.organizationId, productId, imageId);
    }

    const product = await getProductDetail(ctx.organizationId, productId);
    return NextResponse.json({ product });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const ctx = await requireTenantContext('products.write');
    const { id: productId, imageId } = await params;
    await removeProductImage(ctx.organizationId, productId, imageId);
    const product = await getProductDetail(ctx.organizationId, productId);
    return NextResponse.json({ product });
  } catch (err) {
    return handleApiError(err);
  }
}
