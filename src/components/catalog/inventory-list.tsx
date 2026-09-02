'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StockBadge } from '@/components/catalog/status-badge';
import { StockAdjustDialog } from '@/components/catalog/stock-adjust-dialog';
import type { InventoryListItem } from '@/types/catalog';

type Location = { id: string; name: string };

export function InventoryListClient({
  initialItems,
  locations,
  canWrite,
}: {
  initialItems: InventoryListItem[];
  locations: Location[];
  canWrite: boolean;
}) {
  const [search, setSearch] = useState('');
  const [locationId, setLocationId] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);
  const [adjustVariant, setAdjustVariant] = useState<InventoryListItem | null>(null);

  async function fetchInventory() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (locationId) params.set('stockLocationId', locationId);
    if (lowStockOnly) params.set('lowStock', 'true');
    const res = await fetch(`/api/inventory?${params}`);
    const data = await res.json();
    if (res.ok) setItems(data.items);
    setLoading(false);
  }

  const lowStockCount = items.filter((i) => i.isLowStock).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl">Inventory</h1>
        <p className="text-sm text-stone-2 mt-1">
          Stock levels across all locations
          {lowStockCount > 0 && (
            <span className="ml-2 text-danger inline-flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {lowStockCount} low stock
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU or product…"
            className="w-full h-11 pl-10 pr-4 rounded-sm border border-hairline bg-white text-sm"
          />
        </div>
        <select
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          className="h-11 px-3 rounded-sm border border-hairline bg-white text-sm"
        >
          <option value="">All locations</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 h-11 px-3 rounded-sm border border-hairline bg-white text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
          />
          Low stock only
        </label>
        <Button variant="secondary" onClick={fetchInventory} disabled={loading}>
          Apply
        </Button>
      </div>

      <div className="hidden md:block rounded-md border border-hairline bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline bg-paper text-left text-stone-2">
              <th className="px-4 py-3 font-medium">Product / Variant</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium text-right">On hand</th>
              <th className="px-4 py-3 font-medium text-right">Reserved</th>
              <th className="px-4 py-3 font-medium text-right">Available</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-stone-2">
                  No inventory records. Add products with stock to see levels here.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={`${item.variantId}-${item.stockLocationId}`} className="border-b border-hairline last:border-0 hover:bg-paper/50">
                  <td className="px-4 py-3">
                    <Link href={`/app/inventory/${item.variantId}`} className="hover:text-accent">
                      <p className="font-medium">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-xs text-stone">{item.variantName}</p>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{item.sku}</td>
                  <td className="px-4 py-3 text-stone-2">{item.stockLocationName}</td>
                  <td className="px-4 py-3 text-right font-mono">{item.quantityOnHand}</td>
                  <td className="px-4 py-3 text-right font-mono text-stone">{item.quantityReserved}</td>
                  <td className="px-4 py-3 text-right">
                    <StockBadge
                      available={item.quantityAvailable}
                      isLowStock={item.isLowStock}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canWrite && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAdjustVariant(item)}
                      >
                        Adjust
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {!items.length ? (
          <p className="text-sm text-stone-2 py-8 text-center">No inventory records yet.</p>
        ) : (
        items.map((item) => (
          <div
            key={`${item.variantId}-${item.stockLocationId}`}
            className="rounded-md border border-hairline bg-white p-4"
          >
            <Link href={`/app/inventory/${item.variantId}`}>
              <p className="font-medium">{item.productName}</p>
              <p className="text-xs font-mono text-stone mt-0.5">{item.sku}</p>
            </Link>
            <p className="text-xs text-stone-2 mt-2">{item.stockLocationName}</p>
            <div className="flex justify-between mt-3 text-sm">
              <span>
                On hand: <strong className="font-mono">{item.quantityOnHand}</strong>
              </span>
              <StockBadge available={item.quantityAvailable} isLowStock={item.isLowStock} />
            </div>
            {canWrite && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full"
                onClick={() => setAdjustVariant(item)}
              >
                Adjust stock
              </Button>
            )}
          </div>
        ))
        )}
      </div>

      {adjustVariant && (
        <StockAdjustDialog
          item={adjustVariant}
          onClose={() => setAdjustVariant(null)}
          onSuccess={() => {
            setAdjustVariant(null);
            fetchInventory();
          }}
        />
      )}
    </div>
  );
}
