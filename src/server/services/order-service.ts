import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type {
  FulfillmentStatus,
  OrderSource,
  OrderStatus,
  PaymentStatus,
} from '@/types/prisma-enums';
import { logAudit } from '@/server/services/audit-service';
import { emitOrderEvent } from '@/server/events/order-events';

type Tx = Prisma.TransactionClient;

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function assertOrderTransition(from: OrderStatus, to: OrderStatus) {
  if (!ORDER_TRANSITIONS[from].includes(to)) {
    throw new Error('INVALID_STATE_TRANSITION');
  }
}

export function computePaymentStatus(
  totalMinor: number,
  paidMinor: number,
  refundedMinor: number
): PaymentStatus {
  const netPaid = paidMinor - refundedMinor;
  if (refundedMinor > 0 && netPaid <= 0) return 'REFUNDED';
  if (refundedMinor > 0 && netPaid < totalMinor) return 'PARTIALLY_REFUNDED';
  if (paidMinor >= totalMinor && totalMinor > 0) return 'PAID';
  if (paidMinor > 0 && paidMinor < totalMinor) return 'PARTIALLY_PAID';
  return 'PENDING';
}

export type LineInput = {
  unitPriceMinor: number;
  quantity: number;
  discountAmount?: number;
  taxAmount?: number;
};

export function calculateLineTotals(line: LineInput) {
  const discount = line.discountAmount ?? 0;
  const subtotalMinor = line.unitPriceMinor * line.quantity - discount;
  const taxAmount = line.taxAmount ?? 0;
  const totalMinor = subtotalMinor + taxAmount;
  return { subtotalMinor, taxAmount, totalMinor };
}

export type OrderTotalsInput = {
  lines: LineInput[];
  discountAmount?: number;
  taxRateBps?: number;
  shippingAmount?: number;
  feesAmount?: number;
};

export function calculateOrderTotals(input: OrderTotalsInput) {
  const lineResults = input.lines.map(calculateLineTotals);
  const subtotalMinor = lineResults.reduce((s, l) => s + l.subtotalMinor, 0);
  const lineTax = lineResults.reduce((s, l) => s + l.taxAmount, 0);
  const cartDiscount = input.discountAmount ?? 0;
  const taxableBase = Math.max(0, subtotalMinor - cartDiscount);
  const taxFromRate = input.taxRateBps
    ? Math.round((taxableBase * input.taxRateBps) / 10000)
    : 0;
  const taxAmount = lineTax + taxFromRate;
  const shippingAmount = input.shippingAmount ?? 0;
  const feesAmount = input.feesAmount ?? 0;
  const totalMinor = taxableBase + taxAmount + shippingAmount + feesAmount;
  return {
    subtotalMinor,
    discountAmount: cartDiscount,
    taxAmount,
    shippingAmount,
    feesAmount,
    totalMinor,
  };
}

