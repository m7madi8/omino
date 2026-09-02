import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  createCollection,
  listCollections,
  updateCollection,
  deleteCollection,
  setCollectionProducts,
  publishCollection,
} from '@/server/services/collection-service';

export async function GET() {
  try {
    const ctx = await requireTenantContext('products.read');
    const collections = await listCollections(ctx.organizationId, {
      storeId: ctx.storeId ?? undefined,
    });
    return Response.json({ collections });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext('products.write');
    const body = await request.json();
    const data = z
      .object({
        name: z.string().min(2).max(120),
        description: z.string().max(2000).optional(),
        imageUrl: z.string().url().nullable().optional(),
        seoTitle: z.string().max(120).optional(),
        seoDescription: z.string().max(320).optional(),
        isFeatured: z.boolean().optional(),
        productIds: z.array(z.string().uuid()).optional(),
      })
      .parse(body);

    const collection = await createCollection(ctx.organizationId, {
      name: data.name,
      description: data.description,
      storeId: ctx.storeId ?? undefined,
      imageUrl: data.imageUrl ?? undefined,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      isFeatured: data.isFeatured,
      productIds: data.productIds,
    });
    return Response.json({ collection }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }
    return handleApiError(err);
  }
}
