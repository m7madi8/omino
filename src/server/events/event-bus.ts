import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { BusinessEventInput } from '@/types/automation';
import { processEventForAutomations } from '@/server/automation/execution-service';

export async function publishBusinessEvent(input: BusinessEventInput): Promise<string> {
  const event = await prisma.businessEvent.create({
    data: {
      organizationId: input.organizationId,
      storeId: input.storeId ?? undefined,
      branchId: input.branchId ?? undefined,
      actorId: input.actorId ?? undefined,
      type: input.type,
      entityType: input.entityType ?? undefined,
      entityId: input.entityId ?? undefined,
      source: input.source ?? 'domain',
      payload: input.payload as Prisma.InputJsonValue,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });

  // Downstream processing — failure isolated from business transaction
  const skipAutomation =
    input.source === 'automation' ||
    input.metadata?.skipAutomation === true;

  if (!skipAutomation) {
    void processEventForAutomations({
      ...input,
      id: event.id,
    }).catch((err) => {
      console.error('[automation] event processing failed', event.id, err);
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[business-event]', input.type, input.entityId ?? '', input.payload);
  }

  return event.id;
}

export function normalizeOrderEvent(event: {
  type: string;
  organizationId: string;
  orderId: string;
  userId?: string;
  storeId?: string;
  branchId?: string;
  payload?: Record<string, unknown>;
}): BusinessEventInput {
  return {
    type: event.type,
    organizationId: event.organizationId,
    storeId: event.storeId,
    branchId: event.branchId,
    actorId: event.userId,
    entityType: 'order',
    entityId: event.orderId,
    source: 'orders',
    payload: { orderId: event.orderId, ...event.payload },
  };
}

export function normalizeCustomerEvent(event: {
  type: string;
  organizationId: string;
  customerId: string;
  userId?: string;
  storeId?: string;
  branchId?: string;
  payload?: Record<string, unknown>;
}): BusinessEventInput {
  return {
    type: event.type,
    organizationId: event.organizationId,
    storeId: event.storeId,
    branchId: event.branchId,
    actorId: event.userId,
    entityType: 'customer',
    entityId: event.customerId,
    source: 'customers',
    payload: { customerId: event.customerId, ...event.payload },
  };
}

export function normalizeCatalogEvent(event: {
  type: string;
  organizationId: string;
  userId?: string;
  storeId?: string;
  branchId?: string;
  payload: Record<string, unknown>;
}): BusinessEventInput {
  const entityType =
    event.type.startsWith('product') || event.type.startsWith('variant')
      ? 'product'
      : event.type.startsWith('inventory')
        ? 'inventory'
        : event.type.startsWith('pos')
          ? 'pos'
          : undefined;

  const entityId =
    (event.payload.productId as string) ||
    (event.payload.variantId as string) ||
    (event.payload.orderId as string) ||
    undefined;

  return {
    type: event.type,
    organizationId: event.organizationId,
    storeId: event.storeId,
    branchId: event.branchId,
    actorId: event.userId,
    entityType,
    entityId,
    source: 'catalog',
    payload: event.payload,
  };
}
