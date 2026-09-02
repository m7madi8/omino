import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { listPayments } from '@/server/services/payment-service';
import { formatMoney } from '@/lib/money';
import { PaymentStatusBadge } from '@/components/commerce/status-badge';

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');

  if (!sessionHasPermission(session.user, 'payments.read')) {
    redirect('/app');
  }

  const { items, total } = await listPayments({
    organizationId: session.user.organizationId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display">Payments</h1>
        <p className="text-sm text-stone-2 mt-1">{total} payment records</p>
      </div>

      <div className="hidden md:block rounded-md border border-hairline bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline bg-paper text-left text-stone-2">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Cashier</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-stone-2">
                  No payments yet
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="border-b border-hairline last:border-0">
                  <td className="px-4 py-3 font-mono">{p.orderNumber}</td>
                  <td className="px-4 py-3 capitalize">{p.method.toLowerCase()}</td>
                  <td className="px-4 py-3">
                    <PaymentStatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3">{p.cashierName}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatMoney(p.amountMinor, p.currency)}
                  </td>
                  <td className="px-4 py-3 text-stone-2">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {items.map((p) => (
          <div key={p.id} className="rounded-md border border-hairline bg-white p-4">
            <div className="flex justify-between">
              <span className="font-mono">{p.orderNumber}</span>
              <span className="font-mono">{formatMoney(p.amountMinor, p.currency)}</span>
            </div>
            <div className="flex gap-2 mt-2">
              <PaymentStatusBadge status={p.status} />
              <span className="text-xs text-stone-2 capitalize">{p.method.toLowerCase()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
