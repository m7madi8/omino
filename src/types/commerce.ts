import type {
  FulfillmentStatus,
  OrderSource,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@/types/prisma-enums';

export type OrderListItem = {
  id: string;
  orderNumber: string;
  source: OrderSource;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  customerName: string | null;
  totalMinor: number;
  paidMinor: number;
  currency: string;
  itemCount: number;
  branchName: string;
  cashierName: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type OrderDetail = {
  id: string;
  orderNumber: string;
  source: OrderSource;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  currency: string;
  subtotalMinor: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  feesAmount: number;
  totalMinor: number;
  paidMinor: number;
  refundedMinor: number;
  remainingMinor: number;
  customerName: string | null;
  customerId: string | null;
  notes: string | null;
  branchName: string;
  storeName: string;
  cashierName: string | null;
  createdAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  items: OrderItemDetail[];
  payments: PaymentDetail[];
  refunds: RefundDetail[];
  adjustments: AdjustmentDetail[];
  events: TimelineEvent[];
  stockMovements: StockImpact[];
};

export type OrderItemDetail = {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string;
  quantity: number;
  quantityRefunded: number;
  unitPriceMinor: number;
  discountAmount: number;
  taxAmount: number;
  subtotalMinor: number;
  totalMinor: number;
};

export type PaymentDetail = {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amountMinor: number;
  amountReceived: number | null;
  changeMinor: number | null;
  reference: string | null;
  createdAt: string;
  attempts: { id: string; status: PaymentStatus; amountMinor: number; errorMessage: string | null; createdAt: string }[];
};

export type RefundDetail = {
  id: string;
  amountMinor: number;
  status: string;
  reason: string | null;
  restockItems: boolean;
  createdAt: string;
  items: { orderItemId: string; quantity: number; amountMinor: number }[];
};

export type AdjustmentDetail = {
  id: string;
  type: string;
  label: string;
  amountMinor: number;
};

export type TimelineEvent = {
  id: string;
  eventType: string;
  userName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type StockImpact = {
  id: string;
  variantId: string;
  sku: string;
  productName: string;
  quantity: number;
  type: string;
  createdAt: string;
};

export type CartView = {
  id: string;
  status: string;
  currency: string;
  subtotalMinor: number;
  discountAmount: number;
  taxAmount: number;
  totalMinor: number;
  itemCount: number;
  customer: { id: string; name: string; email: string | null; phone: string | null } | null;
  items: CartItemView[];
};

export type CartItemView = {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string;
  quantity: number;
  unitPriceMinor: number;
  subtotalMinor: number;
  available: number;
};

export type PosProduct = {
  id: string;
  variantId: string;
  name: string;
  variantName: string | null;
  sku: string;
  barcode: string | null;
  priceMinor: number;
  currency: string;
  available: number;
  imageUrl: string | null;
};
