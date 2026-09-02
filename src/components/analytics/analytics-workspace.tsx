'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { formatMoney } from '@/lib/money';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/analytics/kpi-card';
import { SimpleLineChart } from '@/components/analytics/simple-line-chart';
import type { AnalyticsOverview, DateRangePreset } from '@/types/analytics';
import { OrderStatusBadge } from '@/components/commerce/status-badge';

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: '7 days' },
  { value: 'last_30_days', label: '30 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'this_year', label: 'This year' },
];

export function AnalyticsWorkspace({ initialData }: { initialData: AnalyticsOverview }) {
  const [data, setData] = useState(initialData);
  const [preset, setPreset] = useState<DateRangePreset>(initialData.range.preset);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (p: DateRangePreset) => {
    setLoading(true);
    setError('');
    const res = await fetch(`/api/analytics?preset=${p}`);
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError('Analytics could not be loaded. Try refreshing.');
      return;
    }
    setData(json.overview);
  }, []);

  useEffect(() => {
    if (preset !== initialData.range.preset) load(preset);
  }, [preset, load, initialData.range.preset]);

  const { currency, sales, salesComparison, customers, customersComparison } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-stone mb-2">Analytics</p>
          <h1 className="text-3xl font-display">Business intelligence</h1>
          <p className="mt-1 text-sm text-stone-2">{data.range.label}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={`px-3 py-1.5 text-sm rounded-sm border transition ${
                preset === p.value ? 'border-accent bg-accent/10 text-accent' : 'border-hairline'
              }`}
            >
              {p.label}
            </button>
          ))}
          <Button variant="ghost" size="sm" onClick={() => load(preset)} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {loading && <p className="text-sm text-stone-2">Updating…</p>}

      {!data.hasData ? (
        <Card title="No analytics data">
          <p className="text-sm text-stone-2">
            No sales data for this period. Start selling through POS or your online store.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Gross revenue" value={sales.grossSalesMinor} currency={currency} comparison={salesComparison.grossSalesMinor} />
            <KpiCard label="Net sales" value={sales.netSalesMinor} currency={currency} comparison={salesComparison.netSalesMinor} />
            <KpiCard label="Orders" value={sales.completedOrders} comparison={salesComparison.orderCount} format="number" />
            <KpiCard label="AOV" value={sales.averageOrderValueMinor} currency={currency} comparison={salesComparison.averageOrderValueMinor} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Discounts" value={sales.discountsMinor} currency={currency} format="money" />
            <KpiCard label="Taxes" value={sales.taxesMinor} currency={currency} format="money" />
            <KpiCard label="Refunds" value={sales.refundsMinor} currency={currency} format="money" />
            <KpiCard label="Units sold" value={sales.itemCount} format="number" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Revenue over time">
              <SimpleLineChart data={data.revenueSeries} valueKey="revenueMinor" height={160} />
            </Card>
            <Card title="Orders over time">
              <SimpleLineChart data={data.ordersSeries} valueKey="orderCount" height={160} />
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Channels" className="lg:col-span-1">
              <div className="space-y-3">
                {data.channels.map((c) => (
                  <div key={c.source} className="flex justify-between text-sm">
                    <span>{c.source}</span>
                    <span className="font-mono">{formatMoney(c.revenueMinor, currency)}</span>
                  </div>
                ))}
                {!data.channels.length && <p className="text-sm text-stone-2">No channel data</p>}
              </div>
            </Card>

            <Card title="Customers" className="lg:col-span-1">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-stone-2">Total</span><span>{customers.totalCustomers}</span></div>
                <div className="flex justify-between"><span className="text-stone-2">New</span><span>{customers.newCustomers}</span></div>
                <div className="flex justify-between"><span className="text-stone-2">Returning</span><span>{customers.returningCustomers}</span></div>
                <div className="flex justify-between"><span className="text-stone-2">Repeat rate</span><span>{customers.repeatPurchaseRate}%</span></div>
              </div>
            </Card>

            <Card title="Inventory alerts" className="lg:col-span-1">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-stone-2">Low stock</span><span>{data.inventory.lowStockCount}</span></div>
                <div className="flex justify-between"><span className="text-stone-2">Out of stock</span><span>{data.inventory.outOfStockCount}</span></div>
                <div className="flex justify-between"><span className="text-stone-2">Movements</span><span>{data.inventory.movementCount}</span></div>
              </div>
            </Card>
          </div>

          <Card title="Top products">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-left text-stone-2">
                  <th className="pb-2">Product</th>
                  <th className="pb-2 text-right">Units</th>
                  <th className="pb-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((p) => (
                  <tr key={`${p.productId}-${p.variantId}`} className="border-b border-hairline/50 last:border-0">
                    <td className="py-2">
                      {p.productName}
                      {p.variantName && <span className="text-stone-2 text-xs block">{p.variantName}</span>}
                    </td>
                    <td className="py-2 text-right">{p.unitsSold}</td>
                    <td className="py-2 text-right font-mono">{formatMoney(p.revenueMinor, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card title="Business signals">
            <ul className="space-y-2">
              {data.signals.map((s, i) => (
                <li key={i} className="text-sm">{s.message}</li>
              ))}
            </ul>
          </Card>

          <Card title="Recent orders">
            <div className="space-y-1">
              {data.recentOrders.map((o) => (
                <Link key={o.id} href={`/app/orders/${o.id}`} className="flex justify-between py-2 border-b border-hairline/50 last:border-0 text-sm hover:bg-paper/50 -mx-2 px-2 rounded-sm">
                  <span className="font-mono">{o.orderNumber}</span>
                  <span className="flex items-center gap-3">
                    <OrderStatusBadge status={o.status as never} />
                    <span className="font-mono">{formatMoney(o.totalMinor, o.currency)}</span>
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
