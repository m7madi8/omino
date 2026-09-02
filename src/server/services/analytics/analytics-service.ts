import { prisma } from '@/lib/db';
import { resolveDateRange } from '@/lib/analytics/date-range';
import type {
  AnalyticsFilters,
  AnalyticsOverview,
  BusinessContextSnapshot,
  DateRangePreset,
  ResolvedDateRange,
} from '@/types/analytics';
import type { OrderSource } from '@/types/prisma-enums';
import { getCustomerMetricsSummary } from './customer-analytics-service';
import { getInventoryMetricsSummary } from './inventory-analytics-service';
import { getTopProducts } from './product-analytics-service';
import {
  getChannelMetrics,
  getOrdersTimeSeries,
  getRevenueTimeSeries,
  getSalesMetrics,
} from './sales-analytics-service';
import {
  buildCustomerComparison,
  buildSalesComparison,
  generateBusinessSignals,
} from './business-signals-service';

type AnalyticsParams = {
  organizationId: string;
  storeId?: string;
  branchId?: string;
  channel?: OrderSource;
  preset?: DateRangePreset;
  from?: string;
  to?: string;
  currency: string;
};

function toFilters(params: AnalyticsParams, range: ResolvedDateRange): AnalyticsFilters {
  return {
    organizationId: params.organizationId,
    storeId: params.storeId,
    branchId: params.branchId,
    channel: params.channel,
    from: range.from,
    to: range.to,
  };
}

async function getRecentOrders(filters: AnalyticsFilters, limit = 8) {
  const orders = await prisma.order.findMany({
    where: {
      organizationId: filters.organizationId,
      ...(filters.storeId && { storeId: filters.storeId }),
      ...(filters.branchId && { branchId: filters.branchId }),
      ...(filters.channel && { source: filters.channel }),
    },
    select: {
      id: true,
      orderNumber: true,
      source: true,
      status: true,
      totalMinor: true,
      currency: true,
      customerName: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    source: o.source,
    status: o.status,
    totalMinor: o.totalMinor,
    currency: o.currency,
    customerName: o.customerName,
    createdAt: o.createdAt.toISOString(),
  }));
}

export async function getAnalyticsOverview(params: AnalyticsParams): Promise<AnalyticsOverview> {
  const range = resolveDateRange(params.preset ?? 'last_30_days', params.from, params.to);
  const previousRange = { from: range.previousFrom, to: range.previousTo };
  const filters = toFilters(params, range);
  const prevFilters = { ...filters, from: previousRange.from, to: previousRange.to };

  const [
    sales,
    previousSales,
    customers,
    previousCustomers,
    channels,
    revenueSeries,
    ordersSeries,
    topProducts,
    inventory,
    recentOrders,
  ] = await Promise.all([
    getSalesMetrics(filters, range),
    getSalesMetrics(prevFilters, previousRange),
    getCustomerMetricsSummary(filters, range),
    getCustomerMetricsSummary(prevFilters, previousRange),
    getChannelMetrics(filters, range),
    getRevenueTimeSeries(filters, range),
    getOrdersTimeSeries(filters, range),
    getTopProducts(filters, range, 10),
    getInventoryMetricsSummary(filters, range),
    getRecentOrders(filters),
  ]);

  const hasData = sales.completedOrders > 0 || customers.newCustomers > 0;
  const topShare =
    sales.grossSalesMinor > 0 && topProducts[0]
      ? (topProducts[0].revenueMinor / sales.grossSalesMinor) * 100
      : undefined;

  const signals = generateBusinessSignals({
    sales,
    previousSales,
    customers,
    channels,
    inventoryLowStock: inventory.lowStockCount,
    inventoryOutOfStock: inventory.outOfStockCount,
    topProductName: topProducts[0]?.productName,
    topProductSharePercent: topShare,
    hasData,
  });

  return {
    range,
    currency: params.currency,
    sales,
    salesComparison: buildSalesComparison(sales, previousSales),
    customers,
    customersComparison: buildCustomerComparison(customers, previousCustomers),
    channels,
    revenueSeries,
    ordersSeries,
    topProducts,
    inventory,
    recentOrders,
    signals,
    hasData,
  };
}

export async function getBusinessContextSnapshot(
  params: AnalyticsParams
): Promise<BusinessContextSnapshot> {
  const overview = await getAnalyticsOverview(params);
  return {
    generatedAt: new Date().toISOString(),
    organizationId: params.organizationId,
    currency: overview.currency,
    period: {
      from: overview.range.from.toISOString(),
      to: overview.range.to.toISOString(),
      label: overview.range.label,
    },
    overview: {
      revenue: {
        grossMinor: overview.sales.grossSalesMinor,
        netMinor: overview.sales.netSalesMinor,
        refundsMinor: overview.sales.refundsMinor,
      },
      orders: {
        total: overview.sales.orderCount,
        completed: overview.sales.completedOrders,
        aovMinor: overview.sales.averageOrderValueMinor,
      },
      customers: {
        total: overview.customers.totalCustomers,
        new: overview.customers.newCustomers,
        returning: overview.customers.returningCustomers,
        repeatRate: overview.customers.repeatPurchaseRate,
      },
      channels: overview.channels,
      inventory: {
        lowStock: overview.inventory.lowStockCount,
        outOfStock: overview.inventory.outOfStockCount,
      },
    },
    trends: {
      revenueSeries: overview.revenueSeries,
      ordersSeries: overview.ordersSeries,
    },
    topProducts: overview.topProducts,
    signals: overview.signals,
  };
}

/** Reconciliation helper — dashboard gross must match sum of completed order totals. */
export async function reconcileSalesMetrics(
  filters: AnalyticsFilters,
  range: { from: Date; to: Date }
) {
  const metrics = await getSalesMetrics(filters, range);
  const orders = await prisma.order.findMany({
    where: {
      organizationId: filters.organizationId,
      status: 'COMPLETED',
      OR: [
        { completedAt: { gte: range.from, lte: range.to } },
        { completedAt: null, createdAt: { gte: range.from, lte: range.to } },
      ],
      ...(filters.storeId && { storeId: filters.storeId }),
      ...(filters.branchId && { branchId: filters.branchId }),
      ...(filters.channel && { source: filters.channel }),
    },
    select: { totalMinor: true, refundedMinor: true, source: true },
  });

  const sumGross = orders.reduce((s, o) => s + o.totalMinor, 0);
  const sumRefunds = orders.reduce((s, o) => s + o.refundedMinor, 0);

  const byChannel = orders.reduce(
    (acc, o) => {
      acc[o.source] = (acc[o.source] ?? 0) + o.totalMinor;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    metricsGross: metrics.grossSalesMinor,
    ordersGross: sumGross,
    metricsRefunds: metrics.refundsMinor,
    ordersRefunds: sumRefunds,
    grossMatches: metrics.grossSalesMinor === sumGross,
    refundsMatch: metrics.refundsMinor === sumRefunds,
    channelTotals: byChannel,
    channelSum: Object.values(byChannel).reduce((s, v) => s + v, 0),
    channelMatchesTotal: Object.values(byChannel).reduce((s, v) => s + v, 0) === sumGross,
  };
}
