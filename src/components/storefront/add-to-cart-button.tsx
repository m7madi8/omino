'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useStoreCart } from '@/components/storefront/store-cart-context';
import { useStorefrontLocale } from '@/components/providers/storefront-locale-provider';
import type { StorefrontVariant } from '@/types/storefront';

export function AddToCartButton({
  storeSlug,
  variants,
  defaultVariantId,
  productImageUrl,
}: {
  storeSlug: string;
  variants: StorefrontVariant[];
  defaultVariantId: string;
  productImageUrl?: string | null;
}) {
  const { t } = useStorefrontLocale();
  const { openDrawer, refreshCart, notifyItemAdded, setCart, triggerFlyToCart } = useStoreCart();
  const [variantId, setVariantId] = useState(defaultVariantId);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const btnRef = useRef<HTMLButtonElement>(null);

  const selected = variants.find((v) => v.id === variantId) || variants[0];

  async function addToCart() {
    setBusy(true);
    setError('');
    const rect = btnRef.current?.getBoundingClientRect();
    if (productImageUrl && rect) {
      triggerFlyToCart({
        imageUrl: productImageUrl,
        fromX: rect.left - 24,
        fromY: rect.top - 24,
      });
    }

    const res = await fetch(`/api/storefront/${storeSlug}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', variantId, quantity }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.message || data.error || t('sf.addToCartError'));
      return;
    }
    setCart(data.cart);
    notifyItemAdded();
    openDrawer();
    await refreshCart();
  }

  return (
    <div id="add-to-cart" className="space-y-4">
      {variants.length > 1 && (
        <div className="space-y-2">
          <p className="text-sm font-medium sf-ink">{t('sf.variant')}</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <motion.button
                key={v.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setVariantId(v.id)}
                className={`px-3 py-2 text-sm rounded-sm border transition min-h-[44px] ${
                  variantId === v.id
                    ? 'border-[var(--sf-primary)] bg-[color-mix(in_srgb,var(--sf-primary)_12%,transparent)] sf-ink'
                    : 'sf-border sf-muted'
                }`}
              >
                {v.name || v.sku}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium sf-ink">{t('sf.quantity')}</label>
        <div className="flex items-center border sf-border rounded-sm">
          <motion.button
            whileTap={{ scale: 0.92 }}
            className="w-11 h-11 hover:bg-[color-mix(in_srgb,var(--sf-surface)_80%,#fff)]"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            type="button"
            aria-label={t('sf.decreaseQty')}
          >
            −
          </motion.button>
          <span className="w-10 text-center font-mono text-sm">{quantity}</span>
          <motion.button
            whileTap={{ scale: 0.92 }}
            className="w-11 h-11 hover:bg-[color-mix(in_srgb,var(--sf-surface)_80%,#fff)]"
            onClick={() => setQuantity((q) => q + 1)}
            type="button"
            aria-label={t('sf.increaseQty')}
          >
            +
          </motion.button>
        </div>
        <span className="text-sm sf-muted">
          {selected.inStock
            ? t('sf.available', { n: String(selected.available) })
            : t('sf.outOfStock')}
        </span>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <motion.button
        ref={btnRef}
        type="button"
        onClick={addToCart}
        disabled={busy || !selected.inStock}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="w-full h-12 rounded-sm sf-btn-primary sf-btn-hero text-sm font-medium disabled:opacity-50"
      >
        {busy ? t('sf.addToCartAdding') : t('sf.addToCart')}
      </motion.button>
    </div>
  );
}
