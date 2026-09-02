'use client';

import { ProductCard } from '@/components/storefront/product-card';
import { ProductBentoGrid } from '@/components/storefront/product-bento-grid';
import { useStoreTheme } from '@/components/storefront/themes/theme-context';
import type { StorefrontProductListItem } from '@/types/storefront';

export function ThemedProductGrid({
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
  const { theme } = useStoreTheme();
  const gridType = theme.variants.productGrid;

  if (gridType === 'uniform' || gridType === 'compact') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            storeSlug={storeSlug}
            currency={currency}
            index={index}
            size="compact"
            layoutId={layoutId}
          />
        ))}
      </div>
    );
  }

  return (
    <ProductBentoGrid
      products={products}
      storeSlug={storeSlug}
      currency={currency}
      layoutId={layoutId}
    />
  );
}
