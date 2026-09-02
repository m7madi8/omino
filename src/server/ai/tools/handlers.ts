import {
  compareSalesPeriods,
  getChannelPerformance,
  getCustomerSummary,
  getGrowthOpportunities,
  getOrderMetrics,
  getSalesSummary,
  getTopProducts,
  resolveDateRange,
} from '@/server/services/analytics-service';
import { listInventory } from '@/server/services/inventory-service';
import { listProducts, getProductDetail } from '@/server/services/product-service';
import { listOrders, getOrderDetail } from '@/server/services/order-service';
import { searchCustomers } from '@/server/services/customer-search-service';
import { getCustomerContext } from '@/server/services/customer-metrics-service';
import { adjustStock } from '@/server/services/inventory-service';
import { createCustomer } from '@/server/services/customer-service';
import { prisma } from '@/lib/db';
import type { ToolExecutionContext } from '@/types/ai';

type Handler = (
  ctx: ToolExecutionContext,
  input: Record<string, unknown>
) => Promise<unknown>;

export const TOOL_HANDLERS: Record<string, Handler> = {
  get_sales_summary: async (ctx, input) => {
    const period = (input.period as string) || 'this_month';
    const range = resolveDateRange(period);
    const summary = await getSalesSummary(ctx.organizationId, range, ctx.storeId ?? undefined);
    return { ...summary, currency: ctx.currency };
  },

  compare_sales_periods: async (ctx) => {
    const current = resolveDateRange('this_month');
    const previous = resolveDateRange('previous_month');
    return compareSalesPeriods(
      ctx.organizationId,
      current,
      previous,
      ctx.storeId ?? undefined
    );
  },

  get_top_products: async (ctx, input) => {
    const period = (input.period as string) || 'this_month';
    const limit = (input.limit as number) || 5;
    const range = resolveDateRange(period);
    const products = await getTopProducts(
      ctx.organizationId,
      range,
      limit,
      ctx.storeId ?? undefined
    );
    return { period: range.label, products };
  },

  get_low_stock_products: async (ctx, input) => {
    const limit = (input.limit as number) || 10;
    const result = await listInventory({
      organizationId: ctx.organizationId,
      lowStockOnly: true,
      pageSize: limit,
    });
    return { items: result.items, total: result.total };
  },

  search_products: async (ctx, input) => {
    const result = await listProducts({
      organizationId: ctx.organizationId,
      storeId: ctx.storeId ?? undefined,
      search: input.query as string,
      pageSize: (input.limit as number) || 10,
    });
    return {
      products: result.items.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        priceMinor: p.sellingPrice,
      })),
      total: result.total,
    };
  },

  get_product: async (ctx, input) => {
    return getProductDetail(ctx.organizationId, input.productId as string);
  },

  get_order: async (ctx, input) => {
    if (input.orderId) {
      return getOrderDetail(ctx.organizationId, input.orderId as string);
    }
    const orders = await listOrders({
      organizationId: ctx.organizationId,
      search: input.orderNumber as string,
      pageSize: 1,
    });
    if (!orders.items[0]) throw new Error('NOT_FOUND');
    return getOrderDetail(ctx.organizationId, orders.items[0].id);
  },

  search_orders: async (ctx, input) => {
    const result = await listOrders({
      organizationId: ctx.organizationId,
      search: input.query as string,
      pageSize: (input.limit as number) || 10,
    });
    return { orders: result.items, total: result.total };
  },

  get_customer_summary: async (ctx, input) => {
    const period = (input.period as string) || 'this_month';
    const range = resolveDateRange(period);
    return getCustomerSummary(ctx.organizationId, range);
  },

  search_customers: async (ctx, input) => {
    const result = await searchCustomers({
      organizationId: ctx.organizationId,
      search: input.query as string,
      pageSize: (input.limit as number) || 10,
    });
    return { customers: result.items, total: result.total };
  },

  get_customer: async (ctx, input) => {
    return getCustomerContext(ctx.organizationId, input.customerId as string);
  },

  get_order_metrics: async (ctx, input) => {
    const period = (input.period as string) || 'this_month';
    const range = resolveDateRange(period);
    return getOrderMetrics(ctx.organizationId, range, ctx.storeId ?? undefined);
  },

  get_channel_performance: async (ctx, input) => {
    const period = (input.period as string) || 'this_month';
    const range = resolveDateRange(period);
    return getChannelPerformance(ctx.organizationId, range, ctx.storeId ?? undefined);
  },

  get_growth_opportunities: async (ctx) => {
    const opportunities = await getGrowthOpportunities(
      ctx.organizationId,
      ctx.storeId ?? undefined
    );
    return { opportunities };
  },

  get_automation_summary: async (ctx) => {
    const { getAutomationMetrics } = await import('@/server/automation/automation-service');
    return getAutomationMetrics(ctx.organizationId);
  },

  list_automations: async (ctx, input) => {
    const { listAutomations } = await import('@/server/automation/automation-service');
    const automations = await listAutomations(ctx.organizationId);
    const status = input.status as string | undefined;
    return {
      automations: status
        ? automations.filter((a: { status: string }) => a.status === status)
        : automations,
    };
  },

  analyze_storefront: async (ctx) => {
    if (!ctx.storeId) throw new Error('STORE_REQUIRED');
    const { analyzeStorefront } = await import('@/server/services/store-intelligence-service');
    return analyzeStorefront(ctx.organizationId, ctx.storeId);
  },

  analyze_product_merchandising: async (ctx) => {
    if (!ctx.storeId) throw new Error('STORE_REQUIRED');
    const { analyzeProductMerchandising } = await import('@/server/services/store-intelligence-service');
    return analyzeProductMerchandising(ctx.organizationId, ctx.storeId);
  },

  adjust_inventory: async (ctx, input) => {
    const variant = await prisma.productVariant.findFirst({
      where: { id: input.variantId as string, organizationId: ctx.organizationId },
      include: { product: { select: { name: true } } },
    });
    if (!variant) throw new Error('NOT_FOUND');

    const location = await prisma.stockLocation.findFirst({
      where: {
        id: input.stockLocationId as string,
        organizationId: ctx.organizationId,
      },
    });
    if (!location) throw new Error('NOT_FOUND');

    const level = await prisma.stockLevel.findFirst({
      where: {
        variantId: variant.id,
        stockLocationId: location.id,
        organizationId: ctx.organizationId,
      },
    });

    const current = level?.quantityOnHand ?? 0;
    const delta = input.quantityDelta as number;
    const projected = current + delta;

    return {
      dryRun: true,
      action: 'adjust_inventory',
      product: variant.product.name,
      variant: variant.name,
      location: location.name,
      quantityDelta: delta,
      currentStock: current,
      projectedStock: projected,
    };
  },

  update_product_price: async (ctx, input) => {
    const variant = await prisma.productVariant.findFirst({
      where: { id: input.variantId as string, organizationId: ctx.organizationId },
      include: { product: { select: { name: true } } },
    });
    if (!variant) throw new Error('NOT_FOUND');

    return {
      dryRun: true,
      action: 'update_product_price',
      product: variant.product.name,
      variant: variant.name,
      currentPriceMinor: variant.sellingPrice,
      newPriceMinor: input.priceMinor,
    };
  },

  create_customer: async (ctx, input) => {
    return {
      dryRun: true,
      action: 'create_customer',
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
    };
  },
};

