'use client';

import { ProductCard } from '@/components/storefront/product-card';
import type { StorefrontProductListItem } from '@/types/storefront';
import { cn } from '@/lib/utils';

/** Bento span classes — 12-col grid, repeating editorial rhythm */
function bentoSpan(index: number): string {
  const cycle = index % 6;
  switch (cycle) {
    case 0:
      return 'col-span-12 sm:col-span-7 lg:row-span-2';
    case 1:
      return 'col-span-6 sm:col-span-5';
    case 2:
      return 'col-span-6 sm:col-span-5';
    case 3:
      return 'col-span-6 sm:col-span-4';
    case 4:
      return 'col-span-6 sm:col-span-8';
    default:
      return 'col-span-12 sm:col-span-6';
  }
}

function cardSize(index: number): 'hero' | 'compact' | 'default' | 'tall' {
  const cycle = index % 6;
  if (cycle === 0) return 'hero';
  if (cycle === 1 || cycle === 2) return 'compact';
  if (cycle === 4) return 'tall';
  return 'default';
}

export function ProductBentoGrid({
  products,
  storeSlug,
  currency,
  layoutId = false,
}: {
  products: StorefrontProductListItem[];
  storeSlug: string;
  currency: string;
  layoutId?: boolean;
}) {
  if (!products.length) {
    return <p className="text-center sf-muted py-12">No products found.</p>;
  }

  return (
    <div
      className={cn(
        'grid grid-cols-12 gap-4 sm:gap-5 lg:gap-6 auto-rows-auto',
        'lg:auto-rows-[minmax(11rem,auto)]'
      )}
    >
      {products.map((product, index) => (
        <div key={product.id} className={cn(bentoSpan(index), 'min-h-0')}>
          <ProductCard
            product={product}
            storeSlug={storeSlug}
            currency={currency}
            index={index}
            size={cardSize(index)}
            layoutId={layoutId}
          />
        </div>
      ))}
    </div>
  );
}
