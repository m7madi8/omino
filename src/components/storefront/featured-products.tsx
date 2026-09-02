import Link from 'next/link';
import { ThemedProductGrid } from '@/components/storefront/themes/themed-product-grid';
import { RevealOnScroll } from '@/components/storefront/reveal-on-scroll';
import type { StorefrontProductListItem } from '@/types/storefront';

export function FeaturedProducts({
  products,
  storeSlug,
  currency,
  title = 'Featured',
}: {
  products: StorefrontProductListItem[];
  storeSlug: string;
  currency: string;
  title?: string;
}) {
  if (!products.length) {
    return <p className="text-center sf-muted py-12">No products available yet.</p>;
  }

  return (
    <RevealOnScroll>
      <section className="space-y-6 sm:space-y-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl sm:text-3xl sf-ink tracking-tight">{title}</h2>
          <Link
            href={`/store/${storeSlug}/products`}
            className="sf-link text-sm min-h-[44px] inline-flex items-center"
          >
            View all
          </Link>
        </div>
        <ThemedProductGrid
          products={products.slice(0, Math.min(products.length, 5))}
          storeSlug={storeSlug}
          currency={currency}
          layoutId
        />
      </section>
    </RevealOnScroll>
  );
}
