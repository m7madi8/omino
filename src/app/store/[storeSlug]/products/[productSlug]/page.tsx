import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getStorefrontProduct,
  resolveStoreByPublicSlug,
  toStorefrontStore,
} from '@/server/services/storefront-service';
import { ProductDetailView } from '@/components/storefront/product-detail-view';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string; productSlug: string }>;
}): Promise<Metadata> {
  try {
    const { storeSlug, productSlug } = await params;
    const store = await resolveStoreByPublicSlug(storeSlug);
    const product = await getStorefrontProduct(store.id, store.organizationId, productSlug);
    return { title: `${product.name} | ${store.name}`, description: product.description || undefined };
  } catch {
    return { title: 'Product' };
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ storeSlug: string; productSlug: string }>;
}) {
  const { storeSlug, productSlug } = await params;

  let raw;
  try {
    raw = await resolveStoreByPublicSlug(storeSlug);
  } catch {
    notFound();
  }

  const store = toStorefrontStore(raw);

  let product;
  try {
    product = await getStorefrontProduct(raw.id, raw.organizationId, productSlug);
  } catch {
    notFound();
  }

  return (
    <ProductDetailView
      product={product}
      storeSlug={storeSlug}
      currency={store.currency}
    />
  );
}
