'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Banknote,
  CreditCard,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';
import type { CartView, PosProduct } from '@/types/commerce';

export function PosClient({ currency }: { currency: string }) {
  const router = useRouter();
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [cart, setCart] = useState<CartView | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<'CASH' | 'CARD' | 'OTHER'>('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [checkoutKey] = useState(() => crypto.randomUUID());
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<
    { id: string; displayName: string; email: string | null; phone: string | null }[]
  >([]);

  const loadCart = useCallback(async () => {
    const res = await fetch('/api/pos/carts');
    if (res.ok) {
      const data = await res.json();
      setCart(data.cart);
    }
  }, []);

  const loadProducts = useCallback(async (q?: string) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    const res = await fetch(`/api/pos/products?${params}`);
    if (res.ok) {
      const data = await res.json();
      setProducts(data.items);
    }
  }, []);

  useEffect(() => {
    loadCart();
    loadProducts();
  }, [loadCart, loadProducts]);

  async function searchCustomers(q: string) {
    if (!q.trim()) {
      setCustomerResults([]);
      return;
    }
    const res = await fetch(`/api/customers?search=${encodeURIComponent(q)}&pageSize=8`);
    const data = await res.json();
    if (res.ok) setCustomerResults(data.items || []);
  }

  async function attachCustomer(customerId: string | null) {
    if (!cart) return;
    setLoading(true);
    const res = await fetch('/api/pos/carts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_customer', cartId: cart.id, customerId }),
    });
    if (res.ok) {
      const data = await res.json();
      setCart(data.cart);
      setCustomerOpen(false);
      setCustomerQuery('');
      setCustomerResults([]);
    }
    setLoading(false);
  }

  async function quickCreateCustomer() {
    if (!customerQuery.trim()) return;
    setLoading(true);
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: customerQuery.trim(),
        source: 'POS',
        skipDuplicateCheck: false,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      await attachCustomer(data.customer.id);
    }
    setLoading(false);
  }

  async function addProduct(variantId: string) {
    setLoading(true);
    const res = await fetch('/api/pos/carts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_item', variantId, quantity: 1 }),
    });
    if (res.ok) {
      const data = await res.json();
      setCart(data.cart);
    }
    setLoading(false);
  }

  async function updateQty(itemId: string, quantity: number) {
    setLoading(true);
    const res = await fetch('/api/pos/carts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_item', itemId, quantity }),
    });
    if (res.ok) {
      const data = await res.json();
      setCart(data.cart);
    }
    setLoading(false);
  }

  async function handleCheckout() {
    if (!cart || cart.totalMinor <= 0) return;

    setLoading(true);
    const res = await fetch('/api/pos/carts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'complete',
        cartId: cart.id,
        paymentMethod: payMethod,
        amountMinor: cart.totalMinor,
        amountReceived:
          payMethod === 'CASH' && cashReceived
            ? Math.round(parseFloat(cashReceived) * 100)
            : undefined,
        idempotencyKey: checkoutKey,
      }),
    });
    setLoading(false);

    if (res.ok) {
      const data = await res.json();
      setPayOpen(false);
      router.push(`/app/orders/${data.order.id}`);
    } else {
      const err = await res.json();
      alert(err.error || 'Checkout failed');
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadProducts(search);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100svh-8rem)] min-h-[500px]">
      <div className="flex-1 flex flex-col rounded-md border border-hairline bg-white overflow-hidden">
        <div className="p-4 border-b border-hairline">
          <h1 className="text-xl font-display mb-3">Point of Sale</h1>
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, SKU, barcode…"
              className="w-full h-11 pl-10 pr-4 rounded-sm border border-hairline text-sm"
            />
          </form>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map((p) => (
              <button
                key={p.variantId}
                type="button"
                disabled={loading || (p.available <= 0 && p.available !== 0)}
                onClick={() => addProduct(p.variantId)}
                className="text-left rounded-sm border border-hairline p-3 hover:border-accent/50 hover:shadow-soft transition disabled:opacity-50"
              >
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="w-full aspect-square object-cover rounded-sm mb-2 bg-paper"
                  />
                ) : (
                  <div className="w-full aspect-square rounded-sm mb-2 bg-paper" />
                )}
                <div className="text-sm font-medium line-clamp-2">{p.name}</div>
                {p.variantName && (
                  <div className="text-xs text-stone-2">{p.variantName}</div>
                )}
                <div className="flex justify-between items-center mt-2">
                  <span className="font-mono text-sm">{formatMoney(p.priceMinor, p.currency)}</span>
                  <span className="text-xs text-stone-2">{p.available} avail</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-96 flex flex-col rounded-md border border-hairline bg-white overflow-hidden">
        <div className="p-4 border-b border-hairline flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          <h2 className="font-medium">Cart</h2>
          {cart && cart.itemCount > 0 && (
            <span className="ml-auto text-sm text-stone-2">{cart.itemCount} items</span>
          )}
        </div>

        <div className="p-4 border-b border-hairline">
          <button
            type="button"
            onClick={() => setCustomerOpen(true)}
            className="w-full flex items-center gap-2 text-sm rounded-sm border border-hairline px-3 py-2 hover:bg-paper"
          >
            <User className="w-4 h-4 text-stone" />
            <span className="truncate">
              {cart?.customer?.name || 'Attach customer'}
            </span>
            {cart?.customer && (
              <X
                className="w-4 h-4 ml-auto text-stone"
                onClick={(e) => {
                  e.stopPropagation();
                  attachCustomer(null);
                }}
              />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!cart?.items.length ? (
            <p className="text-sm text-stone-2 text-center py-8">Cart is empty</p>
          ) : (
            cart.items.map((item) => (
              <div key={item.id} className="flex gap-3 py-2 border-b border-hairline last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.productName}</div>
                  <div className="text-xs text-stone-2 font-mono">{item.sku}</div>
                  <div className="font-mono text-sm mt-1">
                    {formatMoney(item.subtotalMinor, cart.currency)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-sm border border-hairline flex items-center justify-center"
                  >
                    {item.quantity === 1 ? (
                      <Trash2 className="w-3.5 h-3.5 text-danger" />
                    ) : (
                      <Minus className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <span className="w-8 text-center text-sm font-mono">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-sm border border-hairline flex items-center justify-center"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart && cart.itemCount > 0 && (
          <div className="p-4 border-t border-hairline space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-stone-2">Subtotal</span>
              <span className="font-mono">{formatMoney(cart.subtotalMinor, currency)}</span>
            </div>
            {cart.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-good">
                <span>Discount</span>
                <span className="font-mono">−{formatMoney(cart.discountAmount, currency)}</span>
              </div>
            )}
            {cart.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-2">Tax</span>
                <span className="font-mono">{formatMoney(cart.taxAmount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium text-lg pt-2 border-t border-hairline">
              <span>Total</span>
              <span className="font-mono">{formatMoney(cart.totalMinor, currency)}</span>
            </div>
            <Button className="w-full" onClick={() => setPayOpen(true)} disabled={loading}>
              Charge {formatMoney(cart.totalMinor, currency)}
            </Button>
          </div>
        )}
      </div>

      {customerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-md border border-hairline bg-white p-6 shadow-lift">
            <h3 className="text-lg font-medium mb-4">Find or create customer</h3>
            <input
              value={customerQuery}
              onChange={(e) => {
                setCustomerQuery(e.target.value);
                searchCustomers(e.target.value);
              }}
              placeholder="Search name, email, phone…"
              className="w-full h-11 px-3 rounded-sm border border-hairline mb-3"
              autoFocus
            />
            <div className="max-h-48 overflow-y-auto space-y-1 mb-4">
              {customerResults.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => attachCustomer(c.id)}
                  className="w-full text-left px-3 py-2 rounded-sm hover:bg-paper text-sm"
                >
                  <div className="font-medium">{c.displayName}</div>
                  <div className="text-xs text-stone-2">
                    {[c.email, c.phone].filter(Boolean).join(' · ')}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={quickCreateCustomer} disabled={!customerQuery.trim() || loading}>
                Create new
              </Button>
              <Button variant="secondary" onClick={() => setCustomerOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {payOpen && cart && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-md border border-hairline bg-white p-6 shadow-lift">
            <h3 className="text-lg font-medium mb-1">Complete Payment</h3>
            <p className="text-2xl font-mono font-medium mb-6">
              {formatMoney(cart.totalMinor, currency)}
            </p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {(['CASH', 'CARD', 'OTHER'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPayMethod(m)}
                  className={`p-3 rounded-sm border text-sm font-medium capitalize ${
                    payMethod === m
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-hairline'
                  }`}
                >
                  {m === 'CASH' && <Banknote className="w-4 h-4 mx-auto mb-1" />}
                  {m === 'CARD' && <CreditCard className="w-4 h-4 mx-auto mb-1" />}
                  {m.toLowerCase()}
                </button>
              ))}
            </div>

            {payMethod === 'CASH' && (
              <div className="mb-4">
                <label className="text-sm text-stone-2">Cash received</label>
                <input
                  type="number"
                  step="0.01"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder={(cart.totalMinor / 100).toFixed(2)}
                  className="w-full h-11 px-3 mt-1 rounded-sm border border-hairline font-mono"
                />
                {cashReceived && parseFloat(cashReceived) * 100 >= cart.totalMinor && (
                  <p className="text-sm text-stone-2 mt-1">
                    Change:{' '}
                    {formatMoney(
                      Math.round(parseFloat(cashReceived) * 100) - cart.totalMinor,
                      currency
                    )}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleCheckout} disabled={loading}>
                Complete Sale
              </Button>
              <Button variant="secondary" onClick={() => setPayOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
