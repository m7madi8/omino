'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ThemedProductGrid } from '@/components/storefront/themes/themed-product-grid';
import { CategoryChips } from '@/components/storefront/category-chips';
import { RevealOnScroll } from '@/components/storefront/reveal-on-scroll';
import { filterCatalogSections, type CatalogSection } from '@/lib/storefront/catalog-sections';
import type { StorefrontCategory } from '@/types/storefront';

export function CategoryProductSections({
  sections,
  categories,
  storeSlug,
  currency,
  showChips = true,
  compact = false,
  layoutId = true,
}: {
  sections: CatalogSection[];
  categories: StorefrontCategory[];
  storeSlug: string;
  currency: string;
  showChips?: boolean;
  /** Home: shorter grids + "View all" per section */
  compact?: boolean;
  layoutId?: boolean;
}) {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category');

  const visibleSections = useMemo(
    () => filterCatalogSections(sections, activeCategory),
    [sections, activeCategory]
  );

  if (!sections.length) {
    return <p className="text-center sf-muted py-12">No products found.</p>;
  }

  return (
    <div className="space-y-10 sm:space-y-14">
      {showChips && (
        <CategoryChips
          categories={categories}
          storeSlug={storeSlug}
          mode="filter"
          preserveParams={['q']}
        />
      )}

      {visibleSections.map((section, sectionIndex) => (
        <RevealOnScroll key={section.category.id} delayMs={sectionIndex * 70}>
          <section
            id={`category-${section.category.slug}`}
            className="scroll-mt-28 space-y-5 sm:space-y-7"
            aria-labelledby={`section-title-${section.category.slug}`}
          >
            <div className="flex flex-wrap items-end justify-between gap-3 border-b sf-border pb-4">
              <div className="space-y-1">
                <h2
                  id={`section-title-${section.category.slug}`}
                  className="font-display text-2xl sm:text-3xl sf-ink tracking-tight"
                >
                  {section.category.name}
                </h2>
                <p className="text-sm sf-muted">
                  {section.category.productCount} product
                  {section.category.productCount === 1 ? '' : 's'}
                </p>
              </div>
              {compact ? (
                <Link
                  href={`/store/${storeSlug}/products?category=${encodeURIComponent(section.category.slug)}`}
                  className="sf-link text-sm min-h-[44px] inline-flex items-center"
                >
                  View all
                </Link>
              ) : (
                <Link
                  href={`/store/${storeSlug}/products?category=${encodeURIComponent(section.category.slug)}`}
                  className="sf-link text-sm min-h-[44px] inline-flex items-center"
                >
                  Browse category
                </Link>
              )}
            </div>

            {section.category.description && (
              <p className="sf-muted text-sm max-w-2xl leading-relaxed -mt-2">
                {section.category.description}
              </p>
            )}

            <ThemedProductGrid
              products={section.products}
              storeSlug={storeSlug}
              currency={currency}
              layoutId={layoutId}
            />
          </section>
        </RevealOnScroll>
      ))}

      {activeCategory && !visibleSections.length && (
        <p className="text-center sf-muted py-12">No products in this category.</p>
      )}
    </div>
  );
}
