import type { MetricComparison, SalesMetrics } from '@/types/analytics';

/** Net sales = gross completed order totals minus refunds recorded on those orders. */
export function computeNetSales(grossSalesMinor: number, refundsMinor: number): number {
  return Math.max(0, grossSalesMinor - refundsMinor);
}

export function computeAov(revenueMinor: number, orderCount: number): number {
  if (orderCount <= 0) return 0;
  return Math.round(revenueMinor / orderCount);
}

export function computeRepeatRate(returning: number, totalWithOrders: number): number {
  if (totalWithOrders <= 0) return 0;
  return Math.round((returning / totalWithOrders) * 10000) / 100;
}

export function compareMetric(current: number, previous: number): MetricComparison {
  if (previous === 0 && current === 0) {
    return { current, previous, changePercent: null, direction: 'flat' };
  }
  if (previous === 0) {
    return { current, previous, changePercent: null, direction: current > 0 ? 'up' : 'flat' };
  }
  const changePercent = Math.round(((current - previous) / previous) * 10000) / 100;
  const direction = changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'flat';
  return { current, previous, changePercent, direction };
}

export function aggregateSalesFromOrders(
  orders: {
    status: string;
    totalMinor: number;
    discountAmount: number;
    taxAmount: number;
    feesAmount: number;
    shippingAmount: number;
    refundedMinor: number;
    items?: { quantity: number }[];
  }[]
): SalesMetrics {
  const completed = orders.filter((o) => o.status === 'COMPLETED');
  const grossSalesMinor = completed.reduce((s, o) => s + o.totalMinor, 0);
  const discountsMinor = completed.reduce((s, o) => s + o.discountAmount, 0);
  const taxesMinor = completed.reduce((s, o) => s + o.taxAmount, 0);
  const feesMinor = completed.reduce((s, o) => s + o.feesAmount, 0);
  const shippingMinor = completed.reduce((s, o) => s + o.shippingAmount, 0);
  const refundsMinor = completed.reduce((s, o) => s + o.refundedMinor, 0);
  const netSalesMinor = computeNetSales(grossSalesMinor, refundsMinor);
  const itemCount = completed.reduce(
    (s, o) => s + (o.items?.reduce((is, i) => is + i.quantity, 0) ?? 0),
    0
  );

  return {
    grossSalesMinor,
    discountsMinor,
    taxesMinor,
    feesMinor,
    shippingMinor,
    refundsMinor,
    netSalesMinor,
    orderCount: orders.length,
    completedOrders: completed.length,
    pendingOrders: orders.filter((o) => ['DRAFT', 'PENDING', 'CONFIRMED', 'PROCESSING'].includes(o.status))
      .length,
    cancelledOrders: orders.filter((o) => o.status === 'CANCELLED').length,
    itemCount,
    averageOrderValueMinor: computeAov(grossSalesMinor, completed.length),
  };
}
