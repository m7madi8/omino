import { prisma } from '@/lib/db';
import { resolveDateRange } from '@/lib/analytics/date-range';
import { getChannelMetrics } from '@/server/services/analytics/sales-analytics-service';
import { getInventoryMetricsSummary } from '@/server/services/analytics/inventory-analytics-service';
import type { AnalyticsFilters } from '@/types/analytics';

export type TodayDashboardData = {
  currency: string;
  revenueMinor: number;
  posRevenueMinor: number;
  onlineRevenueMinor: number;
  manualRevenueMinor: number;
  orderCount: number;
  lowStockCount: number;
  inDeliveryCount: number;
  codPendingMinor: number;
  codPendingCount: number;
  inventoryAlerts: {
    productName: string;
    variantId: string;
    available: number;
  }[];
};

export async function getCodPendingSummary(organizationId: string, storeId?: string) {
  const orders = await prisma.order.findMany({
    where: {
      organizationId,
      ...(storeId && { storeId }),
      status: { notIn: ['CANCELLED', 'COMPLETED'] },
      paymentStatus: { in: ['PENDING', 'PARTIALLY_PAID'] },
      payments: { some: { method: 'COD', status: 'PENDING' } },
    },
    select: { totalMinor: true, paidMinor: true },
  });

  let totalMinor = 0;
  for (const o of orders) {
    totalMinor += Math.max(0, o.totalMinor - o.paidMinor);
  }
  return { count: orders.length, totalMinor };
}

export async function getInDeliveryCount(organizationId: string, storeId?: string) {
  return prisma.order.count({
    where: {
      organizationId,
      ...(storeId && { storeId }),
      status: { in: ['CONFIRMED', 'PROCESSING'] },
      fulfillmentStatus: { in: ['UNFULFILLED', 'PARTIALLY_FULFILLED'] },
      source: { in: ['ONLINE', 'MANUAL'] },
    },
  });
}

export async function getTodayDashboard(input: {
  organizationId: string;
  storeId?: string;
  branchId?: string;
  currency: string;
}): Promise<TodayDashboardData> {
  const range = resolveDateRange('today');
  const filters: AnalyticsFilters = {
    organizationId: input.organizationId,
    storeId: input.storeId,
    branchId: input.branchId,
    from: range.from,
    to: range.to,
  };

  const [channels, inventory, cod, inDelivery] = await Promise.all([
    getChannelMetrics(filters, range),
    getInventoryMetricsSummary(filters, range),
    getCodPendingSummary(input.organizationId, input.storeId),
    getInDeliveryCount(input.organizationId, input.storeId),
  ]);

  const pos = channels.find((c) => c.source === 'POS');
  const online = channels.find((c) => c.source === 'ONLINE');
  const manual = channels.find((c) => c.source === 'MANUAL');

  const posRevenueMinor = pos?.revenueMinor ?? 0;
  const onlineRevenueMinor = online?.revenueMinor ?? 0;
  const manualRevenueMinor = manual?.revenueMinor ?? 0;

  return {
    currency: input.currency,
    revenueMinor: posRevenueMinor + onlineRevenueMinor + manualRevenueMinor,
    posRevenueMinor,
    onlineRevenueMinor,
    manualRevenueMinor,
    orderCount:
      (pos?.orderCount ?? 0) + (online?.orderCount ?? 0) + (manual?.orderCount ?? 0),
    lowStockCount: inventory.lowStockCount + inventory.outOfStockCount,
    inDeliveryCount: inDelivery,
    codPendingMinor: cod.totalMinor,
    codPendingCount: cod.count,
    inventoryAlerts: inventory.alerts.slice(0, 5).map((a) => ({
      productName: a.productName,
      variantId: a.variantId,
      available: a.available,
    })),
  };
}
