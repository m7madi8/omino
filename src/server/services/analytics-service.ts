import { prisma } from '@/lib/db';
import type { OrderSource } from '@/types/prisma-enums';

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfPreviousMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

function endOfPreviousMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 0, 23, 59, 59, 999);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export type DateRange = {
  from: Date;
  to: Date;
  label: string;
};

export function resolveDateRange(preset?: string): DateRange {
  const now = new Date();
  switch (preset) {
    case 'last_7_days':
      return { from: daysAgo(7), to: now, label: 'Last 7 days' };
    case 'last_30_days':
      return { from: daysAgo(30), to: now, label: 'Last 30 days' };
    case 'previous_month': {
      const from = startOfPreviousMonth(now);
      const to = endOfPreviousMonth(now);
      return { from, to, label: 'Previous month' };
    }
    case 'this_month':
    default:
      return { from: startOfMonth(now), to: now, label: 'This month' };
  }
}

export async function getSalesSummary(
  organizationId: string,
  range: DateRange,
  storeId?: string
) {
  const orders = await prisma.order.findMany({
    where: {
      organizationId,
      ...(storeId && { storeId }),
      status: 'COMPLETED',
      createdAt: { gte: range.from, lte: range.to },
    },
    select: {
      totalMinor: true,
      paidMinor: true,
      refundedMinor: true,
      source: true,
    },
  });

  const revenueMinor = orders.reduce((s, o) => s + o.totalMinor, 0);
  const refundedMinor = orders.reduce((s, o) => s + o.refundedMinor, 0);
  const netRevenueMinor = orders.reduce(
    (s, o) => s + o.paidMinor - o.refundedMinor,
    0
  );
  const orderCount = orders.length;
  const averageOrderValueMinor =
    orderCount > 0 ? Math.round(revenueMinor / orderCount) : 0;

  const byChannel: Record<string, { revenueMinor: number; orderCount: number }> = {};
  for (const o of orders) {
    const ch = o.source;
    if (!byChannel[ch]) byChannel[ch] = { revenueMinor: 0, orderCount: 0 };
    byChannel[ch].revenueMinor += o.totalMinor;
    byChannel[ch].orderCount += 1;
  }

  return {
    period: range.label,
    from: range.from.toISOString(),
    to: range.to.toISOString(),
    revenueMinor,
    netRevenueMinor,
    refundedMinor,
    orderCount,
    averageOrderValueMinor,
    byChannel,
  };
}

export async function compareSalesPeriods(
  organizationId: string,
  current: DateRange,
  previous: DateRange,
  storeId?: string
) {
  const [currentSummary, previousSummary] = await Promise.all([
    getSalesSummary(organizationId, current, storeId),
    getSalesSummary(organizationId, previous, storeId),
  ]);

  const revenueChange =
    previousSummary.revenueMinor > 0
      ? ((currentSummary.revenueMinor - previousSummary.revenueMinor) /
          previousSummary.revenueMinor) *
        100
      : currentSummary.revenueMinor > 0
        ? 100
        : 0;

  const orderChange =
    previousSummary.orderCount > 0
      ? ((currentSummary.orderCount - previousSummary.orderCount) /
          previousSummary.orderCount) *
        100
      : currentSummary.orderCount > 0
        ? 100
        : 0;

  return {
    current: currentSummary,
    previous: previousSummary,
    revenueChangePercent: Math.round(revenueChange * 10) / 10,
    orderChangePercent: Math.round(orderChange * 10) / 10,
  };
}

export async function getTopProducts(
  organizationId: string,
  range: DateRange,
  limit = 5,
  storeId?: string
) {
  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        organizationId,
        status: 'COMPLETED',
        createdAt: { gte: range.from, lte: range.to },
        ...(storeId && { storeId }),
      },
    },
    select: {
      productId: true,
      productName: true,
      quantity: true,
      totalMinor: true,
    },
  });

  const byProduct = new Map<
    string,
    { productId: string; name: string; quantity: number; revenueMinor: number }
  >();

  for (const item of items) {
    const key = item.productId ?? item.productName;
    const existing = byProduct.get(key) ?? {
      productId: item.productId ?? key,
      name: item.productName,
      quantity: 0,
      revenueMinor: 0,
    };
    existing.quantity += item.quantity;
    existing.revenueMinor += item.totalMinor;
    byProduct.set(key, existing);
  }

  return [...byProduct.values()]
    .sort((a, b) => b.revenueMinor - a.revenueMinor)
    .slice(0, limit);
}

export async function getOrderMetrics(
  organizationId: string,
  range: DateRange,
  storeId?: string
) {
  const orders = await prisma.order.findMany({
    where: {
      organizationId,
      ...(storeId && { storeId }),
      createdAt: { gte: range.from, lte: range.to },
    },
    select: { status: true, paymentStatus: true, refundedMinor: true },
  });

  return {
    period: range.label,
    total: orders.length,
    completed: orders.filter((o) => o.status === 'COMPLETED').length,
    cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
    pending: orders.filter((o) => ['DRAFT', 'PENDING', 'CONFIRMED', 'PROCESSING'].includes(o.status)).length,
    refunded: orders.filter((o) => o.refundedMinor > 0).length,
    refundAmountMinor: orders.reduce((s, o) => s + o.refundedMinor, 0),
  };
}

