import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { publishCollection } from '@/server/services/collection-service';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantContext('products.write');
    const { id } = await params;
    const collection = await publishCollection(ctx.organizationId, id);
    return Response.json({ collection });
  } catch (err) {
    return handleApiError(err);
  }
}
