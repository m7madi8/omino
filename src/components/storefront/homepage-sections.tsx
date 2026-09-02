'use client';

import Link from 'next/link';
import type { HomepageSection } from '@/types/store-experience';
import type { StoreHeroConfig } from '@/types/store-theme';
import type { StorefrontCategory, StorefrontProductListItem } from '@/types/storefront';
import { StoreHero } from '@/components/storefront/store-hero';
import { CategoryProductSections } from '@/components/storefront/category-product-sections';
import { ProductCard } from '@/components/storefront/product-card';
import { FeaturedProducts } from '@/components/storefront/featured-products';
import type { CatalogSection } from '@/lib/storefront/catalog-sections';

function BrandStorySection({ config }: { config: Record<string, unknown> }) {
  const title = typeof config.title === 'string' ? config.title : 'Our story';
  const body = typeof config.body === 'string' ? config.body : '';
  if (!body.trim()) return null;
  return (
    <section className="max-w-3xl mx-auto text-center space-y-4 py-8 sm:py-12 px-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] sf-muted">{title}</p>
      <p className="text-lg sm:text-xl leading-relaxed sf-ink">{body}</p>
    </section>
  );
}

function NewsletterSection({ config }: { config: Record<string, unknown> }) {
  const title = typeof config.title === 'string' ? config.title : 'Stay in touch';
  const description =
    typeof config.description === 'string' ? config.description : 'Get updates from our store.';
  return (
    <section className="sf-surface border sf-border rounded-[var(--sf-radius)] p-8 sm:p-10 text-center max-w-2xl mx-auto">
      <h2 className="font-display text-2xl sf-ink">{title}</h2>
      <p className="mt-2 sf-muted text-sm">{description}</p>
      <p className="mt-6 text-xs sf-muted">Newsletter signup coming soon.</p>
    </section>
  );
}

function PromotionalBanner({ config, storeSlug }: { config: Record<string, unknown>; storeSlug: string }) {
  const title = typeof config.title === 'string' ? config.title : '';
  const description = typeof config.description === 'string' ? config.description : '';
  const ctaLabel = typeof config.ctaLabel === 'string' ? config.ctaLabel : 'Shop now';
  const ctaHref = typeof config.ctaHref === 'string' ? config.ctaHref : `/store/${storeSlug}/products`;
  if (!title.trim()) return null;
  return (
    <section className="sf-surface border sf-border rounded-[var(--sf-radius)] p-8 sm:p-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
      <div className="space-y-2 max-w-xl">
        <h2 className="font-display text-2xl sm:text-3xl sf-ink">{title}</h2>
        {description && <p className="sf-muted">{description}</p>}
      </div>
      <Link
        href={ctaHref}
        className="sf-btn-primary sf-btn-hero inline-flex items-center justify-center min-h-[48px] px-8 rounded-[var(--sf-radius)] text-sm font-medium shrink-0"
      >
        {ctaLabel}
      </Link>
    </section>
  );
}

function RichTextSection({ config }: { config: Record<string, unknown> }) {
  const content = typeof config.content === 'string' ? config.content : '';
  if (!content.trim()) return null;
  return (
    <section className="prose prose-sm max-w-3xl mx-auto sf-ink px-4">
      <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
    </section>
  );
}

export function HomepageSections({
  sections,
  hero,
  storeSlug,
  storeName,
  currency,
  catalogSections,
  categories,
  featuredProducts,
  preview = false,
}: {
  sections: HomepageSection[];
  hero: StoreHeroConfig;
  storeSlug: string;
  storeName: string;
  currency: string;
  catalogSections: CatalogSection[];
  categories: StorefrontCategory[];
  featuredProducts: StorefrontProductListItem[];
  preview?: boolean;
}) {
  return (
    <>
      {sections
        .filter((s) => s.enabled)
        .map((section) => {
          switch (section.type) {
            case 'hero':
              return hero.enabled ? (
                <StoreHero
                  key={section.id}
                  hero={hero}
                  storeSlug={storeSlug}
                  storeName={storeName}
                  preview={preview}
                />
              ) : null;

            case 'featured-products':
              return (
                <div key={section.id} className="max-w-6xl mx-auto px-4">
                  <FeaturedProducts
                    title={(section.config.title as string) || 'Featured products'}
                    products={featuredProducts}
                    storeSlug={storeSlug}
                    currency={currency}
                  />
                </div>
              );

            case 'category-showcase':
              return (
                <div key={section.id} className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
                  <CategoryProductSections
                    sections={catalogSections}
                    categories={categories}
                    storeSlug={storeSlug}
                    currency={currency}
                    showChips={catalogSections.length > 1}
                    compact
                  />
                </div>
              );

            case 'featured-collection': {
              const slug = section.config.collectionSlug as string | undefined;
              const match = slug
                ? catalogSections.find((s) => s.category.slug === slug)
                : catalogSections[0];
              if (!match) return null;
              const collectionTitle = (section.config.title as string) || match.category.name;
              const collectionHref = slug
                ? `/store/${storeSlug}/collections/${slug}`
                : undefined;
              return (
                <div key={section.id} className="max-w-6xl mx-auto px-4 py-8">
                  <div className="flex items-end justify-between gap-4 mb-6">
                    <h2 className="font-display text-xl sf-ink">{collectionTitle}</h2>
                    {collectionHref && (
                      <Link href={collectionHref} className="sf-link text-sm">
                        View collection
                      </Link>
                    )}
                  </div>
                  <div className="grid grid-cols-12 gap-4">
                    {match.products.slice(0, 4).map((p) => (
                      <div key={p.id} className="col-span-6 sm:col-span-3">
                        <ProductCard product={p} storeSlug={storeSlug} currency={currency} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            case 'promotional-banner':
              return (
                <div key={section.id} className="max-w-6xl mx-auto px-4 py-8">
                  <PromotionalBanner config={section.config} storeSlug={storeSlug} />
                </div>
              );

            case 'brand-story':
              return (
                <div key={section.id} className="max-w-6xl mx-auto px-4">
                  <BrandStorySection config={section.config} />
                </div>
              );

            case 'newsletter':
              return (
                <div key={section.id} className="max-w-6xl mx-auto px-4 py-8">
                  <NewsletterSection config={section.config} />
                </div>
              );

            case 'rich-text':
              return (
                <div key={section.id} className="max-w-6xl mx-auto px-4 py-8">
                  <RichTextSection config={section.config} />
                </div>
              );

            default:
              return null;
          }
        })}
    </>
  );
}
