import { handleApiError } from '@/lib/api/tenant';
import {
  resolveStoreByPublicSlug,
  getStorefrontProduct,
} from '@/server/services/storefront-service';
import {
  getRelatedProducts,
  getFrequentlyBoughtTogether,
} from '@/server/services/recommendation-service';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const store = await resolveStoreByPublicSlug(storeSlug);
    const url = new URL(request.url);
    const productSlug = url.searchParams.get('product');
    const type = url.searchParams.get('type') || 'related';

    if (!productSlug) {
      return Response.json({ products: [] });
    }

    const product = await getStorefrontProduct(
      store.id,
      store.organizationId,
      productSlug
    );

    const branch = await prisma.branch.findFirst({
      where: { storeId: store.id, isDefault: true },
    });
    const loc = await prisma.stockLocation.findFirst({
      where: { storeId: store.id, isDefault: true },
    });
    if (!loc) return Response.json({ products: [] });

    const products =
      type === 'frequently_bought_together'
        ? await getFrequentlyBoughtTogether(
            store.organizationId,
            product.id,
            loc.id,
            4
          )
        : await getRelatedProducts(
            store.organizationId,
            store.id,
            product.id,
            loc.id,
            4
          );

    return Response.json({ products });
  } catch (err) {
    return handleApiError(err);
  }
}
