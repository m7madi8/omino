import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { PaymentMethod, PaymentStatus } from '@/types/prisma-enums';
import { logAudit } from '@/server/services/audit-service';
import { emitOrderEvent } from '@/server/events/order-events';
import {
  computePaymentStatus,
  recordOrderEvent,
  syncOrderPaymentStatus,
} from '@/server/services/order-service';

type Tx = Prisma.TransactionClient;

export function getRefundableAmount(order: {
  paidMinor: number;
  refundedMinor: number;
}) {
  return Math.max(0, order.paidMinor - order.refundedMinor);
}

export async function createPayment(
  input: {
    organizationId: string;
    storeId: string;
    branchId: string;
    orderId: string;
    userId: string;
    method: PaymentMethod;
    amountMinor: number;
    currency: string;
    amountReceived?: number;
    changeMinor?: number;
    reference?: string;
    idempotencyKey?: string;
    status?: PaymentStatus;
  },
  tx?: Tx
) {
  const run = async (client: Tx) => {
    if (input.idempotencyKey) {
      const existing = await client.payment.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existing) return existing;
    }

    const order = await client.order.findFirst({
      where: { id: input.orderId, organizationId: input.organizationId },
    });
    if (!order) throw new Error('NOT_FOUND');
    if (order.status === 'CANCELLED') throw new Error('VALIDATION_ERROR');
    if (input.amountMinor <= 0) throw new Error('VALIDATION_ERROR');

    const remaining = order.totalMinor - order.paidMinor + order.refundedMinor;
    if (input.amountMinor > remaining) throw new Error('VALIDATION_ERROR');

    const status = input.status ?? 'PAID';

    const payment = await client.payment.create({
      data: {
        organizationId: input.organizationId,
        storeId: input.storeId,
        branchId: input.branchId,
        orderId: input.orderId,
        userId: input.userId,
        method: input.method,
        status,
        amountMinor: input.amountMinor,
        currency: input.currency,
        amountReceived: input.amountReceived,
        changeMinor: input.changeMinor,
        reference: input.reference,
        idempotencyKey: input.idempotencyKey,
        attempts: {
          create: {
            status,
            amountMinor: input.amountMinor,
            reference: input.reference,
          },
        },
      },
      include: { attempts: true },
    });

    await syncOrderPaymentStatus(client, input.orderId);

    await recordOrderEvent(client, {
      organizationId: input.organizationId,
      orderId: input.orderId,
      userId: input.userId,
      eventType: status === 'FAILED' ? 'payment.failed' : 'payment.paid',
      metadata: {
        paymentId: payment.id,
        method: input.method,
        amountMinor: input.amountMinor,
      },
    });

    await logAudit(
      {
        organizationId: input.organizationId,
        userId: input.userId,
        action: status === 'FAILED' ? 'PAYMENT_FAILED' : 'PAYMENT_CREATED',
        entityType: 'Payment',
        entityId: payment.id,
        metadata: { orderId: input.orderId, amountMinor: input.amountMinor },
      },
      client
    );

    return payment;
  };

  const payment = tx ? await run(tx) : await prisma.$transaction(run);

  if (!tx) {
    await emitOrderEvent({
      type: payment.status === 'FAILED' ? 'payment.failed' : 'payment.paid',
      organizationId: input.organizationId,
      orderId: input.orderId,
      userId: input.userId,
      payload: { paymentId: payment.id },
    });
  }

  return payment;
}

export async function recordPaymentFailure(input: {
  organizationId: string;
  storeId: string;
  branchId: string;
  orderId: string;
  userId: string;
  method: PaymentMethod;
  amountMinor: number;
  currency: string;
  errorMessage: string;
  idempotencyKey?: string;
}) {
  return prisma.$transaction(async (tx) => {
    if (input.idempotencyKey) {
      const existing = await tx.payment.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existing) return existing;
    }

    const payment = await tx.payment.create({
      data: {
        organizationId: input.organizationId,
        storeId: input.storeId,
        branchId: input.branchId,
        orderId: input.orderId,
        userId: input.userId,
        method: input.method,
        status: 'FAILED',
        amountMinor: input.amountMinor,
        currency: input.currency,
        idempotencyKey: input.idempotencyKey,
        attempts: {
          create: {
            status: 'FAILED',
            amountMinor: input.amountMinor,
            errorMessage: input.errorMessage,
          },
        },
      },
    });

    await recordOrderEvent(tx, {
      organizationId: input.organizationId,
      orderId: input.orderId,
      userId: input.userId,
      eventType: 'payment.failed',
      metadata: { paymentId: payment.id, error: input.errorMessage },
    });

    await logAudit(
      {
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'PAYMENT_FAILED',
        entityType: 'Payment',
        entityId: payment.id,
        metadata: { error: input.errorMessage },
      },
      tx
    );

    return payment;
  });
}

