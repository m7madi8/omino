'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { COUNTRIES } from '@/lib/permissions/constants';
import { useStorefrontLocale } from '@/components/providers/storefront-locale-provider';
import type { ShippingMethodView, StorefrontCart } from '@/types/storefront';

export function CheckoutForm({ storeSlug, currency }: { storeSlug: string; currency: string }) {
  const { t, intlLocale } = useStorefrontLocale();
  const router = useRouter();
  const [cart, setCart] = useState<StorefrontCart | null>(null);
  const [methods, setMethods] = useState<ShippingMethodView[]>([]);
  const [shippingMethodId, setShippingMethodId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const payLock = useRef(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'PS',
    notes: '',
  });

  useEffect(() => {
    async function load() {
      const [cartRes, shipRes] = await Promise.all([
        fetch(`/api/storefront/${storeSlug}/cart`),
        fetch(`/api/storefront/${storeSlug}/checkout`),
      ]);
      const cartData = await cartRes.json();
      const shipData = await shipRes.json();
      if (cartRes.ok) setCart(cartData.cart);
      if (shipRes.ok) {
        setMethods(shipData.methods || []);
        if (shipData.methods?.[0]) setShippingMethodId(shipData.methods[0].id);
      }
      setLoading(false);
    }
    load();
  }, [storeSlug]);

  async function applyShipping(methodId: string) {
    setShippingMethodId(methodId);
    const res = await fetch(`/api/storefront/${storeSlug}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'shipping', shippingMethodId: methodId }),
    });
    const data = await res.json();
    if (res.ok) setCart(data.cart);
  }

  async function placeOrder() {
    if (payLock.current || !cart?.items.length) return;
    payLock.current = true;
    setBusy(true);
    setError('');

    const res = await fetch(`/api/storefront/${storeSlug}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        shippingMethodId,
        paymentMethod: 'COD',
        idempotencyKey: crypto.randomUUID(),
      }),
    });
    const data = await res.json();
    setBusy(false);
    payLock.current = false;

    if (!res.ok) {
      setError(data.message || data.error || t('sf.checkout.error'));
      return;
    }

    router.push(
      `/store/${storeSlug}/order/${data.orderNumber}?token=${data.accessToken}`
    );
  }

  if (loading) {
    return <p className="text-stone-2 py-12 text-center">{t('sf.checkout.loading')}</p>;
  }
  if (!cart?.items.length) {
    return <p className="text-stone-2 py-12 text-center">{t('sf.checkout.emptyCart')}</p>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section className="space-y-4 p-5 rounded-md border border-hairline bg-white">
          <h2 className="font-display text-lg">{t('sf.checkout.contact')}</h2>
          <Input
            label={t('sf.checkout.fullName')}
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <Input
            label={t('sf.checkout.email')}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label={t('sf.checkout.phone')}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </section>

        <section className="space-y-4 p-5 rounded-md border border-hairline bg-white">
          <h2 className="font-display text-lg">{t('sf.checkout.delivery')}</h2>
          <Input
            label={t('sf.checkout.address')}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('sf.checkout.city')}
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <Select
              label={t('sf.checkout.country')}
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              options={COUNTRIES.map((c) => ({ value: c.code, label: c.label }))}
            />
          </div>
        </section>

        <section className="space-y-3 p-5 rounded-md border border-hairline bg-white">
          <h2 className="font-display text-lg">{t('sf.checkout.shippingMethod')}</h2>
          {methods.map((m) => (
            <label
              key={m.id}
              className="flex items-start gap-3 p-3 rounded-sm border border-hairline cursor-pointer hover:border-accent"
            >
              <input
                type="radio"
                name="shipping"
                checked={shippingMethodId === m.id}
                onChange={() => applyShipping(m.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="font-medium text-sm">{m.name}</p>
                {m.description && <p className="text-xs text-stone-2">{m.description}</p>}
              </div>
              <span className="font-mono text-sm">{formatMoney(m.priceMinor, currency, intlLocale)}</span>
            </label>
          ))}
        </section>

        <section className="space-y-3 p-5 rounded-md border border-hairline bg-white">
          <h2 className="font-display text-lg">{t('sf.checkout.payment')}</h2>
          <p className="text-sm">{t('sf.checkout.paymentCod')}</p>
        </section>
      </div>

      <div className="p-5 rounded-md border border-hairline bg-white h-fit space-y-3">
        <h2 className="font-display text-lg">{t('sf.checkout.orderSummary')}</h2>
        {cart.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm gap-2">
            <span className="truncate">
              {item.quantity}× {item.productName}
            </span>
            <span className="font-mono shrink-0">
              {formatMoney(item.subtotalMinor, currency, intlLocale)}
            </span>
          </div>
        ))}
        <div className="border-t border-hairline pt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-2">{t('sf.subtotal')}</span>
            <span>{formatMoney(cart.subtotalMinor, currency, intlLocale)}</span>
          </div>
          {cart.shippingAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-stone-2">{t('sf.shipping')}</span>
              <span>{formatMoney(cart.shippingAmount, currency, intlLocale)}</span>
            </div>
          )}
          {cart.taxAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-stone-2">{t('sf.tax')}</span>
              <span>{formatMoney(cart.taxAmount, currency, intlLocale)}</span>
            </div>
          )}
          <div className="flex justify-between font-display text-lg pt-2">
            <span>{t('sf.total')}</span>
            <span>{formatMoney(cart.totalMinor, currency, intlLocale)}</span>
          </div>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button onClick={placeOrder} disabled={busy} className="w-full h-12">
          {busy ? t('sf.checkout.processing') : t('sf.checkout.placeOrder')}
        </Button>
      </div>
    </div>
  );
}
