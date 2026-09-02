import {
  getStorefrontProduct,
  resolveStoreByPublicSlug,
} from '@/server/services/storefront-service';
import { handleStorefrontError } from '@/lib/api/storefront';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeSlug: string; productSlug: string }> }
) {
  try {
    const { storeSlug, productSlug } = await params;
    const store = await resolveStoreByPublicSlug(storeSlug);
    if (store.status !== 'ACTIVE') {
      return Response.json({ error: 'STORE_UNAVAILABLE' }, { status: 503 });
    }

    const product = await getStorefrontProduct(store.id, store.organizationId, productSlug);
    return Response.json({ product });
  } catch (err) {
    return handleStorefrontError(err);
  }
}
