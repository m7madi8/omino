import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { formatMoney } from '@/lib/money';
import { listOrders } from '@/server/services/order-service';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/app/dashboard/page-header';
import { OrderStatusBadge } from '@/components/app/dashboard/order-status-badge';
import { OrdersLiveRefresh } from '@/components/realtime/orders-live-refresh';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');
  if (!sessionHasPermission(session.user, 'orders.read')) redirect('/app');

  const params = await searchParams;
  const { items: orders, total, page, pageSize } = await listOrders({
    organizationId: session.user.organizationId,
    source: 'POS',
    search: params.q,
    page: Number(params.page || '1'),
  });

  const { prisma } = await import('@/lib/db');
  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { currency: true },
  });
  const currency = org?.currency || 'USD';

  return (
    <div className="max-w-6xl space-y-4 sm:space-y-6">
      <OrdersLiveRefresh
        organizationId={session.user.organizationId}
        storeId={session.user.storeId}
      />

      <PageHeader
        eyebrow="Orders"
        title="Sales history"
        description={`${total} order${total === 1 ? '' : 's'}`}
      />

      <form className="flex flex-col sm:flex-row gap-2">
        <input
          name="q"
          defaultValue={params.q || ''}
          placeholder="Search order or customer…"
          className="flex-1 h-11 min-h-[44px] px-4 rounded-sm border border-hairline text-base sm:text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="h-11 min-h-[44px] px-5 rounded-sm bg-ink text-paper text-sm font-medium touch-manipulation active:scale-[0.98]"
        >
          Search
        </button>
      </form>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Complete your first sale in POS to see orders here."
          action={{ label: 'Open POS', href: '/app/pos' }}
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-hairline text-left text-stone-2">
                    <th className="pb-3 pr-4 font-medium">Order</th>
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 pr-4 font-medium">Customer</th>
                    <th className="pb-3 pr-4 font-medium">Cashier</th>
                    <th className="pb-3 pr-4 font-medium">Payment</th>
                    <th className="pb-3 pr-4 font-medium">Total</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-hairline/60 last:border-0 hover:bg-paper/50"
                    >
                      <td className="py-3 pr-4">
                        <Link
                          href={`/app/orders/${order.id}`}
                          className="font-mono text-accent hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-stone-2 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4">{order.customerName || '—'}</td>
                      <td className="py-3 pr-4 text-stone-2">{order.cashierName}</td>
                      <td className="py-3 pr-4">{order.paymentStatus}</td>
                      <td className="py-3 pr-4 font-mono">
                        {formatMoney(order.totalMinor, currency)}
                      </td>
                      <td className="py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/app/orders/${order.id}`}
                className="block rounded-md border border-hairline bg-white p-4 touch-manipulation active:bg-paper/80 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm text-accent truncate">{order.orderNumber}</p>
                    <p className="text-xs text-stone-2 mt-1">
                      {new Date(order.createdAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <p className="font-mono text-sm shrink-0">
                    {formatMoney(order.totalMinor, currency)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-xs text-stone-2">{order.paymentStatus}</span>
                </div>
                {(order.customerName || order.cashierName) && (
                  <p className="mt-2 text-xs text-stone-2 truncate">
                    {[order.customerName, order.cashierName && `· ${order.cashierName}`]
                      .filter(Boolean)
                      .join(' ')}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </>
      )}

      {total > pageSize && (
        <div className="flex gap-2 justify-center pt-2">
          {page > 1 && (
            <Link
              href={`/app/orders?page=${page - 1}${params.q ? `&q=${params.q}` : ''}`}
              className="min-h-[44px] px-4 py-2.5 rounded-sm border border-hairline text-sm touch-manipulation flex items-center"
            >
              Previous
            </Link>
          )}
          {page * pageSize < total && (
            <Link
              href={`/app/orders?page=${page + 1}${params.q ? `&q=${params.q}` : ''}`}
              className="min-h-[44px] px-4 py-2.5 rounded-sm border border-hairline text-sm touch-manipulation flex items-center"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
