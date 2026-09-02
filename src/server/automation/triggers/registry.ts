import type { AutomationTriggerDefinition } from '@/types/automation';

export const AUTOMATION_TRIGGERS: AutomationTriggerDefinition[] = [
  // Orders
  { type: 'order.created', name: 'Order Created', description: 'When a new order is created', category: 'orders', payloadFields: ['orderId', 'totalMinor', 'source'] },
  { type: 'order.confirmed', name: 'Order Confirmed', description: 'When an order is confirmed', category: 'orders', payloadFields: ['orderId', 'totalMinor'] },
  { type: 'order.completed', name: 'Order Completed', description: 'When an order is completed', category: 'orders', payloadFields: ['orderId', 'totalMinor', 'customerId'] },
  { type: 'order.cancelled', name: 'Order Cancelled', description: 'When an order is cancelled', category: 'orders', payloadFields: ['orderId'] },
  { type: 'order.refunded', name: 'Order Refunded', description: 'When an order is refunded', category: 'orders', payloadFields: ['orderId', 'refundedMinor'] },
  // Payments
  { type: 'payment.received', name: 'Payment Received', description: 'When a payment is received', category: 'payments', payloadFields: ['orderId', 'amountMinor'] },
  { type: 'payment.failed', name: 'Payment Failed', description: 'When a payment fails', category: 'payments', payloadFields: ['orderId', 'reason'] },
  { type: 'payment.refunded', name: 'Payment Refunded', description: 'When a payment is refunded', category: 'payments', payloadFields: ['orderId', 'amountMinor'] },
  // Customers
  { type: 'customer.created', name: 'Customer Created', description: 'When a new customer is created', category: 'customers', payloadFields: ['customerId', 'name'] },
  { type: 'customer.updated', name: 'Customer Updated', description: 'When a customer is updated', category: 'customers', payloadFields: ['customerId'] },
  { type: 'customer.order_created', name: 'Customer Order Created', description: 'When a customer places an order', category: 'customers', payloadFields: ['customerId', 'orderId'] },
  { type: 'customer.order_completed', name: 'Customer Order Completed', description: 'When a customer order completes', category: 'customers', payloadFields: ['customerId', 'orderId'] },
  // Products
  { type: 'product.created', name: 'Product Created', description: 'When a product is created', category: 'products', payloadFields: ['productId', 'name'] },
  { type: 'product.updated', name: 'Product Updated', description: 'When a product is updated', category: 'products', payloadFields: ['productId'] },
  { type: 'product.archived', name: 'Product Archived', description: 'When a product is archived', category: 'products', payloadFields: ['productId'] },
  // Inventory
  { type: 'inventory.low_stock', name: 'Low Stock', description: 'When inventory falls below threshold', category: 'inventory', payloadFields: ['variantId', 'productId', 'quantityAvailable'] },
  { type: 'inventory.out_of_stock', name: 'Out of Stock', description: 'When inventory reaches zero', category: 'inventory', payloadFields: ['variantId', 'productId'] },
  { type: 'inventory.adjusted', name: 'Inventory Adjusted', description: 'When inventory is adjusted', category: 'inventory', payloadFields: ['variantId', 'quantityDelta'] },
  { type: 'inventory.received', name: 'Inventory Received', description: 'When stock is received', category: 'inventory', payloadFields: ['variantId', 'quantity'] },
  // POS
  { type: 'pos.sale_completed', name: 'POS Sale Completed', description: 'When a POS sale completes', category: 'pos', payloadFields: ['orderId', 'totalMinor'] },
  { type: 'pos.session_opened', name: 'POS Session Opened', description: 'When a POS session opens', category: 'pos', payloadFields: ['sessionId'] },
  { type: 'pos.session_closed', name: 'POS Session Closed', description: 'When a POS session closes', category: 'pos', payloadFields: ['sessionId'] },
  // Store
  { type: 'store.order_created', name: 'Store Order Created', description: 'When an online store order is created', category: 'store', payloadFields: ['orderId'] },
  { type: 'store.checkout_started', name: 'Checkout Started', description: 'When checkout begins', category: 'store', payloadFields: ['cartId'] },
  { type: 'store.checkout_completed', name: 'Checkout Completed', description: 'When checkout completes', category: 'store', payloadFields: ['orderId'] },
  // Scheduled
  { type: 'schedule.daily', name: 'Daily Schedule', description: 'Runs once per day', category: 'schedule', payloadFields: [] },
  { type: 'schedule.weekly', name: 'Weekly Schedule', description: 'Runs once per week', category: 'schedule', payloadFields: [] },
  { type: 'schedule.monthly', name: 'Monthly Schedule', description: 'Runs once per month', category: 'schedule', payloadFields: [] },
];

export function getTriggerDefinition(type: string): AutomationTriggerDefinition | undefined {
  return AUTOMATION_TRIGGERS.find((t) => t.type === type);
}

export function isScheduledTrigger(type: string): boolean {
  return type.startsWith('schedule.');
}

export const TRIGGER_ALIASES: Record<string, string[]> = {
  'payment.paid': ['payment.received'],
  'payment.created': ['payment.received'],
  'order.voided': ['order.cancelled'],
  'inventory.decremented': ['inventory.adjusted'],
};

export function triggerMatches(automationTrigger: string, eventType: string): boolean {
  if (automationTrigger === eventType) return true;
  const aliases = TRIGGER_ALIASES[eventType];
  if (aliases?.includes(automationTrigger)) return true;
  const reverseAliases = TRIGGER_ALIASES[automationTrigger];
  if (reverseAliases?.includes(eventType)) return true;
  return false;
}
