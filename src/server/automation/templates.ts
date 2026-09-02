import type { AutomationTemplate, AutomationVersionConfig } from '@/types/automation';

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: 'low-stock-alert',
    name: 'Low Stock Alert',
    description: 'Notify when inventory falls below reorder point',
    config: {
      trigger: { type: 'inventory.low_stock' },
      conditions: {
        operator: 'AND',
        conditions: [
          { field: 'payload.available', operator: 'less_than_or_equal', value: 5 },
        ],
      },
      steps: [
        {
          type: 'action',
          actionType: 'send_notification',
          input: {
            title: 'Low stock alert',
            body: 'Product {{payload.productName}} ({{payload.sku}}) has only {{payload.available}} units left.',
          },
        },
      ],
    },
  },
  {
    id: 'new-customer',
    name: 'New Customer',
    description: 'Tag new customers automatically',
    config: {
      trigger: { type: 'customer.created' },
      steps: [
        {
          type: 'action',
          actionType: 'add_customer_tag',
          input: {
            customerId: '{{payload.customerId}}',
            tagName: 'new-customer',
          },
        },
      ],
    },
  },
  {
    id: 'high-value-order',
    name: 'High Value Order',
    description: 'Tag customers on high-value completed orders',
    config: {
      trigger: { type: 'order.completed' },
      conditions: {
        operator: 'AND',
        conditions: [
          { field: 'order.totalMinor', operator: 'greater_than', value: 10000 },
        ],
      },
      steps: [
        {
          type: 'action',
          actionType: 'add_customer_tag',
          input: {
            customerId: '{{order.customerId}}',
            tagName: 'high-value',
          },
        },
        {
          type: 'action',
          actionType: 'send_notification',
          input: {
            title: 'High value order',
            body: 'Order {{order.orderNumber}} completed for {{order.totalMinor}} minor units.',
          },
        },
      ],
    },
  },
  {
    id: 'repeat-customer',
    name: 'Repeat Customer',
    description: 'Tag customers with multiple completed orders',
    config: {
      trigger: { type: 'order.completed' },
      conditions: {
        operator: 'AND',
        conditions: [
          { field: 'customer.completedOrders', operator: 'greater_than_or_equal', value: 3 },
        ],
      },
      steps: [
        {
          type: 'action',
          actionType: 'add_customer_tag',
          input: {
            customerId: '{{order.customerId}}',
            tagName: 'repeat-customer',
          },
        },
      ],
    },
  },
  {
    id: 'failed-payment',
    name: 'Failed Payment',
    description: 'Alert on failed payments',
    config: {
      trigger: { type: 'payment.failed' },
      steps: [
        {
          type: 'action',
          actionType: 'send_notification',
          input: {
            title: 'Payment failed',
            body: 'Payment failed for order {{payload.orderId}}. Reason: {{payload.reason}}',
          },
        },
      ],
    },
  },
];

export function getAutomationTemplate(id: string): AutomationTemplate | undefined {
  return AUTOMATION_TEMPLATES.find((t) => t.id === id);
}

export function listAutomationTemplates(): AutomationTemplate[] {
  return AUTOMATION_TEMPLATES;
}
