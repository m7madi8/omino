import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { analyzeProductMerchandising } from '@/server/services/store-intelligence-service';

export async function GET() {
  try {
    const ctx = await requireTenantContext('products.read');
    if (!ctx.storeId) {
      return Response.json({ error: 'STORE_REQUIRED' }, { status: 400 });
    }
    const analysis = await analyzeProductMerchandising(ctx.organizationId, ctx.storeId);
    return Response.json({ analysis });
  } catch (err) {
    return handleApiError(err);
  }
}
