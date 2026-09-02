import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { formatMoney } from '@/lib/money';
import { getOrderDetail } from '@/server/services/order-service';
import { Card } from '@/components/ui/card';
import { VoidOrderButton } from '@/components/pos/void-order-button';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');
  if (!sessionHasPermission(session.user, 'orders.read')) redirect('/app');

  const { id } = await params;

  let order;
  try {
    order = await getOrderDetail(session.user.organizationId, id);
  } catch {
    notFound();
  }

  const currency = order.currency;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/app/orders" className="text-sm text-stone-2 hover:text-ink">
            ← Back to orders
          </Link>
          <h1 className="text-3xl font-display mt-2 font-mono">{order.orderNumber}</h1>
          <p className="mt-1 text-stone-2">
            {new Date(order.createdAt).toLocaleString()} · {order.branchName}
          </p>
        </div>
        <span
          className={`inline-flex px-3 py-1 rounded-sm text-xs font-mono ${
            order.status === 'COMPLETED'
              ? 'bg-good/15 text-good'
              : order.status === 'CANCELLED'
                ? 'bg-danger/15 text-danger'
                : 'bg-paper-2'
          }`}
        >
          {order.status}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Cashier">
          <p>{order.cashierName}</p>
        </Card>
        <Card title="Customer">
          <p>{order.customerName || 'Walk-in'}</p>
        </Card>
      </div>

      <Card title="Items">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-stone-2">
              <th className="pb-2 font-medium">Product</th>
              <th className="pb-2 font-medium">SKU</th>
              <th className="pb-2 font-medium text-right">Qty</th>
              <th className="pb-2 font-medium text-right">Price</th>
              <th className="pb-2 font-medium text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-hairline/50 last:border-0">
                <td className="py-2">
                  {item.productName}
                  {item.variantName && (
                    <span className="text-stone-2 text-xs block">{item.variantName}</span>
                  )}
                </td>
                <td className="py-2 font-mono text-xs text-stone-2">{item.sku}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right font-mono">
                  {formatMoney(item.unitPriceMinor, currency)}
                </td>
                <td className="py-2 text-right font-mono">
                  {formatMoney(item.subtotalMinor, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 pt-4 border-t border-hairline space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-2">Subtotal</span>
            <span>{formatMoney(order.subtotalMinor, currency)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-good">
              <span>Discount</span>
              <span>-{formatMoney(order.discountAmount, currency)}</span>
            </div>
          )}
          {order.taxAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-stone-2">Tax</span>
              <span>{formatMoney(order.taxAmount, currency)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-display pt-2">
            <span>Total</span>
            <span>{formatMoney(order.totalMinor, currency)}</span>
          </div>
        </div>
      </Card>

      <Card title="Payments">
        {order.payments.map((p) => (
          <div key={p.id} className="flex justify-between text-sm py-1">
            <span>
              {p.method}
              {p.changeMinor != null && p.changeMinor > 0 && (
                <span className="text-stone-2 ml-2">
                  (change: {formatMoney(p.changeMinor, currency)})
                </span>
              )}
            </span>
            <span className="font-mono">{formatMoney(p.amountMinor, currency)}</span>
          </div>
        ))}
      </Card>

      {order.status === 'CANCELLED' && (
        <Card title="Cancellation details">
          <p className="text-sm text-stone-2">
            Cancelled {order.cancelledAt && new Date(order.cancelledAt).toLocaleString()}
          </p>
          {order.cancelReason && <p className="text-sm mt-1">{order.cancelReason}</p>}
        </Card>
      )}

      {order.status === 'COMPLETED' && sessionHasPermission(session.user, 'pos.void') && (
        <VoidOrderButton orderId={order.id} />
      )}
    </div>
  );
}
