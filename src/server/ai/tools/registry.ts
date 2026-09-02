import { z } from 'zod';
import type { ToolDefinition } from '@/types/ai';

const periodSchema = z.enum(['this_month', 'last_7_days', 'last_30_days', 'previous_month']).optional();

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'get_sales_summary',
    description: 'Get sales summary for a date range including revenue, order count, and AOV.',
    classification: 'read',
    risk: 'READ',
    permissions: ['analytics.read'],
    requiresConfirmation: false,
    auditRequired: false,
    parameters: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['this_month', 'last_7_days', 'last_30_days', 'previous_month'] },
      },
    },
  },
  {
    name: 'compare_sales_periods',
    description: 'Compare current period sales with the previous equivalent period.',
    classification: 'read',
    risk: 'READ',
    permissions: ['analytics.read'],
    requiresConfirmation: false,
    auditRequired: false,
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_top_products',
    description: 'Get top-selling products by revenue for a period.',
    classification: 'read',
    risk: 'READ',
    permissions: ['analytics.read'],
    requiresConfirmation: false,
    auditRequired: false,
    parameters: {
      type: 'object',
      properties: {
        period: { type: 'string' },
        limit: { type: 'number', minimum: 1, maximum: 20 },
      },
    },
  },
  {
    name: 'get_low_stock_products',
    description: 'List products at or below low-stock threshold.',
    classification: 'read',
    risk: 'READ',
    permissions: ['inventory.read'],
    requiresConfirmation: false,
    auditRequired: false,
    parameters: {
      type: 'object',
      properties: { limit: { type: 'number', minimum: 1, maximum: 50 } },
    },
  },
  {
    name: 'search_products',
    description: 'Search products by name, brand, or SKU.',
    classification: 'read',
    risk: 'READ',
    permissions: ['products.read'],
    requiresConfirmation: false,
    auditRequired: false,
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_product',
    description: 'Get details for a specific product by ID.',
    classification: 'read',
    risk: 'READ',
    permissions: ['products.read'],
    requiresConfirmation: false,
    auditRequired: false,
    parameters: {
      type: 'object',
      properties: { productId: { type: 'string', format: 'uuid' } },
      required: ['productId'],
    },
  },
  {
    name: 'get_order',
    description: 'Get order details by order ID or order number.',
    classification: 'read',
    risk: 'READ',
    permissions: ['orders.read'],
    requiresConfirmation: false,
    auditRequired: false,
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string' },
        orderNumber: { type: 'string' },
      },
    },
  },
  {
    name: 'search_orders',
    description: 'Search orders by number or customer name.',
    classification: 'read',
    risk: 'READ',
    permissions: ['orders.read'],
    requiresConfirmation: false,
    auditRequired: false,
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'get_customer_summary',
    description: 'Get customer metrics including total, new customers, and top customers.',
    classification: 'read',
    risk: 'READ',
    permissions: ['analytics.read', 'customers.read'],
    requiresConfirmation: false,
    auditRequired: false,
    parameters: {
      type: 'object',
      properties: { period: { type: 'string' } },
    },
  },
  {
    name: 'search_customers',
    description: 'Search customers by name, email, or phone.',
    classification: 'read',
    risk: 'READ',
    permissions: ['customers.read'],
    requiresConfirmation: false,
    auditRequired: false,
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_customer',
    description: 'Get customer details by ID.',
    classification: 'read',
    risk: 'READ',
    permissions: ['customers.read'],
    requiresConfirmation: false,
    auditRequired: false,
    parameters: {
      type: 'object',
      properties: { customerId: { type: 'string', format: 'uuid' } },
      required: ['customerId'],
    },
  },
  {
    name: 'get_order_metrics',
    description: 'Get order counts, cancellations, and refund totals for a period.',
    classification: 'read',
    risk: 'READ',
    permissions: ['analytics.read', 'orders.read'],
    requiresConfirmation: false,
    auditRequired: false,
    parameters: {
      type: 'object',
      properties: { period: { type: 'string' } },
    },
  },
  {
    name: 'get_channel_performance',
    description: 'Compare sales performance across channels (POS, online, etc.).',
    classification: 'read',
    risk: 'READ',
    permissions: ['analytics.read'],
    requiresConfirmation: false,
    auditRequired: false,
    parameters: {
      type: 'object',
      properties: { period: { type: 'string' } },
    },
  },
  {
    name: 'get_growth_opportunities',
    description: 'Get business growth opportunities based on current data.',
    classification: 'read',
    risk: 'READ',
    permissions: ['analytics.read'],
    requiresConfirmation: false,
    auditRequired: false,
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_automation_summary',
    description: 'Get automation metrics including active count, executions, and success rate.',
    classification: 'read',
    risk: 'READ',
    permissions: ['automations.read', 'analytics.read'],
    requiresConfirmation: false,
    auditRequired: false,
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'list_automations',
    description: 'List automations with status and execution stats.',
    classification: 'read',
    risk: 'READ',
    permissions: ['automations.read'],
    requiresConfirmation: false,
    auditRequired: false,
    parameters: { type: 'object', properties: { status: { type: 'string' } } },
  },
  {
    name: 'adjust_inventory',
    description: 'Adjust inventory quantity for a product variant at a location.',
    classification: 'write',
    risk: 'HIGH',
    permissions: ['inventory.write', 'ai.execute'],
    requiresConfirmation: true,
    auditRequired: true,
    parameters: {
      type: 'object',
      properties: {
        variantId: { type: 'string', format: 'uuid' },
        stockLocationId: { type: 'string', format: 'uuid' },
        quantityDelta: { type: 'number' },
        reason: { type: 'string' },
      },
      required: ['variantId', 'stockLocationId', 'quantityDelta'],
    },
  },
  {
    name: 'update_product_price',
    description: 'Update the price of a product variant.',
    classification: 'write',
    risk: 'MEDIUM',
    permissions: ['products.write', 'ai.execute'],
    requiresConfirmation: true,
    auditRequired: true,
    parameters: {
      type: 'object',
      properties: {
        variantId: { type: 'string', format: 'uuid' },
        priceMinor: { type: 'number', minimum: 0 },
      },
      required: ['variantId', 'priceMinor'],
    },
  },
  {
    name: 'create_customer',
    description: 'Create a new customer record.',
    classification: 'write',
    risk: 'MEDIUM',
    permissions: ['customers.write', 'ai.execute'],
    requiresConfirmation: true,
    auditRequired: true,
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
      },
      required: ['name'],
    },
  },
  {
    name: 'analyze_storefront',
    description: 'Analyze the live storefront experience and return structured improvement insights.',
    classification: 'read',
    risk: 'READ',
    permissions: ['store.read'],
    requiresConfirmation: false,
    auditRequired: false,
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'analyze_product_merchandising',
    description: 'Analyze product performance and merchandising opportunities using real storefront data.',
    classification: 'read',
    risk: 'READ',
    permissions: ['products.read', 'analytics.read'],
    requiresConfirmation: false,
    auditRequired: false,
    parameters: { type: 'object', properties: {} },
  },
];