export async function executeWriteTool(
  ctx: ToolExecutionContext,
  toolName: string,
  input: Record<string, unknown>
) {
  switch (toolName) {
    case 'adjust_inventory':
      return adjustStock({
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        variantId: input.variantId as string,
        stockLocationId: input.stockLocationId as string,
        quantityDelta: input.quantityDelta as number,
        type: 'ADJUSTMENT',
        reason: (input.reason as string) || 'AI adjustment',
        referenceType: 'ai_action',
        referenceId: ctx.conversationId,
      });

    case 'update_product_price': {
      const variant = await prisma.productVariant.update({
        where: {
          id: input.variantId as string,
          organizationId: ctx.organizationId,
        },
        data: { sellingPrice: input.priceMinor as number },
      });
      return { variantId: variant.id, priceMinor: variant.sellingPrice };
    }

    case 'create_customer': {
      const customer = await createCustomer(
        ctx.organizationId,
        ctx.userId,
        {
          name: input.name as string,
          email: input.email as string | undefined,
          phone: input.phone as string | undefined,
          source: 'MANUAL',
        },
        { skipDuplicateCheck: false }
      );
      return { customerId: customer.id, name: customer.name };
    }

    default:
      throw new Error('UNKNOWN_WRITE_TOOL');
  }
}
