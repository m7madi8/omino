import { publishBusinessEvent } from '@/server/events/event-bus';

export async function emitMarketingEvent(event: {
  type: string;
  organizationId: string;
  userId?: string;
  storeId?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
}) {
  return publishBusinessEvent({
    type: event.type,
    organizationId: event.organizationId,
    storeId: event.storeId,
    actorId: event.userId,
    entityType: 'marketing',
    entityId: event.entityId,
    source: 'marketing',
    payload: event.payload ?? {},
  });
}
