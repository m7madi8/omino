'use client';

import { useEffect, useState } from 'react';
import { CartContent } from '@/components/storefront/cart-content';
import { useStoreCart } from '@/components/storefront/store-cart-context';

export function CartView({ storeSlug, currency }: { storeSlug: string; currency: string }) {
  const { cart, loading, refreshCart, setCart } = useStoreCart();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  async function updateQty(itemId: string, quantity: number) {
    setBusy(true);
    const res = await fetch(`/api/storefront/${storeSlug}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', itemId, quantity }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) setCart(data.cart);
  }

  return (
    <CartContent
      storeSlug={storeSlug}
      currency={currency}
      cart={cart}
      loading={loading}
      busy={busy}
      onUpdateQty={updateQty}
      onRefresh={refreshCart}
    />
  );
}
