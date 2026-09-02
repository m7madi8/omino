import { resolveStoreByPublicSlug, toStorefrontStore } from '@/server/services/storefront-service';
import { handleStorefrontError } from '@/lib/api/storefront';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const store = await resolveStoreByPublicSlug(storeSlug);
    return Response.json({ store: toStorefrontStore(store) });
  } catch (err) {
    return handleStorefrontError(err);
  }
}
