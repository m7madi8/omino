'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductStatusBadge, StockBadge } from '@/components/catalog/status-badge';
import { formatMoney } from '@/lib/money';
import type { ProductListItem } from '@/types/catalog';
import type { ProductStatus } from '@/types/prisma-enums';

export function ProductsListClient({
  initialItems,
  initialTotal,
  canWrite,
}: {
  initialItems: ProductListItem[];
  initialTotal: number;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProductStatus | ''>('');
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);

  async function fetchProducts(q?: string, s?: string) {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    if (s) params.set('status', s);
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    if (res.ok) setItems(data.items);
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchProducts(search, status);
  }

  async function handleArchive(id: string) {
    if (!confirm('Archive this product?')) return;
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl">Products</h1>
          <p className="text-sm text-stone-2 mt-1">
            {initialTotal} product{initialTotal !== 1 ? 's' : ''} in catalog
          </p>
        </div>
        {canWrite && (
          <Link href="/app/products/new">
            <Button>
              <Plus className="w-4 h-4" />
              Add product
            </Button>
          </Link>
        )}
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, brand…"
            className="w-full h-11 pl-10 pr-4 rounded-sm border border-hairline bg-white text-sm"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ProductStatus | '')}
          className="h-11 px-3 rounded-sm border border-hairline bg-white text-sm"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <Button type="submit" variant="secondary" disabled={loading}>
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </form>

      {/* Desktop table */}
      <div className="hidden md:block rounded-md border border-hairline bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline bg-paper text-left text-stone-2">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium text-right">Price</th>
              <th className="px-4 py-3 font-medium text-right">Stock</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-stone-2">
                  No products yet. {canWrite && 'Create your first product to get started.'}
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="border-b border-hairline last:border-0 hover:bg-paper/50">
                  <td className="px-4 py-3">
                    <Link href={`/app/products/${p.id}`} className="flex items-center gap-3 group">
                      <div className="w-10 h-10 rounded-sm bg-paper-2 border border-hairline overflow-hidden shrink-0">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone text-xs">
                            —
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium group-hover:text-accent">{p.name}</p>
                        {p.brand && <p className="text-xs text-stone">{p.brand}</p>}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3">
                    <ProductStatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-stone-2">{p.categoryName || '—'}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatMoney(p.sellingPrice, p.currency)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <StockBadge available={p.totalAvailable} isLowStock={p.isLowStock} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/app/products/${p.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                      {canWrite && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(p.id)}
                          className="text-danger"
                        >
                          Archive
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/app/products/${p.id}`}
            className="block rounded-md border border-hairline bg-white p-4 hover:border-accent/40 transition"
          >
            <div className="flex gap-3">
              <div className="w-14 h-14 rounded-sm bg-paper-2 border border-hairline overflow-hidden shrink-0">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium truncate">{p.name}</p>
                  <ProductStatusBadge status={p.status} />
                </div>
                <p className="text-xs font-mono text-stone mt-1">{p.sku}</p>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="font-mono">{formatMoney(p.sellingPrice, p.currency)}</span>
                  <StockBadge available={p.totalAvailable} isLowStock={p.isLowStock} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
