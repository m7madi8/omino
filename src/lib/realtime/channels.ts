import type { RealtimeTable } from '@/lib/realtime/types';

export const REALTIME_SCOPES = [
  'orders',
  'inventory',
  'customers',
  'products',
  'store',
  'events',
  'ai',
] as const;

export type RealtimeScope = (typeof REALTIME_SCOPES)[number];

/** Scoped channel name: org + optional store filter. */
export function tenantChannelName(
  organizationId: string,
  scope: RealtimeScope,
  storeId?: string | null
) {
  const storePart = storeId ? `:store:${storeId}` : '';
  return `omino:${organizationId}${storePart}:${scope}`;
}

export const REALTIME_TABLES: Record<RealtimeScope, RealtimeTable[]> = {
  orders: ['orders', 'payments'],
  inventory: ['stock_levels'],
  customers: ['customers'],
  products: ['products'],
  store: ['stores'],
  events: ['business_events'],
  ai: ['ai_actions'],
};

export function postgresFilterForTable(
  table: RealtimeTable,
  organizationId: string,
  storeId?: string | null
): string {
  const base = `organization_id=eq.${organizationId}`;
  if (storeId && (table === 'orders' || table === 'payments' || table === 'stock_levels')) {
    return `${base},store_id=eq.${storeId}`;
  }
  return base;
}
