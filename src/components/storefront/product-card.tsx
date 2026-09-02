'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { Plus } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { SF_EASE, sfTransition, useReducedMotion } from '@/lib/storefront/motion';
import { useStoreCart } from '@/components/storefront/store-cart-context';
import { useStoreTheme } from '@/components/storefront/themes/theme-context';
import type { StorefrontProductListItem } from '@/types/storefront';

export function ProductCard({
  product,
  storeSlug,
  currency,
  index = 0,
  size = 'default',
  layoutId,
}: {
  product: StorefrontProductListItem;
  storeSlug: string;
  currency: string;
  index?: number;
  size?: 'default' | 'compact' | 'hero' | 'tall';
  layoutId?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-8% 0px' });
  const reduced = useReducedMotion();
  const { notifyItemAdded, openDrawer, refreshCart, setCart, triggerFlyToCart } = useStoreCart();
  const [hovered, setHovered] = useState(false);
  const [adding, setAdding] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  const href = `/store/${storeSlug}/products/${product.slug}`;
  const hasSecondary = Boolean(product.secondaryImageUrl && product.secondaryImageUrl !== product.imageUrl);

  async function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!product.defaultVariantId || !product.inStock || adding) return;

    setAdding(true);
    const rect = imageRef.current?.getBoundingClientRect();
    if (product.imageUrl && rect) {
      triggerFlyToCart({
        imageUrl: product.imageUrl,
        fromX: rect.left + rect.width / 2 - 24,
        fromY: rect.top + rect.height / 2 - 24,
      });
    }

    const res = await fetch(`/api/storefront/${storeSlug}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', variantId: product.defaultVariantId, quantity: 1 }),
    });
    const data = await res.json();
    setAdding(false);
    if (res.ok) {
      setCart(data.cart);
      notifyItemAdded();
      openDrawer();
      await refreshCart();
    }
  }

  const { themeId, styleId } = useStoreTheme();

  const themeShellClass = {
    aura: 'rounded-[var(--store-radius-lg)]',
    noir: 'border-2 border-[var(--sf-ink)] rounded-none',
    form: 'sf-product-card border sf-border rounded-[var(--store-radius-sm)]',
    atelier: 'rounded-[var(--store-radius-sm)]',
    pulse: 'rounded-[var(--store-radius-lg)] shadow-[var(--store-shadow-card)]',
  }[themeId];

  const styleShellClass = {
    minimal: 'sf-style-minimal',
    editorial: 'sf-style-editorial',
    luxury: 'sf-style-luxury',
    bold: 'sf-style-bold',
    organic: 'sf-style-organic',
    modern: 'sf-style-modern',
    classic: 'sf-style-classic',
    experimental: 'sf-style-experimental',
  }[styleId];

  const imageLayoutId = layoutId ? `product-image-${product.id}` : undefined;

  return (
    <motion.article
      ref={ref}
      initial={reduced ? false : { opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: reduced ? 0 : index * 0.07, duration: 0.5, ease: SF_EASE }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={cn('group h-full', size === 'hero' && 'flex flex-col')}
    >
      <Link href={href} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-primary)] focus-visible:ring-offset-2">
        <motion.div
          className={cn(
            'relative overflow-hidden bg-[var(--sf-surface-elevated)] w-full rounded-sm',
            themeShellClass,
            styleShellClass,
            size === 'hero' && 'sf-product-image--hero sf-product-image',
            size === 'compact' && 'sf-product-image--compact sf-product-image',
            size === 'tall' && 'min-h-[20rem] sm:min-h-[24rem]',
            size === 'default' && 'sf-product-image'
          )}
          animate={{
            boxShadow: hovered
              ? '0 20px 40px -16px color-mix(in srgb, var(--sf-primary) 28%, transparent)'
              : '0 0 0 0 transparent',
          }}
          transition={sfTransition.card}
        >
          <div ref={imageRef} className="relative w-full h-full min-h-[inherit] aspect-[4/5]">
            {product.imageUrl ? (
              <>
                <motion.div
                  layoutId={imageLayoutId}
                  className="absolute inset-0"
                  animate={{ scale: hovered && !reduced ? 1.05 : 1 }}
                  transition={sfTransition.card}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </motion.div>
                {hasSecondary && (
                  <motion.div
                    className="absolute inset-0"
                    initial={false}
                    animate={{ opacity: hovered ? 1 : 0 }}
                    transition={{ duration: 0.45, ease: SF_EASE }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.secondaryImageUrl!}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </motion.div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center sf-muted text-sm px-4 text-center">
                {product.name}
              </div>
            )}

            {!product.inStock && (
              <span className="absolute bottom-3 left-3 text-[11px] sf-muted font-mono uppercase tracking-wider z-10">
                Out of stock
              </span>
            )}

            <motion.div
              className="absolute inset-x-0 bottom-0 p-3 sm:p-4 flex flex-col gap-2 z-10 bg-gradient-to-t from-[color-mix(in_srgb,var(--sf-ink)_55%,transparent)] to-transparent"
              initial={false}
              animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 12 }}
              transition={{ duration: 0.38, ease: SF_EASE }}
            >
              {product.inStock && product.defaultVariantId && (
                <motion.button
                  type="button"
                  onClick={quickAdd}
                  disabled={adding}
                  initial={false}
                  animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 8 }}
                  transition={{ delay: 0.05, duration: 0.35, ease: SF_EASE }}
                  className="sf-btn-primary w-full min-h-[44px] rounded-sm text-xs font-medium tracking-wide inline-flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {adding ? 'Adding…' : 'Quick add'}
                </motion.button>
              )}
              {product.variantCount > 1 && (
                <motion.p
                  className="text-[10px] text-white/80 font-mono uppercase tracking-wider text-center"
                  initial={false}
                  animate={{ opacity: hovered ? 1 : 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  {product.variantCount} options
                </motion.p>
              )}
            </motion.div>
          </div>
        </motion.div>

        <div className={cn('pt-3 sm:pt-4 space-y-1.5', size === 'hero' && 'pt-4')}>
          <div className="flex items-center gap-2 flex-wrap">
            {product.categoryName && (
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] sf-muted">
                {product.categoryName}
              </p>
            )}
            {product.catalogKind === 'BUNDLE' && (
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] sf-muted">Set</p>
            )}
          </div>
          <h3
            className={cn(
              'font-display leading-snug sf-ink',
              size === 'hero' ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'
            )}
          >
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className={cn('font-mono sf-ink', size === 'hero' ? 'text-lg' : 'text-sm')}>
              {formatMoney(product.priceMinor, currency)}
            </span>
            {product.compareAtPriceMinor != null && product.compareAtPriceMinor > product.priceMinor && (
              <span className="text-xs sf-muted line-through font-mono">
                {formatMoney(product.compareAtPriceMinor, currency)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
