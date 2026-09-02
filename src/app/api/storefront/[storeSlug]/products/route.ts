import { listStorefrontProducts, resolveStoreByPublicSlug } from '@/server/services/storefront-service';
import { handleStorefrontError } from '@/lib/api/storefront';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const store = await resolveStoreByPublicSlug(storeSlug);
    if (store.status !== 'ACTIVE') {
      return Response.json({ error: 'STORE_UNAVAILABLE' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const result = await listStorefrontProducts(store.id, store.organizationId, {
      search: searchParams.get('q') || undefined,
      categorySlug: searchParams.get('category') || undefined,
      page: Number(searchParams.get('page') || '1'),
    });

    return Response.json(result);
  } catch (err) {
    return handleStorefrontError(err);
  }
}
