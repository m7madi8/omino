'use client';

import { ThemedProductGrid } from '@/components/storefront/themes/themed-product-grid';
import type { StorefrontProductListItem } from '@/types/storefront';

export function ProductsGrid({
  products,
  storeSlug,
  currency,
}: {
  products: StorefrontProductListItem[];
  storeSlug: string;
  currency: string;
}) {
  return (
    <ThemedProductGrid
      products={products}
      storeSlug={storeSlug}
      currency={currency}
      layoutId
    />
  );
}
