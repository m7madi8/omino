'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { CartContent } from '@/components/storefront/cart-content';
import { useStoreCart } from '@/components/storefront/store-cart-context';

export function CartDrawer({ storeSlug, currency }: { storeSlug: string; currency: string }) {
  const { cart, loading, drawerOpen, closeDrawer, refreshCart, setCart } = useStoreCart();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  async function updateQty(itemId: string, quantity: number) {
    setBusy(true);
    const res = await fetch(`/api/storefront/${storeSlug}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', itemId, quantity }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setCart(data.cart);
    } else {
      await refreshCart();
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/30 transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeDrawer}
        aria-hidden={!drawerOpen}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`sf-drawer-panel fixed inset-y-0 end-0 z-[60] w-full max-w-md flex flex-col sf-surface border-s sf-border shadow-2xl ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 h-16 border-b sf-border shrink-0">
          <h2 className="font-display text-lg sf-ink">
            Cart{cart?.itemCount ? ` (${cart.itemCount})` : ''}
          </h2>
          <button
            type="button"
            onClick={closeDrawer}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center sf-muted hover:sf-ink"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col min-h-0 px-4 sm:px-5 pb-5 pt-2">
          <CartContent
            storeSlug={storeSlug}
            currency={currency}
            cart={cart}
            loading={loading}
            busy={busy}
            onUpdateQty={updateQty}
            compact
          />
        </div>

        {cart?.items.length ? (
          <div className="px-4 sm:px-5 pb-4 shrink-0">
            <Link
              href={`/store/${storeSlug}/cart`}
              onClick={closeDrawer}
              className="block text-center text-xs sf-link min-h-[44px] leading-[44px]"
            >
              View full cart
            </Link>
          </div>
        ) : null}
      </aside>
    </>
  );
}
