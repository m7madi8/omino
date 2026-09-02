/** Customer domain events — dispatched via central event bus. */

import {
  publishBusinessEvent,
  normalizeCustomerEvent,
} from '@/server/events/event-bus';

export type CustomerEventType =
  | 'customer.created'
  | 'customer.updated'
  | 'customer.order_created'
  | 'customer.order_completed'
  | 'customer.order_cancelled'
  | 'customer.order_refunded'
  | 'customer.payment_received'
  | 'customer.payment_refunded'
  | 'customer.tag_added'
  | 'customer.tag_removed'
  | 'customer.note_created';

export type CustomerEventPayload = {
  type: CustomerEventType;
  organizationId: string;
  customerId: string;
  userId?: string;
  storeId?: string;
  branchId?: string;
  payload?: Record<string, unknown>;
};

export async function emitCustomerEvent(event: CustomerEventPayload): Promise<void> {
  await publishBusinessEvent(normalizeCustomerEvent(event));
}
