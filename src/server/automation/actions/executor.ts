import { z } from 'zod';
import { prisma } from '@/lib/db';
import { attachTagToCustomer, detachTagFromCustomer } from '@/server/services/customer-tag-service';
import { updateCustomer } from '@/server/services/customer-service';
import { createCustomerNote } from '@/server/services/customer-timeline-service';
import { recordOrderEvent } from '@/server/services/order-service';
import { adjustStock } from '@/server/services/inventory-service';
import { updateProduct } from '@/server/services/product-service';
import { createInternalNotification } from '@/server/automation/notification-service';
import type { AutomationExecutionContext } from '@/types/automation';
import { getActionDefinition } from '@/server/automation/actions/registry';

const ACTION_INPUT_SCHEMAS: Record<string, z.ZodType<unknown>> = {
  add_customer_tag: z.object({
    customerId: z.string().uuid(),
    tagId: z.string().uuid().optional(),
    tagName: z.string().optional(),
  }),
  remove_customer_tag: z.object({
    customerId: z.string().uuid(),
    tagId: z.string().uuid(),
  }),
  update_customer: z.object({
    customerId: z.string().uuid(),
    notes: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).optional(),
  }),
  create_customer_note: z.object({
    customerId: z.string().uuid(),
    content: z.string().min(1).max(5000),
  }),
  add_order_note: z.object({
    orderId: z.string().uuid(),
    note: z.string().min(1).max(2000),
  }),
  create_inventory_adjustment: z.object({
    variantId: z.string().uuid(),
    stockLocationId: z.string().uuid(),
    quantityDelta: z.number().int(),
    reason: z.string().max(500).optional(),
  }),
  update_product_status: z.object({
    productId: z.string().uuid(),
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
  }),
  send_notification: z.object({
    title: z.string().min(1).max(200),
    body: z.string().min(1).max(5000),
    userId: z.string().uuid().optional(),
  }),
};

function resolveTemplateValue(
  value: unknown,
  context: AutomationExecutionContext
): unknown {
  if (typeof value !== 'string') return value;
  if (!value.startsWith('{{') || !value.endsWith('}}')) return value;

  const path = value.slice(2, -2).trim();
  const parts = path.split('.');
  let current: unknown = { event: context.event, ...context.enrichedData };
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function resolveInput(
  input: Record<string, unknown>,
  context: AutomationExecutionContext
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      resolved[key] = resolveInput(value as Record<string, unknown>, context);
    } else {
      resolved[key] = resolveTemplateValue(value, context);
    }
  }
  return resolved;
}

export async function executeAutomationAction(
  actionType: string,
  rawInput: Record<string, unknown>,
  context: AutomationExecutionContext,
  idempotencyKey?: string
): Promise<Record<string, unknown>> {
  const def = getActionDefinition(actionType);
  if (!def) throw new Error('UNKNOWN_ACTION');

  const schema = ACTION_INPUT_SCHEMAS[actionType];
  if (!schema) throw new Error('INVALID_ACTION_SCHEMA');

  const resolved = resolveInput(rawInput, context);
  const parsed = schema.safeParse(resolved);
  if (!parsed.success) throw new Error('VALIDATION_ERROR');

  const input = parsed.data as Record<string, unknown>;
  const orgId = context.organizationId;
  const actorId = context.actorId ?? undefined;

  switch (actionType) {
    case 'add_customer_tag': {
      let tagId = input.tagId as string | undefined;
      if (!tagId && input.tagName) {
        const tag = await prisma.customerTag.findFirst({
          where: { organizationId: orgId, name: input.tagName as string },
        });
        if (!tag) {
          const created = await prisma.customerTag.create({
            data: {
              organizationId: orgId,
              name: input.tagName as string,
              slug: (input.tagName as string).toLowerCase().replace(/\s+/g, '-'),
            },
          });
          tagId = created.id;
        } else {
          tagId = tag.id;
        }
      }
      if (!tagId) throw new Error('VALIDATION_ERROR');
      await attachTagToCustomer(orgId, input.customerId as string, tagId, actorId);
      return { customerId: input.customerId, tagId };
    }

    case 'remove_customer_tag':
      await detachTagFromCustomer(
        orgId,
        input.customerId as string,
        input.tagId as string,
        actorId
      );
      return { customerId: input.customerId, tagId: input.tagId };

    case 'update_customer': {
      const customer = await updateCustomer(
        orgId,
        input.customerId as string,
        actorId,
        {
          notes: input.notes as string | undefined,
          status: input.status as 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | undefined,
        }
      );
      return { customerId: customer.id };
    }

    case 'create_customer_note': {
      const note = await createCustomerNote(
        orgId,
        input.customerId as string,
        actorId ?? orgId,
        input.content as string
      );
      return { noteId: note.id };
    }

    case 'add_order_note': {
      await prisma.$transaction(async (tx) => {
        await recordOrderEvent(tx, {
          organizationId: orgId,
          orderId: input.orderId as string,
          userId: actorId,
          eventType: 'automation.note_added',
          metadata: { note: input.note, idempotencyKey },
        });
      });
      return { orderId: input.orderId };
    }

    case 'create_inventory_adjustment': {
      const result = await adjustStock({
        organizationId: orgId,
        userId: actorId ?? orgId,
        variantId: input.variantId as string,
        stockLocationId: input.stockLocationId as string,
        quantityDelta: input.quantityDelta as number,
        type: 'ADJUSTMENT',
        reason: (input.reason as string) || 'Automation adjustment',
        referenceType: 'automation',
        referenceId: idempotencyKey,
      });
      return { movementId: result.movement.id };
    }

    case 'update_product_status': {
      const product = await updateProduct(
        orgId,
        actorId ?? orgId,
        input.productId as string,
        { status: input.status as 'DRAFT' | 'ACTIVE' | 'ARCHIVED' }
      );
      return { productId: product.id, status: product.status };
    }

    case 'send_notification': {
      const notification = await createInternalNotification({
        organizationId: orgId,
        userId: input.userId as string | undefined,
        title: input.title as string,
        body: input.body as string,
        metadata: { source: 'automation', idempotencyKey },
      });
      return { notificationId: notification.id };
    }

    default:
      throw new Error('UNKNOWN_ACTION');
  }
}
