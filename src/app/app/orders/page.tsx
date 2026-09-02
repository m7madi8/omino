import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { formatMoney } from '@/lib/money';
import { listOrders } from '@/server/services/order-service';
import { Card } from '@/components/ui/card';
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
    <div className="max-w-6xl space-y-6">
      <OrdersLiveRefresh
        organizationId={session.user.organizationId}
        storeId={session.user.storeId}
      />
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-stone mb-2">Orders</p>
        <h1 className="text-3xl font-display">Sales history</h1>
        <p className="mt-2 text-stone-2">{total} orders</p>
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={params.q || ''}
          placeholder="Search order number or customer…"
          className="flex-1 h-11 px-4 rounded-sm border border-hairline text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="h-11 px-5 rounded-sm bg-ink text-paper text-sm font-medium"
        >
          Search
        </button>
      </form>

      <Card>
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
                <tr key={order.id} className="border-b border-hairline/60 last:border-0 hover:bg-paper/50">
                  <td className="py-3 pr-4">
                    <Link href={`/app/orders/${order.id}`} className="font-mono text-accent hover:underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-stone-2">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 pr-4">{order.customerName || '—'}</td>
                  <td className="py-3 pr-4 text-stone-2">{order.cashierName}</td>
                  <td className="py-3 pr-4">{order.paymentStatus}</td>
                  <td className="py-3 pr-4 font-mono">{formatMoney(order.totalMinor, currency)}</td>
                  <td className="py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-sm text-xs font-mono ${
                        order.status === 'COMPLETED'
                          ? 'bg-good/15 text-good'
                          : order.status === 'CANCELLED'
                            ? 'bg-danger/15 text-danger'
                            : 'bg-paper-2'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!orders.length && (
            <p className="text-center text-stone-2 py-8">No orders yet. Complete a sale in POS.</p>
          )}
        </div>
      </Card>

      {total > pageSize && (
        <div className="flex gap-2 justify-center">
          {page > 1 && (
            <Link
              href={`/app/orders?page=${page - 1}${params.q ? `&q=${params.q}` : ''}`}
              className="px-4 py-2 rounded-sm border border-hairline text-sm"
            >
              Previous
            </Link>
          )}
          {page * pageSize < total && (
            <Link
              href={`/app/orders?page=${page + 1}${params.q ? `&q=${params.q}` : ''}`}
              className="px-4 py-2 rounded-sm border border-hairline text-sm"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