export async function getCustomerSummary(
  organizationId: string,
  range: DateRange
) {
  const [totalCustomers, newCustomers, topCustomers] = await Promise.all([
    prisma.customer.count({
      where: { organizationId, deletedAt: null, isWalkIn: false },
    }),
    prisma.customer.count({
      where: {
        organizationId,
        deletedAt: null,
        isWalkIn: false,
        createdAt: { gte: range.from, lte: range.to },
      },
    }),
    prisma.order.groupBy({
      by: ['customerId'],
      where: {
        organizationId,
        status: 'COMPLETED',
        customerId: { not: null },
        createdAt: { gte: range.from, lte: range.to },
      },
      _sum: { totalMinor: true },
      _count: { id: true },
      orderBy: { _sum: { totalMinor: 'desc' } },
      take: 5,
    }),
  ]);

  const customerIds = topCustomers
    .map((c) => c.customerId)
    .filter((id): id is string => id !== null);

  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds }, organizationId },
    select: { id: true, name: true, email: true },
  });

  const customerMap = new Map(customers.map((c) => [c.id, c]));

  return {
    period: range.label,
    totalCustomers,
    newCustomers,
    topCustomers: topCustomers.map((tc) => ({
      customerId: tc.customerId,
      name: customerMap.get(tc.customerId!)?.name ?? 'Unknown',
      email: customerMap.get(tc.customerId!)?.email,
      revenueMinor: tc._sum.totalMinor ?? 0,
      orderCount: tc._count.id,
    })),
  };
}

export async function getChannelPerformance(
  organizationId: string,
  range: DateRange,
  storeId?: string
) {
  const summary = await getSalesSummary(organizationId, range, storeId);
  const channels = Object.entries(summary.byChannel).map(([source, data]) => ({
    channel: source as OrderSource,
    revenueMinor: data.revenueMinor,
    orderCount: data.orderCount,
    sharePercent:
      summary.revenueMinor > 0
        ? Math.round((data.revenueMinor / summary.revenueMinor) * 1000) / 10
        : 0,
  }));

  return {
    period: range.label,
    channels: channels.sort((a, b) => b.revenueMinor - a.revenueMinor),
  };
}

export async function getGrowthOpportunities(organizationId: string, storeId?: string) {
  const range = resolveDateRange('last_30_days');
  const prevRange = resolveDateRange('previous_month');

  const [comparison, lowStock, customerSummary, topProducts] = await Promise.all([
    compareSalesPeriods(organizationId, range, prevRange, storeId),
    prisma.stockLevel.findMany({
      where: {
        organizationId,
        variant: { deletedAt: null, product: { deletedAt: null, status: 'ACTIVE' } },
      },
      include: {
        variant: {
          include: { product: { select: { name: true } } },
        },
      },
      take: 50,
    }),
    getCustomerSummary(organizationId, range),
    getTopProducts(organizationId, range, 3, storeId),
  ]);

  const opportunities: Array<{
    type: string;
    title: string;
    detail: string;
    severity: 'info' | 'warning' | 'opportunity';
  }> = [];

  if (comparison.revenueChangePercent < -5) {
    opportunities.push({
      type: 'sales_decline',
      title: 'Revenue declined',
      detail: `Revenue is down ${Math.abs(comparison.revenueChangePercent)}% vs the previous period.`,
      severity: 'warning',
    });
  } else if (comparison.revenueChangePercent > 10) {
    opportunities.push({
      type: 'sales_growth',
      title: 'Strong revenue growth',
      detail: `Revenue is up ${comparison.revenueChangePercent}% — consider promoting top performers.`,
      severity: 'opportunity',
    });
  }

  const lowItems = lowStock.filter((l) => {
    const available = l.quantityOnHand - l.quantityReserved;
    const threshold = l.lowStockThreshold ?? l.variant.lowStockThreshold;
    return threshold != null && available <= threshold;
  });

  if (lowItems.length > 0) {
    opportunities.push({
      type: 'low_stock',
      title: 'Restock attention needed',
      detail: `${lowItems.length} product variant(s) are at or below low-stock threshold.`,
      severity: 'warning',
    });
  }

  if (customerSummary.newCustomers > 0 && customerSummary.totalCustomers > 0) {
    const rate = Math.round(
      (customerSummary.newCustomers / customerSummary.totalCustomers) * 100
    );
    opportunities.push({
      type: 'new_customers',
      title: 'New customer acquisition',
      detail: `${customerSummary.newCustomers} new customers (${rate}% of base) in ${range.label.toLowerCase()}.`,
      severity: 'info',
    });
  }

  if (topProducts.length > 0) {
    opportunities.push({
      type: 'top_products',
      title: 'Promote top sellers',
      detail: `Top product: ${topProducts[0].name} (${topProducts[0].revenueMinor / 100} revenue).`,
      severity: 'opportunity',
    });
  }

  return opportunities.slice(0, 3);
}

export async function getBusinessSignals(organizationId: string, storeId?: string) {
  const range = resolveDateRange('last_30_days');
  const [sales, lowStockCount, orderMetrics] = await Promise.all([
    getSalesSummary(organizationId, range, storeId),
    prisma.stockLevel.count({
      where: {
        organizationId,
        quantityOnHand: { lte: 5 },
        variant: { deletedAt: null, product: { deletedAt: null, status: 'ACTIVE' } },
      },
    }),
    getOrderMetrics(organizationId, range, storeId),
  ]);

  const signals: Array<{
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'opportunity';
  }> = [];

  if (lowStockCount > 0) {
    signals.push({
      type: 'inventory',
      message: `${lowStockCount} items may need restocking.`,
      severity: 'warning',
    });
  }

  if (orderMetrics.cancelled > 0 && orderMetrics.total > 0) {
    const rate = Math.round((orderMetrics.cancelled / orderMetrics.total) * 100);
    if (rate > 10) {
      signals.push({
        type: 'orders',
        message: `Cancellation rate is ${rate}% this period.`,
        severity: 'warning',
      });
    }
  }

  if (sales.orderCount > 0) {
    signals.push({
      type: 'sales',
      message: `${sales.orderCount} completed orders in ${range.label.toLowerCase()}.`,
      severity: 'info',
    });
  }

  return signals;
}
