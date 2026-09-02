import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { aggregateSalesFromOrders } from '@/lib/analytics/metrics';
import { seriesGranularity } from '@/lib/analytics/date-range';
import type {
  AnalyticsFilters,
  ChannelMetrics,
  SalesMetrics,
  TimeSeriesPoint,
} from '@/types/analytics';
import { buildCompletedOrderWhere, buildOrderWhere } from './analytics-query';

const orderSelect = {
  status: true,
  source: true,
  totalMinor: true,
  discountAmount: true,
  taxAmount: true,
  feesAmount: true,
  shippingAmount: true,
  refundedMinor: true,
  paidMinor: true,
  items: { select: { quantity: true } },
} satisfies Prisma.OrderSelect;

export async function getSalesMetrics(
  filters: AnalyticsFilters,
  range: { from: Date; to: Date }
): Promise<SalesMetrics> {
  const orders = await prisma.order.findMany({
    where: buildOrderWhere(filters, range),
    select: orderSelect,
  });
  return aggregateSalesFromOrders(orders);
}

export async function getChannelMetrics(
  filters: AnalyticsFilters,
  range: { from: Date; to: Date }
): Promise<ChannelMetrics[]> {
  const orders = await prisma.order.findMany({
    where: buildCompletedOrderWhere(filters, range),
    select: { source: true, totalMinor: true },
  });

  const bySource = new Map<string, { revenue: number; count: number }>();
  for (const o of orders) {
    const cur = bySource.get(o.source) ?? { revenue: 0, count: 0 };
    cur.revenue += o.totalMinor;
    cur.count += 1;
    bySource.set(o.source, cur);
  }

  return Array.from(bySource.entries()).map(([source, v]) => ({
    source: source as ChannelMetrics['source'],
    revenueMinor: v.revenue,
    orderCount: v.count,
    averageOrderValueMinor: v.count > 0 ? Math.round(v.revenue / v.count) : 0,
  }));
}

export async function getRevenueTimeSeries(
  filters: AnalyticsFilters,
  range: { from: Date; to: Date }
): Promise<TimeSeriesPoint[]> {
  const granularity = seriesGranularity(range.from, range.to);
  const trunc = granularity === 'hour' ? 'hour' : granularity === 'day' ? 'day' : granularity === 'week' ? 'week' : 'month';

  const storeFilter = filters.storeId ? Prisma.sql`AND o.store_id = ${filters.storeId}::uuid` : Prisma.empty;
  const branchFilter = filters.branchId ? Prisma.sql`AND o.branch_id = ${filters.branchId}::uuid` : Prisma.empty;
  const channelFilter = filters.channel ? Prisma.sql`AND o.source = ${filters.channel}::"OrderSource"` : Prisma.empty;

  const rows = await prisma.$queryRaw<
    { bucket: Date; revenue_minor: bigint; order_count: bigint }[]
  >`
    SELECT date_trunc(${trunc}, COALESCE(o.completed_at, o.created_at)) AS bucket,
           COALESCE(SUM(o.total_minor), 0) AS revenue_minor,
           COUNT(*)::bigint AS order_count
    FROM orders o
    WHERE o.organization_id = ${filters.organizationId}::uuid
      AND o.status = 'COMPLETED'
      AND COALESCE(o.completed_at, o.created_at) >= ${range.from}
      AND COALESCE(o.completed_at, o.created_at) <= ${range.to}
      ${storeFilter}
      ${branchFilter}
      ${channelFilter}
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  return rows.map((r) => ({
    bucket: r.bucket.toISOString(),
    revenueMinor: Number(r.revenue_minor),
    orderCount: Number(r.order_count),
  }));
}

export async function getOrdersTimeSeries(
  filters: AnalyticsFilters,
  range: { from: Date; to: Date }
): Promise<TimeSeriesPoint[]> {
  const series = await getRevenueTimeSeries(filters, range);
  return series.map((p) => ({ ...p, revenueMinor: p.revenueMinor }));
}
