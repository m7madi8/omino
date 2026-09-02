import type { StorefrontCategory } from '@/types/storefront';

export type NavCategory = { href: string; label: string; productCount: number };

const MAX_INLINE = 4;

export function buildStoreNavCategories(
  categories: StorefrontCategory[],
  storeSlug: string
): { primary: NavCategory[]; overflow: NavCategory[] } {
  const sorted = [...categories]
    .filter((c) => c.productCount > 0)
    .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name));

  const mapped = sorted.map((c) => ({
    href: `/store/${storeSlug}/products?category=${encodeURIComponent(c.slug)}`,
    label: c.name,
    productCount: c.productCount,
  }));

  return {
    primary: mapped.slice(0, MAX_INLINE),
    overflow: mapped.slice(MAX_INLINE),
  };
}

export function resolveHeroHeaderTone(hero: {
  enabled: boolean;
  layout: string;
  imageUrl?: string | null;
  overlay?: boolean;
}): 'light' | 'dark' {
  if (!hero.enabled || !hero.imageUrl) return 'dark';
  if (hero.layout === 'image-focused') return hero.overlay ? 'light' : 'dark';
  if (hero.layout === 'split') return 'light';
  return 'dark';
}
