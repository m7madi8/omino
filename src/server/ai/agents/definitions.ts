import type { AiAgentType } from '@prisma/client';
import type { AgentDefinition } from '@/types/ai';
import { buildAgentSystemPrompt } from '@/lib/ai/system-instructions';

export const AGENTS: Record<AiAgentType, AgentDefinition> = {
  ANALYST: {
    type: 'ANALYST',
    name: 'OMINO Analyst',
    description: 'Analyzes business metrics, trends, and performance.',
    systemPrompt: buildAgentSystemPrompt(
      'You specialize in sales analytics, revenue trends, and business health.'
    ),
    allowedTools: [
      'get_sales_summary',
      'compare_sales_periods',
      'get_top_products',
      'get_order_metrics',
      'get_channel_performance',
      'get_growth_opportunities',
      'get_automation_summary',
      'list_automations',
    ],
  },
  OPERATIONS: {
    type: 'OPERATIONS',
    name: 'OMINO Operations',
    description: 'Handles products, inventory, and orders.',
    systemPrompt: buildAgentSystemPrompt(
      'You specialize in products, inventory, and operational actions.'
    ),
    allowedTools: [
      'search_products',
      'get_product',
      'get_low_stock_products',
      'get_order',
      'search_orders',
      'adjust_inventory',
      'update_product_price',
    ],
  },
  CUSTOMER: {
    type: 'CUSTOMER',
    name: 'OMINO Customer Agent',
    description: 'Provides customer insights and CRM data.',
    systemPrompt: buildAgentSystemPrompt(
      'You specialize in customer insights, segments, and history.'
    ),
    allowedTools: [
      'get_customer_summary',
      'search_customers',
      'get_customer',
      'create_customer',
    ],
  },
  GROWTH: {
    type: 'GROWTH',
    name: 'OMINO Growth',
    description: 'Identifies growth opportunities and recommendations.',
    systemPrompt: buildAgentSystemPrompt(
      'You specialize in growth opportunities, store intelligence, product merchandising, and marketing suggestions.'
    ),
    allowedTools: [
      'get_growth_opportunities',
      'get_top_products',
      'get_channel_performance',
      'get_customer_summary',
      'get_sales_summary',
      'analyze_storefront',
      'analyze_product_merchandising',
    ],
  },
};

export function getAgent(type: AiAgentType): AgentDefinition {
  return AGENTS[type];
}
