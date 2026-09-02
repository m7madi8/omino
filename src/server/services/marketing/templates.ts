import type { CampaignTemplate } from '@/types/marketing';

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'win-back',
    name: 'Win Back Customers',
    description: 'Re-engage customers who have not purchased in 30+ days.',
    audienceRules: {
      logic: 'AND',
      rules: [{ field: 'daysSinceLastOrder', operator: 'gte', value: 30 }],
    },
    suggestedPromotion: {
      name: 'Welcome Back 10%',
      discountType: 'PERCENT',
      discountValue: 1000,
    },
  },
  {
    id: 'vip',
    name: 'VIP Customers',
    description: 'Reward high lifetime spend customers.',
    audienceRules: {
      logic: 'AND',
      rules: [{ field: 'totalSpendMinor', operator: 'gte', value: 50000 }],
    },
    suggestedPromotion: {
      name: 'VIP 15% Off',
      discountType: 'PERCENT',
      discountValue: 1500,
    },
  },
  {
    id: 'new-customer',
    name: 'New Customer Follow-up',
    description: 'Customers who completed their first order recently.',
    audienceRules: {
      logic: 'AND',
      rules: [
        { field: 'completedOrders', operator: 'eq', value: 1 },
        { field: 'daysSinceLastOrder', operator: 'lte', value: 14 },
      ],
    },
    suggestedPromotion: {
      name: 'Second Order 10%',
      discountType: 'PERCENT',
      discountValue: 1000,
    },
  },
  {
    id: 'product-promo',
    name: 'Product Promotion',
    description: 'Promote a specific product to all customers.',
    audienceRules: {
      logic: 'AND',
      rules: [{ field: 'status', operator: 'eq', value: 'ACTIVE' }],
    },
  },
  {
    id: 'slow-inventory',
    name: 'Slow-Moving Inventory',
    description: 'Foundation for inventory-aware promotions — pair with product selection.',
    audienceRules: {
      logic: 'AND',
      rules: [{ field: 'status', operator: 'eq', value: 'ACTIVE' }],
    },
    suggestedPromotion: {
      name: 'Clearance 20%',
      discountType: 'PERCENT',
      discountValue: 2000,
    },
  },
];

export function getCampaignTemplate(id: string) {
  return CAMPAIGN_TEMPLATES.find((t) => t.id === id);
}
