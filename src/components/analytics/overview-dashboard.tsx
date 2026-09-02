import Link from 'next/link';
import { formatMoney } from '@/lib/money';
import { Card } from '@/components/ui/card';
import { KpiCard } from '@/components/analytics/kpi-card';
import { SimpleLineChart } from '@/components/analytics/simple-line-chart';
import type { AnalyticsOverview } from '@/types/analytics';
import { OrderStatusBadge } from '@/components/commerce/status-badge';

export function OverviewDashboard({ data }: { data: AnalyticsOverview }) {
  const { currency, sales, salesComparison, customers, customersComparison } = data;

  if (!data.hasData) {
    return (
      <Card title="Business overview">
        <p className="text-stone-2 text-sm leading-relaxed">
          No sales data yet for {data.range.label.toLowerCase()}. Complete a sale in POS or your online
          store to see revenue, orders, and product insights here.
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/app/pos" className="text-sm text-accent hover:underline">
            Open POS →
          </Link>
          <Link href="/app/analytics" className="text-sm text-accent hover:underline">
            Analytics →
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-stone-2">{data.range.label} · compared to previous period</p>
        <Link href="/app/analytics" className="text-sm text-accent hover:underline">
          Full analytics →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Revenue"
          value={sales.grossSalesMinor}
          currency={currency}
          comparison={salesComparison.grossSalesMinor}
        />
        <KpiCard
          label="Orders"
          value={sales.completedOrders}
          comparison={salesComparison.orderCount}
          format="number"
        />
        <KpiCard
          label="AOV"
          value={sales.averageOrderValueMinor}
          currency={currency}
          comparison={salesComparison.averageOrderValueMinor}
        />
        <KpiCard
          label="New customers"
          value={customers.newCustomers}
          comparison={customersComparison.newCustomers}
          format="number"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Revenue trend">
          <SimpleLineChart data={data.revenueSeries} valueKey="revenueMinor" height={140} />
        </Card>
        <Card title="Orders trend">
          <SimpleLineChart data={data.ordersSeries} valueKey="orderCount" height={140} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Top products">
          <div className="space-y-2">
            {data.topProducts.slice(0, 5).map((p) => (
              <div key={`${p.productId}-${p.variantId}`} className="flex justify-between text-sm gap-2">
                <span className="truncate">{p.productName}</span>
                <span className="font-mono shrink-0">{formatMoney(p.revenueMinor, currency)}</span>
              </div>
            ))}
            {!data.topProducts.length && (
              <p className="text-sm text-stone-2">No product sales yet.</p>
            )}
          </div>
        </Card>

        <Card title="Inventory alerts">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-2">Low stock</span>
              <span>{data.inventory.lowStockCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-2">Out of stock</span>
              <span>{data.inventory.outOfStockCount}</span>
            </div>
            {data.inventory.alerts.slice(0, 3).map((a) => (
              <p key={a.variantId} className="text-xs text-stone-2 truncate">
                {a.productName} — {a.available} left
              </p>
            ))}
          </div>
        </Card>

        <Card title="Customer insights">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-2">New</span>
              <span>{customers.newCustomers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-2">Returning</span>
              <span>{customers.returningCustomers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-2">Repeat rate</span>
              <span>{customers.repeatPurchaseRate}%</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Business signals">
          <ul className="space-y-2">
            {data.signals.map((s, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span
                  className={`shrink-0 mt-1 w-2 h-2 rounded-full ${
                    s.severity === 'CRITICAL'
                      ? 'bg-danger'
                      : s.severity === 'WARNING'
                        ? 'bg-amber-400'
                        : 'bg-accent'
                  }`}
                />
                <span>{s.message}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Recent orders">
          <div className="space-y-2">
            {data.recentOrders.map((o) => (
              <Link
                key={o.id}
                href={`/app/orders/${o.id}`}
                className="flex items-center justify-between gap-2 py-2 border-b border-hairline/60 last:border-0 hover:bg-paper/50 -mx-2 px-2 rounded-sm"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm truncate">{o.orderNumber}</p>
                  <p className="text-xs text-stone-2 truncate">{o.customerName || 'Walk-in'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-sm">{formatMoney(o.totalMinor, o.currency)}</p>
                  <OrderStatusBadge status={o.status as never} />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
