import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { getStoreFunnel, getTopSearchTerms, getZeroResultSearches } from '@/server/services/storefront-analytics-service';

export async function GET(request: Request) {
  try {
    const ctx = await requireTenantContext('analytics.read');
    if (!ctx.storeId) {
      return Response.json({ error: 'STORE_REQUIRED' }, { status: 400 });
    }
    const url = new URL(request.url);
    const days = Number(url.searchParams.get('days') || '30');

    const [funnel, topSearches, zeroResults] = await Promise.all([
      getStoreFunnel(ctx.organizationId, ctx.storeId, days),
      getTopSearchTerms(ctx.organizationId, ctx.storeId),
      getZeroResultSearches(ctx.organizationId, ctx.storeId),
    ]);

    return Response.json({ funnel, topSearches, zeroResults });
  } catch (err) {
    return handleApiError(err);
  }
}