export const TOOL_INPUT_SCHEMAS: Record<string, z.ZodType<unknown>> = {
  get_sales_summary: z.object({ period: periodSchema }),
  compare_sales_periods: z.object({}),
  get_top_products: z.object({
    period: periodSchema,
    limit: z.number().int().min(1).max(20).optional(),
  }),
  get_low_stock_products: z.object({
    limit: z.number().int().min(1).max(50).optional(),
  }),
  search_products: z.object({
    query: z.string().min(1).max(200),
    limit: z.number().int().min(1).max(50).optional(),
  }),
  get_product: z.object({ productId: z.string().uuid() }),
  get_order: z
    .object({
      orderId: z.string().uuid().optional(),
      orderNumber: z.string().optional(),
    })
    .refine((d) => d.orderId || d.orderNumber, 'orderId or orderNumber required'),
  search_orders: z.object({
    query: z.string().min(1).max(200),
    limit: z.number().int().min(1).max(50).optional(),
  }),
  get_customer_summary: z.object({ period: periodSchema }),
  search_customers: z.object({
    query: z.string().min(1).max(200),
    limit: z.number().int().min(1).max(50).optional(),
  }),
  get_customer: z.object({ customerId: z.string().uuid() }),
  get_order_metrics: z.object({ period: periodSchema }),
  get_channel_performance: z.object({ period: periodSchema }),
  get_growth_opportunities: z.object({}),
  get_automation_summary: z.object({}),
  list_automations: z.object({ status: z.string().optional() }),
  adjust_inventory: z.object({
    variantId: z.string().uuid(),
    stockLocationId: z.string().uuid(),
    quantityDelta: z.number().int(),
    reason: z.string().max(500).optional(),
  }),
  update_product_price: z.object({
    variantId: z.string().uuid(),
    priceMinor: z.number().int().min(0),
  }),
  create_customer: z.object({
    name: z.string().min(1).max(200),
    email: z.string().email().optional(),
    phone: z.string().max(50).optional(),
  }),
  analyze_storefront: z.object({}),
  analyze_product_merchandising: z.object({}),
};

export function getToolDefinition(name: string): ToolDefinition | undefined {
  return TOOL_DEFINITIONS.find((t) => t.name === name);
}

export function getToolsForAgent(toolNames: string[]): ToolDefinition[] {
  return TOOL_DEFINITIONS.filter((t) => toolNames.includes(t.name));
}

export function getAllToolNames(): string[] {
  return TOOL_DEFINITIONS.map((t) => t.name);
}
