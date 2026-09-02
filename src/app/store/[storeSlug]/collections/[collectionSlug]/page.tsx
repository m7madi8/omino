import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  resolveStoreByPublicSlug,
  toStorefrontStore,
} from '@/server/services/storefront-service';
import { getCollectionBySlug } from '@/server/services/collection-service';
import { CollectionProductsView } from '@/components/storefront/collection-products-view';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string; collectionSlug: string }>;
}): Promise<Metadata> {
  try {
    const { storeSlug, collectionSlug } = await params;
    const raw = await resolveStoreByPublicSlug(storeSlug);
    const collection = await getCollectionBySlug(raw.organizationId, collectionSlug, raw.id);
    return {
      title: collection.seoTitle || `${collection.name} | ${raw.name}`,
      description: collection.seoDescription || collection.description || undefined,
    };
  } catch {
    return { title: 'Collection' };
  }
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ storeSlug: string; collectionSlug: string }>;
}) {
  const { storeSlug, collectionSlug } = await params;

  let raw;
  try {
    raw = await resolveStoreByPublicSlug(storeSlug);
  } catch {
    notFound();
  }

  const store = toStorefrontStore(raw);

  let collection;
  try {
    collection = await getCollectionBySlug(raw.organizationId, collectionSlug, raw.id);
  } catch {
    notFound();
  }

  return (
    <CollectionProductsView
      collection={{
        name: collection.name,
        description: collection.description,
        slug: collection.slug,
        imageUrl: collection.imageUrl,
      }}
      storeSlug={storeSlug}
      currency={store.currency}
      products={collection.products
        .map((cp) => cp.product)
        .filter((p) => p.status === 'ACTIVE' && p.variants.length > 0)
        .map((p) => {
          const v = p.variants[0];
          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            imageUrl: p.images[0]?.url ?? null,
            secondaryImageUrl: p.images[1]?.url ?? null,
            defaultVariantId: v.id,
            categoryName: p.category?.name ?? null,
            categorySlug: p.category?.slug ?? null,
            catalogKind: p.catalogKind as 'SIMPLE' | 'BUNDLE',
            isFeatured: p.isFeatured,
            priceMinor: v.sellingPrice,
            compareAtPriceMinor: v.compareAtPrice,
            currency: v.currency,
            available: 999,
            inStock: true,
            variantCount: p.variants.length,
          };
        })}
    />
  );
}
