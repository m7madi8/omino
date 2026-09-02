import type { AutomationActionDefinition } from '@/types/automation';

export const AUTOMATION_ACTIONS: AutomationActionDefinition[] = [
  {
    type: 'add_customer_tag',
    name: 'Add Customer Tag',
    description: 'Add a tag to a customer',
    permissions: ['customers.manage_tags', 'automations.execute'],
    riskLevel: 'LOW',
    idempotencySupport: true,
    inputSchema: {
      type: 'object',
      properties: {
        customerId: { type: 'string' },
        tagId: { type: 'string' },
        tagName: { type: 'string' },
      },
      required: ['customerId'],
    },
  },
  {
    type: 'remove_customer_tag',
    name: 'Remove Customer Tag',
    description: 'Remove a tag from a customer',
    permissions: ['customers.manage_tags', 'automations.execute'],
    riskLevel: 'LOW',
    idempotencySupport: true,
    inputSchema: {
      type: 'object',
      properties: { customerId: { type: 'string' }, tagId: { type: 'string' } },
      required: ['customerId', 'tagId'],
    },
  },
  {
    type: 'update_customer',
    name: 'Update Customer',
    description: 'Update customer fields',
    permissions: ['customers.write', 'automations.execute'],
    riskLevel: 'MEDIUM',
    idempotencySupport: true,
    inputSchema: {
      type: 'object',
      properties: {
        customerId: { type: 'string' },
        notes: { type: 'string' },
        status: { type: 'string' },
      },
      required: ['customerId'],
    },
  },
  {
    type: 'create_customer_note',
    name: 'Create Customer Note',
    description: 'Add a note to a customer timeline',
    permissions: ['customers.manage_notes', 'automations.execute'],
    riskLevel: 'LOW',
    idempotencySupport: true,
    inputSchema: {
      type: 'object',
      properties: { customerId: { type: 'string' }, content: { type: 'string' } },
      required: ['customerId', 'content'],
    },
  },
  {
    type: 'add_order_note',
    name: 'Add Order Note',
    description: 'Record a note on an order via order event',
    permissions: ['orders.write', 'automations.execute'],
    riskLevel: 'LOW',
    idempotencySupport: true,
    inputSchema: {
      type: 'object',
      properties: { orderId: { type: 'string' }, note: { type: 'string' } },
      required: ['orderId', 'note'],
    },
  },
  {
    type: 'create_inventory_adjustment',
    name: 'Adjust Inventory',
    description: 'Create an inventory adjustment via Inventory Service',
    permissions: ['inventory.write', 'automations.execute'],
    riskLevel: 'MEDIUM',
    idempotencySupport: true,
    inputSchema: {
      type: 'object',
      properties: {
        variantId: { type: 'string' },
        stockLocationId: { type: 'string' },
        quantityDelta: { type: 'number' },
        reason: { type: 'string' },
      },
      required: ['variantId', 'stockLocationId', 'quantityDelta'],
    },
  },
  {
    type: 'update_product_status',
    name: 'Update Product Status',
    description: 'Change product status',
    permissions: ['products.write', 'automations.execute'],
    riskLevel: 'MEDIUM',
    idempotencySupport: true,
    inputSchema: {
      type: 'object',
      properties: { productId: { type: 'string' }, status: { type: 'string' } },
      required: ['productId', 'status'],
    },
  },
  {
    type: 'send_notification',
    name: 'Send Internal Notification',
    description: 'Send an in-app notification',
    permissions: ['automations.execute'],
    riskLevel: 'LOW',
    idempotencySupport: true,
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        body: { type: 'string' },
        userId: { type: 'string' },
      },
      required: ['title', 'body'],
    },
  },
];

export function getActionDefinition(type: string): AutomationActionDefinition | undefined {
  return AUTOMATION_ACTIONS.find((a) => a.type === type);
}
