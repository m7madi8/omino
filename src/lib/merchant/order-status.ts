import type { FulfillmentStatus, OrderStatus, PaymentStatus } from '@/types/prisma-enums';
import type { MessageKey } from '@/lib/i18n/messages/en';

export type MerchantOrderStage =
  | 'new'
  | 'confirmed'
  | 'processing'
  | 'out_for_delivery'
  | 'delivered'
  | 'collected'
  | 'cancelled';

export function resolveMerchantOrderStage(order: {
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  paymentStatus: PaymentStatus;
  events?: { eventType: string }[];
}): MerchantOrderStage {
  if (order.status === 'CANCELLED') return 'cancelled';
  if (order.status === 'COMPLETED' && order.paymentStatus === 'PAID') return 'collected';

  const hasOutForDelivery = order.events?.some(
    (e) => e.eventType === 'delivery.out_for_delivery'
  );
  const hasDelivered = order.events?.some((e) => e.eventType === 'delivery.delivered');

  if (hasDelivered || order.fulfillmentStatus === 'FULFILLED') return 'delivered';
  if (hasOutForDelivery || order.fulfillmentStatus === 'PARTIALLY_FULFILLED') {
    return 'out_for_delivery';
  }
  if (order.status === 'PROCESSING') return 'processing';
  if (order.status === 'CONFIRMED') return 'confirmed';
  return 'new';
}

const STAGE_LABEL_KEYS: Record<MerchantOrderStage, MessageKey> = {
  new: 'orders.status.new',
  confirmed: 'orders.status.confirmed',
  processing: 'orders.status.processing',
  out_for_delivery: 'orders.status.outForDelivery',
  delivered: 'orders.status.delivered',
  collected: 'orders.status.collected',
  cancelled: 'orders.status.cancelled',
};

export function getOrderStageLabelKey(stage: MerchantOrderStage): MessageKey {
  return STAGE_LABEL_KEYS[stage];
}

export type OrderLifecycleAction =
  | 'confirm'
  | 'process'
  | 'out_for_delivery'
  | 'deliver'
  | 'collect_cod'
  | 'cancel';

export function getNextOrderAction(stage: MerchantOrderStage): OrderLifecycleAction | null {
  switch (stage) {
    case 'new':
      return 'confirm';
    case 'confirmed':
      return 'process';
    case 'processing':
      return 'out_for_delivery';
    case 'out_for_delivery':
      return 'deliver';
    case 'delivered':
      return 'collect_cod';
    default:
      return null;
  }
}
