/**
 * Catalog domain events — dispatched via central event bus.
 */

import {
  publishBusinessEvent,
  normalizeCatalogEvent,
} from '@/server/events/event-bus';

export type CatalogEventType =
  | 'product.created'
  | 'product.updated'
  | 'product.archived'
  | 'variant.created'
  | 'variant.updated'
  | 'inventory.adjusted'
  | 'inventory.low_stock'
  | 'inventory.out_of_stock'
  | 'inventory.received'
  | 'inventory.transferred'
  | 'inventory.decremented'
  | 'category.created'
  | 'category.updated'
  | 'pos.sale_completed'
  | 'pos.session.opened'
  | 'pos.session.closed'
  | 'cart.created'
  | 'cart.held'
  | 'order.created'
  | 'order.completed'
  | 'order.voided'
  | 'payment.created'
  | 'payment.failed'
  | 'store.order_created'
  | 'store.checkout_started'
  | 'store.checkout_completed';

export type CatalogEvent = {
  type: CatalogEventType;
  organizationId: string;
  userId?: string;
  storeId?: string;
  branchId?: string;
  source?: string;
  payload: Record<string, unknown>;
  timestamp?: Date;
};

export async function emitCatalogEvent(event: Omit<CatalogEvent, 'timestamp'>) {
  const normalized = normalizeCatalogEvent(event);
  const busInput = {
    ...normalized,
    source: event.source ?? normalized.source,
  };

  if (event.type === 'inventory.low_stock' && (event.payload.available as number) === 0) {
    await publishBusinessEvent({
      ...busInput,
      type: 'inventory.out_of_stock',
    });
  }

  if (event.type === 'order.completed' && event.payload.source === 'POS') {
    await publishBusinessEvent({
      ...busInput,
      type: 'pos.sale_completed',
      payload: event.payload,
    });
  }

  await publishBusinessEvent(busInput);
  return { ...event, timestamp: new Date() };
}