export async function generateOrderNumber(
  organizationId: string,
  tx: Tx = prisma
): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await tx.orderNumberSequence.upsert({
    where: { organizationId_year: { organizationId, year } },
    create: { organizationId, year, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  const num = seq.lastNumber.toString().padStart(6, '0');
  return `OM-${year}-${num}`;
}

export async function recordOrderEvent(
  tx: Tx,
  input: {
    organizationId: string;
    orderId: string;
    userId?: string;
    eventType: string;
    metadata?: Record<string, unknown>;
  }
) {
  return tx.orderEvent.create({
    data: {
      organizationId: input.organizationId,
      orderId: input.orderId,
      userId: input.userId,
      eventType: input.eventType,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function listOrders(params: {
  organizationId: string;
  storeId?: string;
  branchId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  source?: OrderSource;
  codPending?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'totalMinor' | 'orderNumber';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}) {
  const page = params.page ?? 1;
  const pageSize = Math.min(params.pageSize ?? 25, 100);
  const skip = (page - 1) * pageSize;
  const sortBy = params.sortBy ?? 'createdAt';
  const sortDir = params.sortDir ?? 'desc';

  const where: Prisma.OrderWhereInput = {
    organizationId: params.organizationId,
    ...(params.storeId && { storeId: params.storeId }),
    ...(params.branchId && { branchId: params.branchId }),
    ...(params.status && { status: params.status }),
    ...(params.paymentStatus && { paymentStatus: params.paymentStatus }),
    ...(params.source && { source: params.source }),
    ...(params.codPending && {
      paymentStatus: { in: ['PENDING', 'PARTIALLY_PAID'] },
      status: { notIn: ['CANCELLED', 'COMPLETED'] },
      payments: { some: { method: 'COD', status: 'PENDING' } },
    }),
    ...(params.search && {
      OR: [
        { orderNumber: { contains: params.search, mode: 'insensitive' } },
        { customerName: { contains: params.search, mode: 'insensitive' } },
      ],
    }),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        branch: { select: { name: true } },
        user: { select: { fullName: true, email: true } },
        _count: { select: { items: true } },
      },
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  const items = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    source: o.source as OrderSource,
    status: o.status as OrderStatus,
    paymentStatus: o.paymentStatus as PaymentStatus,
    fulfillmentStatus: o.fulfillmentStatus as FulfillmentStatus,
    customerName: o.customerName,
    totalMinor: o.totalMinor,
    paidMinor: o.paidMinor,
    currency: o.currency,
    itemCount: o._count.items,
    branchName: o.branch.name,
    cashierName: o.user?.fullName || o.user?.email || null,
    createdAt: o.createdAt.toISOString(),
    completedAt: o.completedAt?.toISOString() ?? null,
  }));

  return { items, total, page, pageSize };
}

export async function getOrderDetail(organizationId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, organizationId },
    include: {
      store: { select: { name: true } },
      branch: { select: { name: true } },
      user: { select: { fullName: true, email: true } },
      items: { orderBy: { productName: 'asc' } },
      payments: {
        orderBy: { createdAt: 'asc' },
        include: { attempts: { orderBy: { createdAt: 'asc' } } },
      },
      refunds: {
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      },
      adjustments: { orderBy: { createdAt: 'asc' } },
      events: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true, email: true } } },
      },
    },
  });

  if (!order) throw new Error('NOT_FOUND');

  const movements = await prisma.stockMovement.findMany({
    where: {
      organizationId,
      referenceType: 'Order',
      referenceId: orderId,
    },
    include: {
      variant: {
        include: { product: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const remainingMinor = Math.max(0, order.totalMinor - order.paidMinor + order.refundedMinor);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    source: order.source,
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    currency: order.currency,
    subtotalMinor: order.subtotalMinor,
    discountAmount: order.discountAmount,
    taxAmount: order.taxAmount,
    shippingAmount: order.shippingAmount,
    feesAmount: order.feesAmount,
    totalMinor: order.totalMinor,
    paidMinor: order.paidMinor,
    refundedMinor: order.refundedMinor,
    remainingMinor,
    customerName: order.customerName,
    customerId: order.customerId,
    notes: order.notes,
    branchName: order.branch.name,
    storeName: order.store.name,
    cashierName: order.user?.fullName || order.user?.email || null,
    createdAt: order.createdAt.toISOString(),
    completedAt: order.completedAt?.toISOString() ?? null,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    cancelReason: order.cancelReason,
    items: order.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      variantId: i.variantId,
      productName: i.productName,
      variantName: i.variantName,
      sku: i.sku,
      quantity: i.quantity,
      quantityRefunded: i.quantityRefunded,
      unitPriceMinor: i.unitPriceMinor,
      discountAmount: i.discountAmount,
      taxAmount: i.taxAmount,
      subtotalMinor: i.subtotalMinor,
      totalMinor: i.totalMinor,
    })),
    payments: order.payments.map((p) => ({
      id: p.id,
      method: p.method,
      status: p.status,
      amountMinor: p.amountMinor,
      amountReceived: p.amountReceived,
      changeMinor: p.changeMinor,
      reference: p.reference,
      createdAt: p.createdAt.toISOString(),
      attempts: p.attempts.map((a) => ({
        id: a.id,
        status: a.status,
        amountMinor: a.amountMinor,
        errorMessage: a.errorMessage,
        createdAt: a.createdAt.toISOString(),
      })),
    })),
    refunds: order.refunds.map((r) => ({
      id: r.id,
      amountMinor: r.amountMinor,
      status: r.status,
      reason: r.reason,
      restockItems: r.restockItems,
      createdAt: r.createdAt.toISOString(),
      items: r.items.map((ri) => ({
        orderItemId: ri.orderItemId,
        quantity: ri.quantity,
        amountMinor: ri.amountMinor,
      })),
    })),
    adjustments: order.adjustments.map((a) => ({
      id: a.id,
      type: a.type,
      label: a.label,
      amountMinor: a.amountMinor,
    })),
    events: order.events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      userName: e.user?.fullName || e.user?.email || null,
      metadata: e.metadata as Record<string, unknown> | null,
      createdAt: e.createdAt.toISOString(),
    })),
    stockMovements: movements.map((m) => ({
      id: m.id,
      variantId: m.variantId,
      sku: m.variant.sku,
      productName: m.variant.product.name,
      quantity: m.quantity,
      type: m.type,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

export async function cancelOrder(input: {
  organizationId: string;
  userId: string;
  orderId: string;
  reason: string;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: input.orderId, organizationId: input.organizationId },
      include: { items: true },
    });
    if (!order) throw new Error('NOT_FOUND');
    if (order.status === 'CANCELLED') throw new Error('VALIDATION_ERROR');
    if (!['DRAFT', 'PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status)) {
      throw new Error('INVALID_STATE_TRANSITION');
    }

    assertOrderTransition(order.status as OrderStatus, 'CANCELLED');

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        fulfillmentStatus: 'CANCELLED',
        paymentStatus: order.paidMinor > 0 ? order.paymentStatus : 'CANCELLED',
        cancelledAt: new Date(),
        cancelledById: input.userId,
        cancelReason: input.reason,
      },
    });

    if (['CONFIRMED', 'PROCESSING', 'COMPLETED'].includes(order.status)) {
      const { adjustStockInTx, ensureDefaultStockLocation } = await import(
        '@/server/services/inventory-service'
      );
      const loc = await ensureDefaultStockLocation(
        order.organizationId,
        order.storeId,
        order.branchId,
        'Branch',
        tx
      );
      for (const item of order.items) {
        const variant = await tx.productVariant.findFirst({
          where: { id: item.variantId, organizationId: order.organizationId },
        });
        if (variant?.trackInventory) {
          await adjustStockInTx(tx, {
            organizationId: order.organizationId,
            userId: input.userId,
            variantId: item.variantId,
            stockLocationId: loc.id,
            quantityDelta: item.quantity,
            type: 'RETURN',
            reason: `Order ${order.orderNumber} cancelled`,
            referenceType: 'Order',
            referenceId: order.id,
          });
        }
      }
    }

    await recordOrderEvent(tx, {
      organizationId: input.organizationId,
      orderId: order.id,
      userId: input.userId,
      eventType: 'order.cancelled',
      metadata: { reason: input.reason },
    });

    await logAudit(
      {
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'ORDER_CANCELLED',
        entityType: 'Order',
        entityId: order.id,
        metadata: { reason: input.reason, orderNumber: order.orderNumber },
      },
      tx
    );

    return updated;
  });

  await emitOrderEvent({
    type: 'order.cancelled',
    organizationId: input.organizationId,
    orderId: input.orderId,
    userId: input.userId,
  });

  return result;
}

