import type {
  AnalyticsOverview,
  BusinessSignal,
  ChannelMetrics,
  CustomerMetricsSummary,
  SalesMetrics,
} from '@/types/analytics';
import { compareMetric } from '@/lib/analytics/metrics';

export function generateBusinessSignals(input: {
  sales: SalesMetrics;
  previousSales: SalesMetrics;
  customers: CustomerMetricsSummary;
  channels: ChannelMetrics[];
  inventoryLowStock: number;
  inventoryOutOfStock: number;
  topProductName?: string;
  topProductSharePercent?: number;
  hasData: boolean;
}): BusinessSignal[] {
  if (!input.hasData) {
    return [
      {
        type: 'NO_DATA',
        severity: 'INFO',
        message: 'No sales data yet for this period. Complete a sale in POS or online store to see insights.',
      },
    ];
  }

  const signals: BusinessSignal[] = [];

  if (input.previousSales.grossSalesMinor > 0) {
    const change =
      ((input.sales.grossSalesMinor - input.previousSales.grossSalesMinor) /
        input.previousSales.grossSalesMinor) *
      100;
    if (change >= 5) {
      signals.push({
        type: 'REVENUE_GROWTH',
        severity: 'INFO',
        message: `Sales increased ${change.toFixed(1)}% compared with the previous period.`,
        metadata: { changePercent: Math.round(change * 100) / 100 },
      });
    } else if (change <= -5) {
      signals.push({
        type: 'REVENUE_DECLINE',
        severity: 'WARNING',
        message: `Sales decreased ${Math.abs(change).toFixed(1)}% compared with the previous period.`,
        metadata: { changePercent: Math.round(change * 100) / 100 },
      });
    }
  }

  if (input.inventoryOutOfStock > 0) {
    signals.push({
      type: 'LOW_STOCK',
      severity: 'CRITICAL',
      message: `${input.inventoryOutOfStock} product variant${input.inventoryOutOfStock === 1 ? '' : 's'} out of stock.`,
      metadata: { outOfStock: input.inventoryOutOfStock },
    });
  } else if (input.inventoryLowStock > 0) {
    signals.push({
      type: 'LOW_STOCK',
      severity: 'WARNING',
      message: `${input.inventoryLowStock} product${input.inventoryLowStock === 1 ? '' : 's'} below reorder threshold.`,
      metadata: { lowStock: input.inventoryLowStock },
    });
  }

  if (input.sales.grossSalesMinor > 0 && input.sales.refundsMinor > 0) {
    const refundRate = (input.sales.refundsMinor / input.sales.grossSalesMinor) * 100;
    if (refundRate >= 5) {
      signals.push({
        type: 'HIGH_REFUNDS',
        severity: 'WARNING',
        message: `Refund rate is ${refundRate.toFixed(1)}% of gross sales this period.`,
        metadata: { refundRatePercent: Math.round(refundRate * 100) / 100 },
      });
    }
  }

  if (input.topProductName && input.topProductSharePercent && input.topProductSharePercent >= 20) {
    signals.push({
      type: 'TOP_PRODUCT',
      severity: 'INFO',
      message: `${input.topProductName} generated ${input.topProductSharePercent.toFixed(0)}% of revenue.`,
      metadata: { productName: input.topProductName, sharePercent: input.topProductSharePercent },
    });
  }

  if (input.customers.newCustomers > 0) {
    signals.push({
      type: 'CUSTOMER_GROWTH',
      severity: 'INFO',
      message: `${input.customers.newCustomers} new customer${input.customers.newCustomers === 1 ? '' : 's'} acquired this period.`,
      metadata: { newCustomers: input.customers.newCustomers },
    });
  }

  const pos = input.channels.find((c) => c.source === 'POS');
  const online = input.channels.find((c) => c.source === 'ONLINE');
  if (pos && online && pos.revenueMinor > 0 && online.revenueMinor > pos.revenueMinor) {
    signals.push({
      type: 'CHANNEL_GROWTH',
      severity: 'INFO',
      message: 'Online sales are outpacing POS revenue this period.',
      metadata: { posRevenue: pos.revenueMinor, onlineRevenue: online.revenueMinor },
    });
  }

  return signals.slice(0, 6);
}

export function buildSalesComparison(
  current: SalesMetrics,
  previous: SalesMetrics
): AnalyticsOverview['salesComparison'] {
  return {
    grossSalesMinor: compareMetric(current.grossSalesMinor, previous.grossSalesMinor),
    netSalesMinor: compareMetric(current.netSalesMinor, previous.netSalesMinor),
    orderCount: compareMetric(current.completedOrders, previous.completedOrders),
    averageOrderValueMinor: compareMetric(
      current.averageOrderValueMinor,
      previous.averageOrderValueMinor
    ),
  };
}

export function buildCustomerComparison(
  current: CustomerMetricsSummary,
  previous: CustomerMetricsSummary
): AnalyticsOverview['customersComparison'] {
  return {
    newCustomers: compareMetric(current.newCustomers, previous.newCustomers),
    returningCustomers: compareMetric(current.returningCustomers, previous.returningCustomers),
  };
}
