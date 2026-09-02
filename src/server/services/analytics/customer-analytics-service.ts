import { prisma } from '@/lib/db';
import { computeRepeatRate } from '@/lib/analytics/metrics';
import type { AnalyticsFilters, CustomerMetricsSummary } from '@/types/analytics';
import { buildCompletedOrderWhere } from './analytics-query';

export async function getCustomerMetricsSummary(
  filters: AnalyticsFilters,
  range: { from: Date; to: Date }
): Promise<CustomerMetricsSummary> {
  const [totalCustomers, newCustomers, ordersInRange] = await Promise.all([
    prisma.customer.count({
      where: { organizationId: filters.organizationId, deletedAt: null, isWalkIn: false },
    }),
    prisma.customer.count({
      where: {
        organizationId: filters.organizationId,
        deletedAt: null,
        isWalkIn: false,
        createdAt: { gte: range.from, lte: range.to },
      },
    }),
    prisma.order.findMany({
      where: {
        ...buildCompletedOrderWhere(filters, range),
        customerId: { not: null },
      },
      select: { customerId: true, totalMinor: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const customerOrderCounts = new Map<string, { count: number; revenue: number; firstInRange: boolean }>();
  const priorOrderCustomers = new Set<string>();

  if (ordersInRange.length) {
    const priorOrders = await prisma.order.findMany({
      where: {
        organizationId: filters.organizationId,
        status: 'COMPLETED',
        customerId: { not: null },
        OR: [
          { completedAt: { lt: range.from } },
          { completedAt: null, createdAt: { lt: range.from } },
        ],
        ...(filters.storeId && { storeId: filters.storeId }),
        ...(filters.branchId && { branchId: filters.branchId }),
        ...(filters.channel && { source: filters.channel }),
      },
      select: { customerId: true },
      distinct: ['customerId'],
    });
    for (const o of priorOrders) {
      if (o.customerId) priorOrderCustomers.add(o.customerId);
    }
  }

  let revenueFromNewMinor = 0;
  let revenueFromReturningMinor = 0;
  const customersInRange = new Set<string>();

  for (const o of ordersInRange) {
    if (!o.customerId) continue;
    customersInRange.add(o.customerId);
    const isReturning = priorOrderCustomers.has(o.customerId);
    const entry = customerOrderCounts.get(o.customerId) ?? { count: 0, revenue: 0, firstInRange: true };
    entry.count += 1;
    entry.revenue += o.totalMinor;
    customerOrderCounts.set(o.customerId, entry);

    if (isReturning) revenueFromReturningMinor += o.totalMinor;
    else revenueFromNewMinor += o.totalMinor;
  }

  const returningCustomers = Array.from(customersInRange).filter((id) => priorOrderCustomers.has(id)).length;

  return {
    totalCustomers,
    newCustomers,
    returningCustomers,
    repeatPurchaseRate: computeRepeatRate(returningCustomers, customersInRange.size),
    revenueFromNewMinor,
    revenueFromReturningMinor,
  };
}
