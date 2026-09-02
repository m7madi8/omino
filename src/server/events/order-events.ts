/** Order domain events — dispatched via central event bus. */

import {
  publishBusinessEvent,
  normalizeOrderEvent,
} from '@/server/events/event-bus';

export type OrderEventType =
  | 'order.created'
  | 'order.updated'
  | 'order.confirmed'
  | 'order.cancelled'
  | 'order.completed'
  | 'order.refunded'
  | 'payment.created'
  | 'payment.received'
  | 'payment.paid'
  | 'payment.failed'
  | 'payment.refunded'
  | 'refund.created';

export type OrderEventPayload = {
  type: OrderEventType;
  organizationId: string;
  orderId: string;
  userId?: string;
  storeId?: string;
  branchId?: string;
  payload?: Record<string, unknown>;
};

export async function emitOrderEvent(event: OrderEventPayload): Promise<void> {
  const normalized = normalizeOrderEvent(event);
  const mappedType =
    event.type === 'payment.paid' || event.type === 'payment.created'
      ? 'payment.received'
      : event.type;
  await publishBusinessEvent({ ...normalized, type: mappedType });
}
