import type { OrderSource } from '@/types/prisma-enums';

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'custom';

export type ResolvedDateRange = {
  preset: DateRangePreset;
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
  label: string;
};

export type AnalyticsFilters = {
  organizationId: string;
  storeId?: string;
  branchId?: string;
  channel?: OrderSource;
  from: Date;
  to: Date;
};

export type MetricComparison = {
  current: number;
  previous: number;
  changePercent: number | null;
  direction: 'up' | 'down' | 'flat';
};

export type SalesMetrics = {
  grossSalesMinor: number;
  discountsMinor: number;
  taxesMinor: number;
  feesMinor: number;
  shippingMinor: number;
  refundsMinor: number;
  netSalesMinor: number;
  orderCount: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  itemCount: number;
  averageOrderValueMinor: number;
};

export type CustomerMetricsSummary = {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  repeatPurchaseRate: number;
  revenueFromNewMinor: number;
  revenueFromReturningMinor: number;
};

export type ChannelMetrics = {
  source: OrderSource;
  revenueMinor: number;
  orderCount: number;
  averageOrderValueMinor: number;
};

export type TimeSeriesPoint = {
  bucket: string;
  revenueMinor: number;
  orderCount: number;
};

export type TopProductRow = {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string;
  unitsSold: number;
  revenueMinor: number;
  orderCount: number;
};

export type InventoryAlert = {
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string;
  available: number;
  threshold: number | null;
  status: 'LOW_STOCK' | 'OUT_OF_STOCK';
};

export type InventoryMetricsSummary = {
  lowStockCount: number;
  outOfStockCount: number;
  movementCount: number;
  alerts: InventoryAlert[];
};

export type BusinessSignalSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type BusinessSignalType =
  | 'REVENUE_GROWTH'
  | 'REVENUE_DECLINE'
  | 'LOW_STOCK'
  | 'HIGH_REFUNDS'
  | 'TOP_PRODUCT'
  | 'CUSTOMER_GROWTH'
  | 'CHANNEL_GROWTH'
  | 'NO_DATA';

export type BusinessSignal = {
  type: BusinessSignalType;
  severity: BusinessSignalSeverity;
  message: string;
  metadata?: Record<string, unknown>;
};

export type RecentOrderRow = {
  id: string;
  orderNumber: string;
  source: OrderSource;
  status: string;
  totalMinor: number;
  currency: string;
  customerName: string | null;
  createdAt: string;
};

export type AnalyticsOverview = {
  range: ResolvedDateRange;
  currency: string;
  sales: SalesMetrics;
  salesComparison: {
    grossSalesMinor: MetricComparison;
    netSalesMinor: MetricComparison;
    orderCount: MetricComparison;
    averageOrderValueMinor: MetricComparison;
  };
  customers: CustomerMetricsSummary;
  customersComparison: {
    newCustomers: MetricComparison;
    returningCustomers: MetricComparison;
  };
  channels: ChannelMetrics[];
  revenueSeries: TimeSeriesPoint[];
  ordersSeries: TimeSeriesPoint[];
  topProducts: TopProductRow[];
  inventory: InventoryMetricsSummary;
  recentOrders: RecentOrderRow[];
  signals: BusinessSignal[];
  hasData: boolean;
};

export type BusinessContextSnapshot = {
  generatedAt: string;
  organizationId: string;
  currency: string;
  period: { from: string; to: string; label: string };
  overview: {
    revenue: { grossMinor: number; netMinor: number; refundsMinor: number };
    orders: { total: number; completed: number; aovMinor: number };
    customers: { total: number; new: number; returning: number; repeatRate: number };
    channels: ChannelMetrics[];
    inventory: { lowStock: number; outOfStock: number };
  };
  trends: { revenueSeries: TimeSeriesPoint[]; ordersSeries: TimeSeriesPoint[] };
  topProducts: TopProductRow[];
  signals: BusinessSignal[];
};
