import { notFound } from 'next/navigation';
import { getPublicOrder } from '@/server/services/storefront-service';
import { formatMoney } from '@/lib/money';

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string; orderNumber: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { storeSlug, orderNumber } = await params;
  const { token } = await searchParams;

  if (!token) notFound();

  let order;
  try {
    order = await getPublicOrder(storeSlug, orderNumber, token);
  } catch {
    notFound();
  }

  const addr = order.shippingAddress;

  return (
    <div className="max-w-xl mx-auto space-y-8 text-center py-8">
      <div>
        <p className="text-sm text-good font-mono uppercase tracking-wider">Order confirmed</p>
        <h1 className="text-3xl font-display mt-2">Thank you!</h1>
        <p className="font-mono text-stone-2 mt-2">{order.orderNumber}</p>
      </div>

      <div className="text-left p-5 rounded-md border border-hairline bg-white space-y-4">
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm gap-4">
              <span>
                {item.quantity}× {item.productName}
                {item.variantName && ` (${item.variantName})`}
              </span>
              <span className="font-mono shrink-0">{formatMoney(item.subtotalMinor, order.currency)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-hairline pt-3 space-y-1 text-sm">
          {order.shippingAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-stone-2">Shipping</span>
              <span>{formatMoney(order.shippingAmount, order.currency)}</span>
            </div>
          )}
          {order.taxAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-stone-2">Tax</span>
              <span>{formatMoney(order.taxAmount, order.currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-display text-lg">
            <span>Total</span>
            <span>{formatMoney(order.totalMinor, order.currency)}</span>
          </div>
        </div>
      </div>

      <div className="text-left p-5 rounded-md border border-hairline bg-white text-sm space-y-2">
        <p>
          <span className="text-stone-2">Payment:</span> {order.paymentMethod}
        </p>
        <p>
          <span className="text-stone-2">Status:</span> {order.status}
        </p>
        {addr && (
          <p>
            <span className="text-stone-2">Delivery:</span> {addr.fullName}, {addr.address}, {addr.city},{' '}
            {addr.country}
          </p>
        )}
      </div>
    </div>
  );
}
