'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useStorefrontLocale } from '@/components/providers/storefront-locale-provider';
import type { StorefrontCart, StorefrontCartItem } from '@/types/storefront';

function CartLineItem({
  item,
  storeSlug,
  currency,
  busy,
  removing,
  onUpdateQty,
}: {
  item: StorefrontCartItem;
  storeSlug: string;
  currency: string;
  busy: boolean;
  removing: boolean;
  onUpdateQty: (itemId: string, quantity: number) => void;
}) {
  const { t, intlLocale } = useStorefrontLocale();
  const [expanded, setExpanded] = useState(false);
  const isBundle = item.catalogKind === 'BUNDLE' && item.bundleItems && item.bundleItems.length > 0;

  return (
    <div
      className={cn(
        'flex gap-3 sm:gap-4 py-4 border-b sf-border transition-all duration-300',
        removing && 'sf-item-exit pointer-events-none'
      )}
    >
      <div className="w-20 sm:w-24 shrink-0 aspect-[4/5] overflow-hidden bg-[color-mix(in_srgb,var(--sf-secondary)_40%,#fff)]">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] sf-muted px-2 text-center">
            {item.productName}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <div className="flex items-start gap-2">
            <p className="font-medium text-sm sm:text-base sf-ink leading-snug">{item.productName}</p>
            {isBundle && (
              <span className="font-mono text-[10px] uppercase tracking-wider sf-muted shrink-0">
                {t('sf.bundleSet')}
              </span>
            )}
          </div>
          {item.variantName && <p className="text-xs sf-muted mt-0.5">{item.variantName}</p>}
          {isBundle && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 inline-flex items-center gap-1 text-xs sf-link min-h-[32px]"
            >
              {expanded ? t('sf.bundleHide') : t('sf.bundleShow')}
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', expanded && 'rotate-180')} />
            </button>
          )}
          {expanded && isBundle && (
            <ul className="mt-2 space-y-1 text-xs sf-muted">
              {item.bundleItems!.map((b) => (
                <li key={b.slug}>
                  <Link href={`/store/${storeSlug}/products/${b.slug}`} className="hover:sf-ink">
                    {b.name} × {b.quantity}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center border sf-border rounded-sm sf-muted hover:sf-ink transition"
              disabled={busy || removing}
              onClick={() => onUpdateQty(item.id, item.quantity - 1)}
              aria-label={t('sf.decreaseQty')}
            >
              −
            </button>
            <span className="w-10 text-center font-mono text-sm">{item.quantity}</span>
            <button
              type="button"
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center border sf-border rounded-sm sf-muted hover:sf-ink transition"
              disabled={busy || removing}
              onClick={() => onUpdateQty(item.id, item.quantity + 1)}
              aria-label={t('sf.increaseQty')}
            >
              +
            </button>
          </div>
          <p className="font-mono text-sm sf-ink">
            {formatMoney(item.subtotalMinor, currency, intlLocale)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CartContent({
  storeSlug,
  currency,
  cart,
  loading,
  busy,
  onUpdateQty,
  onRefresh,
  compact = false,
}: {
  storeSlug: string;
  currency: string;
  cart: StorefrontCart | null;
  loading: boolean;
  busy: boolean;
  onUpdateQty: (itemId: string, quantity: number) => void;
  onRefresh?: () => void;
  compact?: boolean;
}) {
  const { t, intlLocale } = useStorefrontLocale();
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  async function handleUpdate(itemId: string, quantity: number) {
    if (quantity <= 0) {
      setRemovingIds((prev) => new Set(prev).add(itemId));
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const delay = reduced ? 0 : 320;
      window.setTimeout(() => onUpdateQty(itemId, quantity), delay);
      return;
    }
    onUpdateQty(itemId, quantity);
  }

  if (loading) {
    return <p className="sf-muted py-12 text-center text-sm">{t('sf.cartLoading')}</p>;
  }

  if (!cart?.items.length) {
    return (
      <div className="text-center py-16 px-4 space-y-5">
        <p className="font-display text-xl sf-ink">{t('sf.cartEmptyTitle')}</p>
        <p className="text-sm sf-muted max-w-xs mx-auto">{t('sf.cartEmptyHint')}</p>
        <Link
          href={`/store/${storeSlug}/products`}
          className="sf-btn-primary inline-flex items-center justify-center min-h-[44px] px-8 rounded-sm text-sm font-medium"
        >
          {t('sf.continueShopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', compact ? 'h-full min-h-0' : 'gap-8 lg:grid lg:grid-cols-[1fr_320px]')}>
      <div className={cn(compact && 'flex-1 overflow-y-auto min-h-0 px-1')}>
        {cart.items.map((item) => (
          <CartLineItem
            key={item.id}
            item={item}
            storeSlug={storeSlug}
            currency={currency}
            busy={busy}
            removing={removingIds.has(item.id)}
            onUpdateQty={handleUpdate}
          />
        ))}
      </div>

      <div
        className={cn(
          'space-y-4',
          compact
            ? 'shrink-0 border-t sf-border pt-4 mt-4 bg-[color-mix(in_srgb,var(--sf-surface)_96%,transparent)]'
            : 'p-5 sf-surface border sf-border h-fit'
        )}
      >
        <div className="flex justify-between text-sm">
          <span className="sf-muted">{t('sf.subtotal')}</span>
          <span className="font-mono">{formatMoney(cart.subtotalMinor, currency, intlLocale)}</span>
        </div>
        {cart.discountAmount > 0 && (
          <div className="flex justify-between text-sm text-good">
            <span>
              {t('sf.discount')}
              {cart.couponCode ? ` (${cart.couponCode})` : ''}
            </span>
            <span>-{formatMoney(cart.discountAmount, currency, intlLocale)}</span>
          </div>
        )}
        {!compact && (
          <CouponInput storeSlug={storeSlug} couponCode={cart.couponCode} onApplied={() => onRefresh?.()} />
        )}
        {cart.taxAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="sf-muted">{t('sf.tax')}</span>
            <span className="font-mono">{formatMoney(cart.taxAmount, currency, intlLocale)}</span>
          </div>
        )}
        <div className="flex justify-between items-baseline pt-2 border-t sf-border">
          <span className="font-display text-lg sf-ink">{t('sf.total')}</span>
          <span className="font-display text-2xl sf-ink font-mono">
            {formatMoney(cart.totalMinor, currency, intlLocale)}
          </span>
        </div>
        <Link
          href={`/store/${storeSlug}/checkout`}
          className="sf-btn-primary flex items-center justify-center min-h-[48px] w-full rounded-sm text-sm font-medium"
        >
          {t('sf.checkout')}
        </Link>
        {!compact && (
          <Link
            href={`/store/${storeSlug}/products`}
            className="block text-center text-sm sf-link min-h-[44px] leading-[44px]"
          >
            {t('sf.continueShopping')}
          </Link>
        )}
      </div>
    </div>
  );
}

function CouponInput({
  storeSlug,
  couponCode,
  onApplied,
}: {
  storeSlug: string;
  couponCode?: string | null;
  onApplied: () => void;
}) {
  const { t } = useStorefrontLocale();
  const [code, setCode] = useState(couponCode ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function apply() {
    setBusy(true);
    setError('');
    const res = await fetch(`/api/storefront/${storeSlug}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'coupon', code }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(t('sf.couponInvalid'));
      return;
    }
    onApplied();
  }

  async function remove() {
    setBusy(true);
    await fetch(`/api/storefront/${storeSlug}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'coupon', remove: true }),
    });
    setBusy(false);
    setCode('');
    onApplied();
  }

  return (
    <div className="pt-2 border-t sf-border space-y-2">
      <p className="text-xs font-mono uppercase sf-muted">{t('sf.coupon')}</p>
      <div className="flex gap-2">
        <input
          className="flex-1 border sf-border rounded-sm px-2 py-1.5 text-sm font-mono uppercase min-h-[44px]"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="OMINO10"
          disabled={busy || !!couponCode}
        />
        {couponCode ? (
          <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={busy}>
            {t('sf.couponRemove')}
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={apply} disabled={busy || !code}>
            {t('sf.couponApply')}
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
