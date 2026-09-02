/** Canonical OMINO realtime business event types (postgres_changes + broadcast). */
export const REALTIME_EVENT_TYPES = [
  'ORDER_CREATED',
  'ORDER_UPDATED',
  'ORDER_COMPLETED',
  'ORDER_CANCELLED',
  'PAYMENT_CREATED',
  'PAYMENT_UPDATED',
  'PAYMENT_REFUNDED',
  'INVENTORY_UPDATED',
  'INVENTORY_LOW',
  'INVENTORY_OUT_OF_STOCK',
  'CUSTOMER_CREATED',
  'CUSTOMER_UPDATED',
  'PRODUCT_CREATED',
  'PRODUCT_UPDATED',
  'STORE_UPDATED',
  'AI_ACTION_STARTED',
  'AI_ACTION_COMPLETED',
  'AI_ACTION_FAILED',
] as const;

export type RealtimeEventType = (typeof REALTIME_EVENT_TYPES)[number];

export type RealtimeConnectionStatus =
  | 'disabled'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'offline';

export type RealtimeTable =
  | 'orders'
  | 'payments'
  | 'stock_levels'
  | 'customers'
  | 'products'
  | 'stores'
  | 'business_events'
  | 'ai_actions';

export type PostgresChangePayload<T extends Record<string, unknown> = Record<string, unknown>> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  table: RealtimeTable;
  new: T | null;
  old: T | null;
};
