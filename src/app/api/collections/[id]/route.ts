import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  getCollection,
  updateCollection,
  deleteCollection,
  setCollectionProducts,
  publishCollection,
} from '@/server/services/collection-service';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantContext('products.read');
    const { id } = await params;
    const collection = await getCollection(ctx.organizationId, id);
    return Response.json({ collection });
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
    const data = z
      .object({
        name: z.string().min(2).max(120).optional(),
        description: z.string().max(2000).nullable().optional(),
        imageUrl: z.string().url().nullable().optional(),
        seoTitle: z.string().max(120).nullable().optional(),
        seoDescription: z.string().max(320).nullable().optional(),
        isFeatured: z.boolean().optional(),
        status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
        position: z.number().int().optional(),
        productIds: z.array(z.string().uuid()).optional(),
      })
      .parse(body);

    const { productIds, ...rest } = data;
    const collection = await updateCollection(ctx.organizationId, id, rest);
    if (productIds) {
      await setCollectionProducts(ctx.organizationId, id, productIds);
    }
    const updated = await getCollection(ctx.organizationId, id);
    return Response.json({ collection: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }
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
    await deleteCollection(ctx.organizationId, id);
    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
