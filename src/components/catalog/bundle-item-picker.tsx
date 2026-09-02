'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type BundleItemDraft = { productId: string; name: string; quantity: number };

type ProductOption = { id: string; name: string; catalogKind?: string };

export function BundleItemPicker({
  value,
  onChange,
  excludeProductId,
}: {
  value: BundleItemDraft[];
  onChange: (items: BundleItemDraft[]) => void;
  excludeProductId?: string;
}) {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/products?pageSize=100')
      .then((r) => r.json())
      .then((data) => {
        const items = (data.items || []) as Array<{
          id: string;
          name: string;
          catalogKind?: string;
        }>;
        setProducts(
          items
            .filter((p) => p.id !== excludeProductId && p.catalogKind !== 'BUNDLE')
            .map((p) => ({ id: p.id, name: p.name, catalogKind: p.catalogKind ?? 'SIMPLE' }))
        );
      })
      .catch(() => setError('Could not load products.'));
  }, [excludeProductId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  function addItem() {
    const product = products.find((p) => p.id === selectedId);
    if (!product) {
      setError('Select a product to add.');
      return;
    }
    if (value.some((v) => v.productId === product.id)) {
      setError('Product already in bundle.');
      return;
    }
    onChange([...value, { productId: product.id, name: product.name, quantity: 1 }]);
    setSelectedId('');
    setSearch('');
    setError('');
  }

  function updateQuantity(productId: string, quantity: number) {
    onChange(
      value.map((item) =>
        item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  }

  function removeItem(productId: string) {
    onChange(value.filter((item) => item.productId !== productId));
  }

  return (
    <div className="space-y-4 rounded-sm border border-hairline p-4 bg-paper">
      <div>
        <p className="text-sm font-medium text-ink">Bundle contents</p>
        <p className="text-xs text-stone-2 mt-1">
          Add simple products to this bundle. Nested bundles are not allowed.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          label="Search products"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Type to filter…"
          className="flex-1"
        />
        <div className="flex-1 space-y-1.5">
          <label className="block text-sm font-medium text-stone-2">Product</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full h-11 rounded-sm border border-hairline px-3 text-sm bg-white"
          >
            <option value="">Select product…</option>
            {filtered.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button type="button" variant="secondary" onClick={addItem} className="min-h-[44px]">
            Add
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {value.length > 0 ? (
        <ul className="space-y-2">
          {value.map((item) => (
            <li
              key={item.productId}
              className="flex items-center justify-between gap-3 border border-hairline rounded-sm px-3 py-2 bg-white"
            >
              <span className="text-sm text-ink truncate">{item.name}</span>
              <div className="flex items-center gap-2 shrink-0">
                <label className="text-xs text-stone-2">Qty</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value, 10) || 1)}
                  className="w-16 h-9 rounded-sm border border-hairline px-2 text-sm text-center"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="text-xs text-danger min-h-[44px] px-2"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-stone-2">No products added yet.</p>
      )}
    </div>
  );
}
