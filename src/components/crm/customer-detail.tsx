'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  MapPin,
  MessageSquare,
  ShoppingBag,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerSourceBadge, CustomerStatusBadge } from '@/components/crm/status-badge';
import { formatMoney } from '@/lib/money';
import type { CustomerDetail } from '@/types/customer';

export function CustomerDetailClient({
  customer: initial,
  currency,
  canWrite,
  canManageNotes,
  canManageTags,
}: {
  customer: CustomerDetail;
  currency: string;
  canWrite: boolean;
  canManageNotes: boolean;
  canManageTags: boolean;
}) {
  const router = useRouter();
  const [customer, setCustomer] = useState(initial);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const res = await fetch(`/api/customers/${customer.id}`);
    if (res.ok) setCustomer(await res.json());
    router.refresh();
  }

  async function addNote() {
    if (!note.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/customers/${customer.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: note }),
    });
    setLoading(false);
    if (res.ok) {
      setNote('');
      await refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/customers"
          className="inline-flex items-center gap-1 text-sm text-stone-2 hover:text-ink mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Customers
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display">{customer.displayName}</h1>
            <p className="text-sm text-stone-2 mt-1">
              {[customer.email, customer.phone].filter(Boolean).join(' · ') || 'No contact info'}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <CustomerSourceBadge source={customer.source} />
              <CustomerStatusBadge status={customer.status} />
            </div>
          </div>
          {canWrite && (
            <Link href={`/app/customers/${customer.id}/edit`}>
              <Button variant="secondary">Edit customer</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total revenue', value: formatMoney(customer.metrics.netRevenueMinor, currency) },
          { label: 'Orders', value: String(customer.metrics.totalOrders) },
          { label: 'Avg order', value: formatMoney(customer.metrics.averageOrderValueMinor, currency) },
          {
            label: 'Last order',
            value: customer.metrics.lastOrderAt
              ? new Date(customer.metrics.lastOrderAt).toLocaleDateString()
              : '—',
          },
        ].map((m) => (
          <div key={m.label} className="rounded-md border border-hairline bg-white p-4">
            <div className="text-xs text-stone-2 uppercase tracking-wide">{m.label}</div>
            <div className="text-xl font-mono font-medium mt-1">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-md border border-hairline bg-white p-5">
            <h2 className="flex items-center gap-2 font-medium mb-4">
              <ShoppingBag className="w-4 h-4" />
              Recent orders
            </h2>
            {customer.recentOrders.length === 0 ? (
              <p className="text-sm text-stone-2">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {customer.recentOrders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/app/orders/${o.id}`}
                    className="flex justify-between py-2 border-b border-hairline last:border-0 hover:text-accent"
                  >
                    <span className="font-mono text-sm">{o.orderNumber}</span>
                    <span className="font-mono text-sm">{formatMoney(o.totalMinor, o.currency)}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-md border border-hairline bg-white p-5">
            <h2 className="flex items-center gap-2 font-medium mb-4">
              <MapPin className="w-4 h-4" />
              Addresses
            </h2>
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-stone-2">No saved addresses</p>
            ) : (
              customer.addresses.map((a) => (
                <div key={a.id} className="py-3 border-b border-hairline last:border-0 text-sm">
                  <div className="font-medium capitalize">{a.type.toLowerCase()}</div>
                  <div className="text-stone-2 mt-1">
                    {a.addressLine1}
                    {a.addressLine2 ? `, ${a.addressLine2}` : ''}
                    <br />
                    {[a.city, a.state, a.postalCode].filter(Boolean).join(', ')} · {a.country}
                  </div>
                </div>
              ))
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-md border border-hairline bg-white p-5">
            <h2 className="flex items-center gap-2 font-medium mb-4">
              <Tag className="w-4 h-4" />
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {customer.tags.length === 0 ? (
                <span className="text-sm text-stone-2">No tags</span>
              ) : (
                customer.tags.map((t) => (
                  <span
                    key={t.id}
                    className="px-2 py-1 rounded-sm bg-paper text-xs border border-hairline"
                  >
                    {t.name}
                  </span>
                ))
              )}
            </div>
          </section>

          <section className="rounded-md border border-hairline bg-white p-5">
            <h2 className="flex items-center gap-2 font-medium mb-4">
              <MessageSquare className="w-4 h-4" />
              Internal notes
            </h2>
            <div className="space-y-3 mb-4">
              {customer.recentNotes.length === 0 ? (
                <p className="text-sm text-stone-2">No notes yet</p>
              ) : (
                customer.recentNotes.map((n) => (
                  <div key={n.id} className="text-sm border-b border-hairline pb-3 last:border-0">
                    <p>{n.content}</p>
                    <p className="text-xs text-stone-2 mt-1">
                      {n.authorName} · {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
            {canManageNotes && (
              <div className="space-y-2">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Add an internal note…"
                  className="w-full px-3 py-2 rounded-sm border border-hairline text-sm"
                />
                <Button size="sm" onClick={addNote} disabled={loading}>
                  Add note
                </Button>
              </div>
            )}
          </section>

          <section className="rounded-md border border-hairline bg-white p-5">
            <h2 className="flex items-center gap-2 font-medium mb-4">
              <Clock className="w-4 h-4" />
              Timeline
            </h2>
            <div className="space-y-4">
              {customer.timeline.map((e) => (
                <div key={e.id} className="relative pl-4 border-l-2 border-hairline">
                  <div className="text-sm font-medium">{e.eventType.replace(/\./g, ' ')}</div>
                  <div className="text-xs text-stone-2 mt-0.5">
                    {new Date(e.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