export type RefundItemInput = {
  orderItemId: string;
  quantity: number;
};

export async function createRefund(input: {
  organizationId: string;
  userId: string;
  orderId: string;
  paymentId?: string;
  amountMinor: number;
  reason?: string;
  restockItems?: boolean;
  items?: RefundItemInput[];
  idempotencyKey?: string;
}) {
  const result = await prisma.$transaction(async (tx) => {
    if (input.idempotencyKey) {
      const existing = await tx.refund.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existing) return existing;
    }

    const order = await tx.order.findFirst({
      where: { id: input.orderId, organizationId: input.organizationId },
      include: { items: true },
    });
    if (!order) throw new Error('NOT_FOUND');
    if (order.status === 'CANCELLED') throw new Error('VALIDATION_ERROR');

    const refundable = getRefundableAmount(order);
    if (input.amountMinor <= 0 || input.amountMinor > refundable) {
      throw new Error('VALIDATION_ERROR');
    }

    if (input.items?.length) {
      for (const ri of input.items) {
        const orderItem = order.items.find((i) => i.id === ri.orderItemId);
        if (!orderItem) throw new Error('VALIDATION_ERROR');
        const maxQty = orderItem.quantity - orderItem.quantityRefunded;
        if (ri.quantity <= 0 || ri.quantity > maxQty) {
          throw new Error('VALIDATION_ERROR');
        }
      }
    }

    const refund = await tx.refund.create({
      data: {
        organizationId: input.organizationId,
        orderId: input.orderId,
        paymentId: input.paymentId,
        userId: input.userId,
        amountMinor: input.amountMinor,
        currency: order.currency,
        reason: input.reason,
        restockItems: input.restockItems ?? true,
        idempotencyKey: input.idempotencyKey,
        items: input.items?.length
          ? {
              create: input.items.map((ri) => {
                const orderItem = order.items.find((i) => i.id === ri.orderItemId)!;
                const unitTotal =
                  orderItem.totalMinor / orderItem.quantity;
                return {
                  orderItemId: ri.orderItemId,
                  quantity: ri.quantity,
                  amountMinor: Math.round(unitTotal * ri.quantity),
                };
              }),
            }
          : undefined,
      },
      include: { items: true },
    });

    const newRefundedMinor = order.refundedMinor + input.amountMinor;
    const paymentStatus = computePaymentStatus(
      order.totalMinor,
      order.paidMinor,
      newRefundedMinor
    );

    await tx.order.update({
      where: { id: order.id },
      data: {
        refundedMinor: newRefundedMinor,
        paymentStatus,
      },
    });

    if (input.items?.length) {
      for (const ri of input.items) {
        await tx.orderItem.update({
          where: { id: ri.orderItemId },
          data: { quantityRefunded: { increment: ri.quantity } },
        });
      }
    }

    if (input.restockItems !== false && input.items?.length) {
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
      for (const ri of input.items) {
        const orderItem = order.items.find((i) => i.id === ri.orderItemId)!;
        const variant = await tx.productVariant.findFirst({
          where: { id: orderItem.variantId },
        });
        if (variant?.trackInventory) {
          await adjustStockInTx(tx, {
            organizationId: order.organizationId,
            userId: input.userId,
            variantId: orderItem.variantId,
            stockLocationId: loc.id,
            quantityDelta: ri.quantity,
            type: 'RETURN',
            reason: `Refund for order ${order.orderNumber}`,
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
      eventType: 'refund.created',
      metadata: {
        refundId: refund.id,
        amountMinor: input.amountMinor,
        reason: input.reason,
      },
    });

    await logAudit(
      {
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'ORDER_REFUNDED',
        entityType: 'Refund',
        entityId: refund.id,
        metadata: { orderId: order.id, amountMinor: input.amountMinor },
      },
      tx
    );

    return refund;
  });

  await emitOrderEvent({
    type: 'refund.created',
    organizationId: input.organizationId,
    orderId: input.orderId,
    userId: input.userId,
    payload: { refundId: result.id },
  });

  return result;
}

export async function listPayments(params: {
  organizationId: string;
  orderId?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = params.page ?? 1;
  const pageSize = Math.min(params.pageSize ?? 25, 100);
  const skip = (page - 1) * pageSize;

  const where: Prisma.PaymentWhereInput = {
    organizationId: params.organizationId,
    ...(params.orderId && { orderId: params.orderId }),
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        order: { select: { orderNumber: true, totalMinor: true } },
        user: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    items: payments.map((p) => ({
      id: p.id,
      orderId: p.orderId,
      orderNumber: p.order.orderNumber,
      method: p.method,
      status: p.status,
      amountMinor: p.amountMinor,
      currency: p.currency,
      cashierName: p.user.fullName || p.user.email,
      createdAt: p.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
  };
}
