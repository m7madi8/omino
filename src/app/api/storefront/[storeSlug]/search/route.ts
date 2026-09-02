import { handleApiError } from '@/lib/api/tenant';
import { resolveStoreByPublicSlug } from '@/server/services/storefront-service';
import { searchStorefront } from '@/server/services/search-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const store = await resolveStoreByPublicSlug(storeSlug);
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';
    const sessionId = url.searchParams.get('sessionId') || undefined;

    const results = await searchStorefront({
      organizationId: store.organizationId,
      storeId: store.id,
      query: q,
      sessionId,
    });

    return Response.json(results);
  } catch (err) {
    return handleApiError(err);
  }
}
