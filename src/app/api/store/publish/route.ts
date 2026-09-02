import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { publishStoreExperience } from '@/server/services/store-experience-service';

export async function POST() {
  try {
    const ctx = await requireTenantContext('store.write');
    if (!ctx.storeId) {
      return Response.json({ error: 'STORE_REQUIRED' }, { status: 400 });
    }
    const store = await publishStoreExperience(ctx.organizationId, ctx.storeId);
    return Response.json({ store, publishedAt: new Date().toISOString() });
  } catch (err) {
    return handleApiError(err);
  }
}
