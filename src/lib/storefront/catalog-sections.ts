import type { StorefrontCategory, StorefrontProductListItem } from '@/types/storefront';

export type CatalogSection = {
  category: StorefrontCategory;
  products: StorefrontProductListItem[];
};

const UNCATEGORIZED_SLUG = '__uncategorized';

export function buildCatalogSections(
  categories: StorefrontCategory[],
  products: StorefrontProductListItem[],
  options?: { limitPerSection?: number }
): CatalogSection[] {
  const bySlug = new Map<string, StorefrontProductListItem[]>();
  const uncategorized: StorefrontProductListItem[] = [];

  for (const product of products) {
    if (product.categorySlug) {
      const list = bySlug.get(product.categorySlug) ?? [];
      list.push(product);
      bySlug.set(product.categorySlug, list);
    } else {
      uncategorized.push(product);
    }
  }

  const sections: CatalogSection[] = [];

  for (const category of categories) {
    const items = bySlug.get(category.slug) ?? [];
    if (!items.length) continue;
    sections.push({
      category,
      products: options?.limitPerSection ? items.slice(0, options.limitPerSection) : items,
    });
  }

  if (uncategorized.length) {
    sections.push({
      category: {
        id: UNCATEGORIZED_SLUG,
        name: 'More',
        slug: UNCATEGORIZED_SLUG,
        description: null,
        imageUrl: null,
        productCount: uncategorized.length,
      },
      products: options?.limitPerSection
        ? uncategorized.slice(0, options.limitPerSection)
        : uncategorized,
    });
  }

  return sections;
}

export function filterCatalogSections(
  sections: CatalogSection[],
  categorySlug: string | null
): CatalogSection[] {
  if (!categorySlug) return sections;
  return sections.filter((section) => section.category.slug === categorySlug);
}
