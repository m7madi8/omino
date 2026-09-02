import { handleApiError } from '@/lib/api/tenant';
import { resolveStoreByPublicSlug } from '@/server/services/storefront-service';
import { recordStorefrontEvent } from '@/server/services/storefront-analytics-service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const store = await resolveStoreByPublicSlug(storeSlug);
    const body = await request.json();
    const type = typeof body.type === 'string' ? body.type : 'STORE_VIEWED';
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : undefined;

    await recordStorefrontEvent({
      organizationId: store.organizationId,
      storeId: store.id,
      type,
      sessionId,
    });

    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