export async function syncOrderPaymentStatus(tx: Tx, orderId: string) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { payments: true },
  });
  if (!order) return;

  const paidMinor = order.payments
    .filter((p) => ['PAID', 'AUTHORIZED', 'PARTIALLY_PAID'].includes(p.status))
    .reduce((s, p) => s + p.amountMinor, 0);

  const paymentStatus = computePaymentStatus(
    order.totalMinor,
    paidMinor,
    order.refundedMinor
  );

  await tx.order.update({
    where: { id: orderId },
    data: { paidMinor, paymentStatus },
  });
}

export async function advanceOrderStatus(input: {
  organizationId: string;
  userId: string;
  orderId: string;
  action:
    | 'confirm'
    | 'process'
    | 'out_for_delivery'
    | 'deliver'
    | 'cancel';
  reason?: string;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: input.orderId, organizationId: input.organizationId },
    });
    if (!order) throw new Error('NOT_FOUND');
    if (order.status === 'CANCELLED' || order.status === 'COMPLETED') {
      throw new Error('INVALID_STATE_TRANSITION');
    }

    let status = order.status as OrderStatus;
    let fulfillmentStatus = order.fulfillmentStatus as FulfillmentStatus;
    let eventType = '';

    switch (input.action) {
      case 'confirm':
        assertOrderTransition(status, 'CONFIRMED');
        status = 'CONFIRMED';
        eventType = 'order.confirmed';
        break;
      case 'process':
        assertOrderTransition(status, 'PROCESSING');
        status = 'PROCESSING';
        eventType = 'order.processing';
        break;
      case 'out_for_delivery':
        if (status !== 'PROCESSING') assertOrderTransition(status, 'PROCESSING');
        status = 'PROCESSING';
        fulfillmentStatus = 'PARTIALLY_FULFILLED';
        eventType = 'delivery.out_for_delivery';
        break;
      case 'deliver':
        if (status !== 'PROCESSING') assertOrderTransition(status, 'PROCESSING');
        status = 'PROCESSING';
        fulfillmentStatus = 'FULFILLED';
        eventType = 'delivery.delivered';
        break;
      default:
        throw new Error('INVALID_ACTION');
    }

    const updated = await tx.order.update({
      where: { id: order.id },
      data: { status, fulfillmentStatus },
    });

    await recordOrderEvent(tx, {
      organizationId: input.organizationId,
      orderId: order.id,
      userId: input.userId,
      eventType,
    });

    return updated;
  });

  await emitOrderEvent({
    type: 'order.updated',
    organizationId: input.organizationId,
    orderId: input.orderId,
    userId: input.userId,
  });

  return result;
}

export async function completeOrderAfterCollection(
  organizationId: string,
  orderId: string,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, organizationId },
    });
    if (!order) throw new Error('NOT_FOUND');
    if (order.status === 'COMPLETED') return order;

    assertOrderTransition(order.status as OrderStatus, 'COMPLETED');

    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        fulfillmentStatus: 'FULFILLED',
        completedAt: new Date(),
      },
    });

    await recordOrderEvent(tx, {
      organizationId,
      orderId,
      userId,
      eventType: 'payment.collected',
    });

    return updated;
  });
}
