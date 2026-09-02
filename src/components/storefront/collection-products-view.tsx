import { ProductBentoGrid } from '@/components/storefront/product-bento-grid';
import { ThemedProductGrid } from '@/components/storefront/themes/themed-product-grid';
import { RevealOnScroll } from '@/components/storefront/reveal-on-scroll';
import type { StorefrontProductListItem } from '@/types/storefront';

export function CollectionProductsView({
  collection,
  products,
  storeSlug,
  currency,
}: {
  collection: {
    name: string;
    description: string | null;
    slug: string;
    imageUrl: string | null;
  };
  products: StorefrontProductListItem[];
  storeSlug: string;
  currency: string;
}) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14 space-y-10">
      <header className="space-y-4 max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] sf-muted">Collection</p>
        <h1 className="font-display text-3xl sm:text-4xl sf-ink tracking-tight">{collection.name}</h1>
        {collection.description && (
          <p className="sf-muted text-lg leading-relaxed">{collection.description}</p>
        )}
      </header>

      {products.length ? (
        <RevealOnScroll>
          <ThemedProductGrid
            products={products}
            storeSlug={storeSlug}
            currency={currency}
            layoutId
          />
        </RevealOnScroll>
      ) : (
        <p className="text-center sf-muted py-16">No products in this collection yet.</p>
      )}
    </div>
  );
}
