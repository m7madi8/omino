import { listStorefrontCategories, resolveStoreByPublicSlug } from '@/server/services/storefront-service';
import { handleStorefrontError } from '@/lib/api/storefront';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const store = await resolveStoreByPublicSlug(storeSlug);
    const categories = await listStorefrontCategories(store.id, store.organizationId);
    return Response.json({ categories });
  } catch (err) {
    return handleStorefrontError(err);
  }
}
