import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { createQuickProduct } from '@/server/services/product-service';

const schema = z.object({
  name: z.string().min(1).max(200),
  priceMinor: z.number().int().positive(),
  quantity: z.number().int().min(0),
  publish: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext('products.write');
    const body = schema.parse(await request.json());

    const result = await createQuickProduct(
      {
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        storeId: ctx.storeId,
        branchId: ctx.branchId,
        currency: ctx.currency,
      },
      {
        name: body.name,
        priceMinor: body.priceMinor,
        quantity: body.quantity,
        publish: body.publish ?? true,
      }
    );

    return NextResponse.json({
      product: {
        id: result.product.id,
        name: result.product.name,
        slug: result.product.slug,
        status: result.product.status,
      },
      variants: result.variants.map((v) => ({ id: v.id, sku: v.sku })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
