'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Filter, Plus, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerSourceBadge, CustomerStatusBadge } from '@/components/crm/status-badge';
import { formatMoney } from '@/lib/money';
import type { CustomerListItem } from '@/types/customer';
import type { CustomerSource, CustomerStatus } from '@/types/prisma-enums';

export function CustomersListClient({
  initialItems,
  initialTotal,
  currency,
  canWrite,
}: {
  initialItems: CustomerListItem[];
  initialTotal: number;
  currency: string;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CustomerStatus | ''>('');
  const [source, setSource] = useState<CustomerSource | ''>('');
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);

  async function fetchCustomers() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (source) params.set('source', source);
    const res = await fetch(`/api/customers?${params}`);
    const data = await res.json();
    if (res.ok) setItems(data.items);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display">Customers</h1>
          <p className="text-sm text-stone-2 mt-1">
            {initialTotal} customer{initialTotal !== 1 ? 's' : ''} in your CRM
          </p>
        </div>
        {canWrite && (
          <Link href="/app/customers/new">
            <Button>
              <Plus className="w-4 h-4" />
              Add customer
            </Button>
          </Link>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchCustomers();
        }}
        className="flex flex-col lg:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone…"
            className="w-full h-11 pl-10 pr-4 rounded-sm border border-hairline bg-white text-sm"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as CustomerStatus | '')}
          className="h-11 px-3 rounded-sm border border-hairline bg-white text-sm"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="BLOCKED">Blocked</option>
        </select>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as CustomerSource | '')}
          className="h-11 px-3 rounded-sm border border-hairline bg-white text-sm"
        >
          <option value="">All sources</option>
          <option value="POS">POS</option>
          <option value="ONLINE_STORE">Online</option>
          <option value="MANUAL">Manual</option>
        </select>
        <Button type="submit" variant="secondary" disabled={loading}>
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </form>

      <div className="hidden md:block rounded-md border border-hairline bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline bg-paper text-left text-stone-2">
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium text-right">Total spent</th>
              <th className="px-4 py-3 font-medium">Last order</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-stone-2">
                  No customers yet. {canWrite && 'Add your first customer to get started.'}
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-hairline last:border-0 hover:bg-paper/50 cursor-pointer"
                  onClick={() => router.push(`/app/customers/${c.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.displayName}</div>
                    <div className="text-xs text-stone-2">
                      {[c.email, c.phone].filter(Boolean).join(' · ') || 'No contact info'}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono">{c.orderCount}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatMoney(c.totalSpentMinor, currency)}
                  </td>
                  <td className="px-4 py-3 text-stone-2">
                    {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <CustomerSourceBadge source={c.source} />
                  </td>
                  <td className="px-4 py-3">
                    <CustomerStatusBadge status={c.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {items.length === 0 ? (
          <div className="rounded-md border border-hairline bg-white p-8 text-center text-stone-2">
            <Users className="w-8 h-8 mx-auto mb-3 opacity-40" />
            No customers yet
          </div>
        ) : (
          items.map((c) => (
            <Link
              key={c.id}
              href={`/app/customers/${c.id}`}
              className="block rounded-md border border-hairline bg-white p-4 shadow-soft"
            >
              <div className="flex justify-between gap-3">
                <div>
                  <div className="font-medium">{c.displayName}</div>
                  <div className="text-sm text-stone-2 mt-0.5">
                    {c.orderCount} orders · {formatMoney(c.totalSpentMinor, currency)}
                  </div>
                </div>
                <CustomerStatusBadge status={c.status} />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
