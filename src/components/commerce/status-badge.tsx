import { cn } from '@/lib/utils';
import type {
  FulfillmentStatus,
  OrderSource,
  OrderStatus,
  PaymentStatus,
} from '@/types/prisma-enums';

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  DRAFT: 'bg-paper-2 text-stone-2 border-hairline',
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-accent/10 text-accent border-accent/30',
  PROCESSING: 'bg-blue-50 text-blue-800 border-blue-200',
  COMPLETED: 'bg-good/15 text-good border-good/30',
  CANCELLED: 'bg-danger/10 text-danger border-danger/30',
};

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  AUTHORIZED: 'bg-accent/10 text-accent border-accent/30',
  PAID: 'bg-good/15 text-good border-good/30',
  PARTIALLY_PAID: 'bg-amber-50 text-amber-800 border-amber-200',
  FAILED: 'bg-danger/10 text-danger border-danger/30',
  REFUNDED: 'bg-stone/10 text-stone border-hairline',
  PARTIALLY_REFUNDED: 'bg-stone/10 text-stone-2 border-hairline',
  CANCELLED: 'bg-paper-2 text-stone-2 border-hairline',
};

const FULFILLMENT_STATUS_STYLES: Record<FulfillmentStatus, string> = {
  UNFULFILLED: 'bg-amber-50 text-amber-800 border-amber-200',
  PARTIALLY_FULFILLED: 'bg-blue-50 text-blue-800 border-blue-200',
  FULFILLED: 'bg-good/15 text-good border-good/30',
  CANCELLED: 'bg-danger/10 text-danger border-danger/30',
};

function Badge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border capitalize',
        className
      )}
    >
      {label.replace(/_/g, ' ').toLowerCase()}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge label={status} className={ORDER_STATUS_STYLES[status]} />;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge label={status} className={PAYMENT_STATUS_STYLES[status]} />;
}

export function FulfillmentStatusBadge({ status }: { status: FulfillmentStatus }) {
  return <Badge label={status} className={FULFILLMENT_STATUS_STYLES[status]} />;
}

export function OrderSourceBadge({ source }: { source: OrderSource }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border bg-paper text-stone-2 border-hairline uppercase tracking-wide">
      {source}
    </span>
  );
}
