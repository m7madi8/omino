'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ProductGallery } from '@/components/storefront/product-gallery';
import { AddToCartButton } from '@/components/storefront/add-to-cart-button';
import { RevealOnScroll } from '@/components/storefront/reveal-on-scroll';
import { formatMoney } from '@/lib/money';
import { useReducedMotion } from '@/lib/storefront/motion';
import type { StorefrontProductDetail } from '@/types/storefront';

export function ProductDetailView({
  product,
  storeSlug,
  currency,
}: {
  product: StorefrontProductDetail;
  storeSlug: string;
  currency: string;
}) {
  const defaultVariant = product.variants.find((v) => v.inStock) || product.variants[0];
  const reduced = useReducedMotion();
  const [showSticky, setShowSticky] = useState(false);

  const { scrollY } = useScroll();
  const stickyOpacity = useTransform(scrollY, [280, 380], [0, 1]);

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 340);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14 lg:items-start">
        <ProductGallery images={product.images} productName={product.name} productId={product.id} />

        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <RevealOnScroll>
            <div className="space-y-3">
              {product.categoryName && (
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] sf-muted">
                  {product.categoryName}
                </p>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-display sf-ink leading-[1.05] tracking-tight">
                  {product.name}
                </h1>
                {product.catalogKind === 'BUNDLE' && (
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] sf-muted">Set</span>
                )}
              </div>
              {product.brand && <p className="sf-muted">{product.brand}</p>}
            </div>
          </RevealOnScroll>

          <RevealOnScroll delayMs={60}>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-mono sf-ink">
                {formatMoney(defaultVariant.priceMinor, defaultVariant.currency || currency)}
              </span>
              {defaultVariant.compareAtPriceMinor != null &&
                defaultVariant.compareAtPriceMinor > defaultVariant.priceMinor && (
                  <span className="sf-muted line-through font-mono">
                    {formatMoney(defaultVariant.compareAtPriceMinor, currency)}
                  </span>
                )}
            </div>
          </RevealOnScroll>

          {product.description && (
            <RevealOnScroll delayMs={100}>
              <p className="sf-muted leading-relaxed whitespace-pre-wrap max-w-prose">{product.description}</p>
            </RevealOnScroll>
          )}

          {product.catalogKind === 'BUNDLE' && product.bundleItems.length > 0 && (
            <RevealOnScroll delayMs={140}>
              <section className="border-t sf-border pt-6">
                <h2 className="font-display text-lg sf-ink mb-4">Products included</h2>
                <ul className="space-y-3">
                  {product.bundleItems.map((item) => (
                    <li key={item.productId} className="flex items-baseline gap-2 text-sm">
                      <span className="sf-muted">—</span>
                      <Link href={`/store/${storeSlug}/products/${item.slug}`} className="sf-link sf-ink">
                        {item.name}
                      </Link>
                      <span className="sf-muted font-mono">× {item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </RevealOnScroll>
          )}

          <RevealOnScroll delayMs={180}>
            <AddToCartButton
              storeSlug={storeSlug}
              variants={product.variants}
              defaultVariantId={defaultVariant.id}
              productImageUrl={product.images[0]?.url}
            />
          </RevealOnScroll>
        </div>
      </div>

      {/* Sticky mobile ATC bar */}
      {!reduced && (
        <motion.div
          className="lg:hidden fixed inset-x-0 bottom-0 z-40 p-4 border-t sf-border bg-[color-mix(in_srgb,var(--sf-surface)_94%,transparent)] backdrop-blur-md"
          style={{ opacity: stickyOpacity, pointerEvents: showSticky ? 'auto' : 'none' }}
          aria-hidden={!showSticky}
        >
          <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
            <div className="min-w-0">
              <p className="text-sm font-medium sf-ink truncate">{product.name}</p>
              <p className="font-mono text-sm sf-muted">
                {formatMoney(defaultVariant.priceMinor, currency)}
              </p>
            </div>
            <a
              href="#add-to-cart"
              className="sf-btn-primary shrink-0 min-h-[44px] px-6 rounded-sm text-sm font-medium inline-flex items-center"
            >
              Add to cart
            </a>
          </div>
        </motion.div>
      )}
    </>
  );
}
