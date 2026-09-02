'use client';

import Link from 'next/link';
import type { StorefrontCategory } from '@/types/storefront';
import { RevealOnScroll } from '@/components/storefront/reveal-on-scroll';

export function CategoryStrip({
  categories,
  storeSlug,
}: {
  categories: StorefrontCategory[];
  storeSlug: string;
}) {
  if (!categories.length) return null;

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl sf-ink">Categories</h2>
      <div className="sf-category-strip flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {categories.map((category, index) => (
          <RevealOnScroll key={category.id} delayMs={index * 60} className="shrink-0">
          <Link
            href={`/store/${storeSlug}/products?category=${encodeURIComponent(category.slug)}`}
            className="sf-category-item w-[9.5rem] sm:w-[11rem] group block"
          >
            <div className="aspect-[3/4] overflow-hidden bg-[color-mix(in_srgb,var(--sf-secondary)_45%,#fff)] mb-3">
              {category.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={category.imageUrl}
                  alt=""
                  className="w-full h-full object-cover sf-image-hover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-end p-3">
                  <span className="font-display italic text-lg leading-tight sf-ink opacity-80">
                    {category.name}
                  </span>
                </div>
              )}
            </div>
            <p className="font-display italic text-sm sf-ink group-hover:opacity-70 transition-opacity line-clamp-2">
              {category.name}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider sf-muted mt-1">
              {category.productCount} items
            </p>
          </Link>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
