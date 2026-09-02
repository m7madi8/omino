import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { DiscountType, PaymentMethod } from '@/types/prisma-enums';
import type { CartView, PosProduct } from '@/types/commerce';
import {
  adjustStockInTx,
  computeAvailable,
  ensureDefaultStockLocation,
} from '@/server/services/inventory-service';
import { logAudit } from '@/server/services/audit-service';
import { emitOrderEvent } from '@/server/events/order-events';
import {
  calculateOrderTotals,
  generateOrderNumber,
  recordOrderEvent,
} from '@/server/services/order-service';
import { createPayment } from '@/server/services/payment-service';

type Tx = Prisma.TransactionClient;

type PosContext = {
  organizationId: string;
  userId: string;
  storeId: string;
  branchId: string;
  currency: string;
};

export async function ensureDefaultRegister(
  organizationId: string,
  storeId: string,
  branchId: string,
  tx: Tx = prisma
) {
  const existing = await tx.register.findFirst({
    where: { organizationId, branchId, isDefault: true },
  });
  if (existing) return existing;

  return tx.register.create({
    data: {
      organizationId,
      storeId,
      branchId,
      name: 'Register 1',
      slug: 'register-1',
      isDefault: true,
    },
  });
}

export async function getOrCreatePosSession(ctx: PosContext) {
  const register = await ensureDefaultRegister(
    ctx.organizationId,
    ctx.storeId,
    ctx.branchId
  );

  const open = await prisma.posSession.findFirst({
    where: {
      organizationId: ctx.organizationId,
      registerId: register.id,
      userId: ctx.userId,
      status: 'OPEN',
    },
  });
  if (open) return open;

  return prisma.posSession.create({
    data: {
      organizationId: ctx.organizationId,
      storeId: ctx.storeId,
      branchId: ctx.branchId,
      registerId: register.id,
      userId: ctx.userId,
      status: 'OPEN',
    },
  });
}

async function recalculateCart(tx: Tx, cartId: string) {
  const cart = await tx.cart.findUnique({
    where: { id: cartId },
    include: { items: true },
  });
  if (!cart) throw new Error('NOT_FOUND');

  const lineInputs = cart.items.map((i) => ({
    unitPriceMinor: i.unitPriceMinor,
    quantity: i.quantity,
    discountAmount: i.discountAmount,
  }));

  let discountAmount = 0;
  if (cart.discountType && cart.discountValue != null) {
    const sub = lineInputs.reduce(
      (s, l) => s + l.unitPriceMinor * l.quantity - (l.discountAmount ?? 0),
      0
    );
    discountAmount =
      cart.discountType === 'PERCENT'
        ? Math.round((sub * cart.discountValue) / 10000)
        : cart.discountValue;
  }

  const totals = calculateOrderTotals({
    lines: lineInputs,
    discountAmount,
    taxRateBps: cart.taxRateBps,
  });

  return tx.cart.update({
    where: { id: cartId },
    data: {
      subtotalMinor: totals.subtotalMinor,
      discountAmount: totals.discountAmount,
      taxAmount: totals.taxAmount,
      totalMinor: totals.totalMinor,
    },
    include: {
      items: true,
      customer: { select: { id: true, name: true, email: true, phone: true } },
    },
  });
}

export async function getOrCreateActiveCart(ctx: PosContext) {
  const session = await getOrCreatePosSession(ctx);
  const register = await ensureDefaultRegister(
    ctx.organizationId,
    ctx.storeId,
    ctx.branchId
  );

  const existing = await prisma.cart.findFirst({
    where: {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      posSessionId: session.id,
      status: 'ACTIVE',
    },
    include: { items: true, customer: { select: { id: true, name: true, email: true, phone: true } } },
  });
  if (existing) return mapCartView(existing);

  const cart = await prisma.cart.create({
    data: {
      organizationId: ctx.organizationId,
      storeId: ctx.storeId,
      branchId: ctx.branchId,
      registerId: register.id,
      posSessionId: session.id,
      userId: ctx.userId,
      currency: ctx.currency,
      status: 'ACTIVE',
    },
    include: { items: true, customer: { select: { id: true, name: true, email: true, phone: true } } },
  });

  return mapCartView(cart);
}

function mapCartView(
  cart: {
    id: string;
    status: string;
    currency: string;
    subtotalMinor: number;
    discountAmount: number;
    taxAmount: number;
    totalMinor: number;
    customer?: { id: string; name: string; email: string | null; phone: string | null } | null;
    items: {
      id: string;
      productId: string;
      variantId: string;
      productName: string;
      variantName: string | null;
      sku: string;
      quantity: number;
      unitPriceMinor: number;
      subtotalMinor: number;
    }[];
  },
  availability?: Map<string, number>
): CartView {
  return {
    id: cart.id,
    status: cart.status,
    currency: cart.currency,
    subtotalMinor: cart.subtotalMinor,
    discountAmount: cart.discountAmount,
    taxAmount: cart.taxAmount,
    totalMinor: cart.totalMinor,
    itemCount: cart.items.reduce((s, i) => s + i.quantity, 0),
    customer: cart.customer
      ? {
          id: cart.customer.id,
          name: cart.customer.name,
          email: cart.customer.email,
          phone: cart.customer.phone,
        }
      : null,
    items: cart.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      variantId: i.variantId,
      productName: i.productName,
      variantName: i.variantName,
      sku: i.sku,
      quantity: i.quantity,
      unitPriceMinor: i.unitPriceMinor,
      subtotalMinor: i.subtotalMinor,
      available: availability?.get(i.variantId) ?? 0,
    })),
  };
}

export async function searchPosProducts(
  ctx: PosContext,
  search?: string
): Promise<PosProduct[]> {
  const loc = await ensureDefaultStockLocation(
    ctx.organizationId,
    ctx.storeId,
    ctx.branchId,
    'Branch'
  );

  const variants = await prisma.productVariant.findMany({
    where: {
      organizationId: ctx.organizationId,
      deletedAt: null,
      status: 'ACTIVE',
      product: { deletedAt: null, status: 'ACTIVE' },
      ...(search && {
        OR: [
          { sku: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { product: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    },
    include: {
      product: {
        include: { images: { where: { isPrimary: true }, take: 1 } },
      },
      stockLevels: { where: { stockLocationId: loc.id } },
    },
    take: 50,
    orderBy: { product: { name: 'asc' } },
  });

  return variants.map((v) => {
    const level = v.stockLevels[0];
    const available = level
      ? computeAvailable(level.quantityOnHand, level.quantityReserved)
      : 0;
    return {
      id: v.productId,
      variantId: v.id,
      name: v.product.name,
      variantName: v.name,
      sku: v.sku,
      barcode: v.barcode,
      priceMinor: v.sellingPrice,
      currency: v.currency,
      available,
      imageUrl: v.product.images[0]?.url ?? null,
    };
  });
}

export async function addToCart(
  ctx: PosContext,
  input: { variantId: string; quantity?: number }
) {
  const qty = input.quantity ?? 1;
  if (qty <= 0) throw new Error('VALIDATION_ERROR');

  const variant = await prisma.productVariant.findFirst({
    where: {
      id: input.variantId,
      organizationId: ctx.organizationId,
      deletedAt: null,
      status: 'ACTIVE',
      product: { deletedAt: null, status: 'ACTIVE' },
    },
    include: { product: true },
  });
  if (!variant) throw new Error('NOT_FOUND');

  const cart = await getOrCreateActiveCart(ctx);

  const updated = await prisma.$transaction(async (tx) => {
    const existingItem = await tx.cartItem.findFirst({
      where: { cartId: cart.id, variantId: variant.id },
    });

    if (existingItem) {
      await tx.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + qty,
          subtotalMinor: (existingItem.quantity + qty) * existingItem.unitPriceMinor,
        },
      });
    } else {
      await tx.cartItem.create({
        data: {
          cartId: cart.id,
          productId: variant.productId,
          variantId: variant.id,
          productName: variant.product.name,
          variantName: variant.name,
          sku: variant.sku,
          quantity: qty,
          unitPriceMinor: variant.sellingPrice,
          subtotalMinor: variant.sellingPrice * qty,
        },
      });
    }

    return recalculateCart(tx, cart.id);
  });

  return mapCartView(updated);
}

export async function updateCartItem(
  ctx: PosContext,
  itemId: string,
  quantity: number
) {
  if (quantity < 0) throw new Error('VALIDATION_ERROR');

  const updated = await prisma.$transaction(async (tx) => {
    const item = await tx.cartItem.findFirst({
      where: { id: itemId },
      include: { cart: true },
    });
    if (!item || item.cart.organizationId !== ctx.organizationId) {
      throw new Error('NOT_FOUND');
    }
    if (item.cart.userId !== ctx.userId) throw new Error('FORBIDDEN');

    if (quantity === 0) {
      await tx.cartItem.delete({ where: { id: itemId } });
    } else {
      await tx.cartItem.update({
        where: { id: itemId },
        data: {
          quantity,
          subtotalMinor: quantity * item.unitPriceMinor,
        },
      });
    }

    return recalculateCart(tx, item.cartId);
  });

  return mapCartView(updated);
}

export async function applyCartDiscount(
  ctx: PosContext,
  input: { discountType: DiscountType; discountValue: number }
) {
  const cart = await getOrCreateActiveCart(ctx);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.cart.update({
      where: { id: cart.id },
      data: {
        discountType: input.discountType,
        discountValue:
          input.discountType === 'PERCENT'
            ? Math.min(input.discountValue, 10000)
            : input.discountValue,
      },
    });
    return recalculateCart(tx, cart.id);
  });

  return mapCartView(updated);
}

export async function setCartTaxRate(ctx: PosContext, taxRateBps: number) {
  const cart = await getOrCreateActiveCart(ctx);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.cart.update({
      where: { id: cart.id },
      data: { taxRateBps: Math.max(0, taxRateBps) },
    });
    return recalculateCart(tx, cart.id);
  });

  return mapCartView(updated);
}

export type CheckoutPayment = {
  method: PaymentMethod;
  amountMinor: number;
  amountReceived?: number;
  reference?: string;
};

export async function checkout(
  ctx: PosContext,
  input: {
    cartId: string;
    payments: CheckoutPayment[];
    customerId?: string;
    customerName?: string;
    notes?: string;
    idempotencyKey?: string;
  }
) {
  if (input.idempotencyKey) {
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { payments: true, items: true },
    });
    if (existing) return existing;
  }

  const result = await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findFirst({
      where: {
        id: input.cartId,
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        status: 'ACTIVE',
      },
      include: { items: true, posSession: true, customer: true },
    });
    if (!cart) throw new Error('NOT_FOUND');
    if (!cart.items.length) throw new Error('VALIDATION_ERROR');

    const customerId = input.customerId ?? cart.customerId ?? undefined;
    const customerRecord = customerId
      ? await tx.customer.findFirst({ where: { id: customerId, organizationId: ctx.organizationId } })
      : null;

    const loc = await ensureDefaultStockLocation(
      ctx.organizationId,
      ctx.storeId,
      ctx.branchId,
      'Branch',
      tx
    );

    for (const item of cart.items) {
      const variant = await tx.productVariant.findFirst({
        where: { id: item.variantId, organizationId: ctx.organizationId },
        include: { stockLevels: { where: { stockLocationId: loc.id } } },
      });
      if (!variant) throw new Error('NOT_FOUND');
      // Server-side price authority — never trust stale cart prices
      if (item.unitPriceMinor !== variant.sellingPrice) {
        await tx.cartItem.update({
          where: { id: item.id },
          data: { unitPriceMinor: variant.sellingPrice },
        });
        item.unitPriceMinor = variant.sellingPrice;
      }
      if (variant.trackInventory) {
        const level = variant.stockLevels[0];
        const available = level
          ? computeAvailable(level.quantityOnHand, level.quantityReserved)
          : 0;
        if (available < item.quantity) throw new Error('INSUFFICIENT_STOCK');
      }
    }

    const lineInputs = cart.items.map((i) => ({
      unitPriceMinor: i.unitPriceMinor,
      quantity: i.quantity,
      discountAmount: i.discountAmount,
    }));

    const totals = calculateOrderTotals({
      lines: lineInputs,
      discountAmount: cart.discountAmount,
      taxRateBps: cart.taxRateBps,
    });

    const totalPayments = input.payments.reduce((s, p) => s + p.amountMinor, 0);
    if (totalPayments < totals.totalMinor) throw new Error('VALIDATION_ERROR');

    const orderNumber = await generateOrderNumber(ctx.organizationId, tx);
    const now = new Date();

    const order = await tx.order.create({
      data: {
        organizationId: ctx.organizationId,
        storeId: ctx.storeId,
        branchId: ctx.branchId,
        registerId: cart.registerId,
        posSessionId: cart.posSessionId,
        cartId: cart.id,
        userId: ctx.userId,
        customerId: customerRecord?.id,
        customerName: customerRecord?.name ?? input.customerName,
        orderNumber,
        source: 'POS',
        status: 'COMPLETED',
        paymentStatus: 'PENDING',
        fulfillmentStatus: 'FULFILLED',
        currency: cart.currency,
        subtotalMinor: totals.subtotalMinor,
        discountType: cart.discountType,
        discountValue: cart.discountValue,
        discountAmount: totals.discountAmount,
        taxRateBps: cart.taxRateBps,
        taxAmount: totals.taxAmount,
        totalMinor: totals.totalMinor,
        notes: input.notes,
        idempotencyKey: input.idempotencyKey,
        completedAt: now,
        items: {
          create: cart.items.map((i) => {
            const line = calculateOrderTotals({
              lines: [
                {
                  unitPriceMinor: i.unitPriceMinor,
                  quantity: i.quantity,
                  discountAmount: i.discountAmount,
                },
              ],
              taxRateBps: 0,
            });
            return {
              productId: i.productId,
              variantId: i.variantId,
              productName: i.productName,
              variantName: i.variantName,
              sku: i.sku,
              quantity: i.quantity,
              unitPriceMinor: i.unitPriceMinor,
              discountAmount: i.discountAmount,
              taxAmount: 0,
              subtotalMinor: line.subtotalMinor,
              totalMinor: line.totalMinor,
            };
          }),
        },
        adjustments: {
          create: [
            ...(totals.discountAmount > 0
              ? [
                  {
                    type: 'DISCOUNT' as const,
                    label: 'Cart discount',
                    amountMinor: -totals.discountAmount,
                  },
                ]
              : []),
            ...(totals.taxAmount > 0
              ? [
                  {
                    type: 'TAX' as const,
                    label: 'Tax',
                    amountMinor: totals.taxAmount,
                  },
                ]
              : []),
          ],
        },
      },
      include: { items: true },
    });

    for (const item of cart.items) {
      const variant = await tx.productVariant.findFirst({
        where: { id: item.variantId },
      });
      if (variant?.trackInventory) {
        await adjustStockInTx(tx, {
          organizationId: ctx.organizationId,
          userId: ctx.userId,
          variantId: item.variantId,
          stockLocationId: loc.id,
          quantityDelta: -item.quantity,
          type: 'SALE',
          reason: `POS sale ${orderNumber}`,
          referenceType: 'Order',
          referenceId: order.id,
        });
      }
    }

    let paidMinor = 0;
    for (let i = 0; i < input.payments.length; i++) {
      const p = input.payments[i];
      const changeMinor =
        p.method === 'CASH' && p.amountReceived
          ? Math.max(0, p.amountReceived - p.amountMinor)
          : undefined;

      const payment = await createPayment(
        {
          organizationId: ctx.organizationId,
          storeId: ctx.storeId,
          branchId: ctx.branchId,
          orderId: order.id,
          userId: ctx.userId,
          method: p.method,
          amountMinor: p.amountMinor,
          currency: cart.currency,
          amountReceived: p.amountReceived,
          changeMinor,
          reference: p.reference,
          idempotencyKey: input.idempotencyKey
            ? `${input.idempotencyKey}-pay-${i}`
            : undefined,
          status: 'PAID',
        },
        tx
      );
      paidMinor += payment.amountMinor;
    }

    const paymentStatus =
      paidMinor >= totals.totalMinor ? 'PAID' : 'PARTIALLY_PAID';

    const finalOrder = await tx.order.update({
      where: { id: order.id },
      data: { paidMinor, paymentStatus },
      include: { items: true, payments: true },
    });

    await tx.cart.update({
      where: { id: cart.id },
      data: { status: 'COMPLETED', completedAt: now },
    });

    if (cart.posSessionId) {
      const cashTotal = input.payments
        .filter((p) => p.method === 'CASH')
        .reduce((s, p) => s + p.amountMinor, 0);
      const cardTotal = input.payments
        .filter((p) => p.method === 'CARD')
        .reduce((s, p) => s + p.amountMinor, 0);
      const otherTotal = input.payments
        .filter((p) => p.method === 'OTHER')
        .reduce((s, p) => s + p.amountMinor, 0);

      await tx.posSession.update({
        where: { id: cart.posSessionId },
        data: {
          cashSales: { increment: cashTotal },
          cardSales: { increment: cardTotal },
          otherSales: { increment: otherTotal },
          totalSales: { increment: totals.totalMinor },
          orderCount: { increment: 1 },
        },
      });
    }

    await recordOrderEvent(tx, {
      organizationId: ctx.organizationId,
      orderId: order.id,
      userId: ctx.userId,
      eventType: 'order.created',
      metadata: { source: 'POS', orderNumber },
    });

    await recordOrderEvent(tx, {
      organizationId: ctx.organizationId,
      orderId: order.id,
      userId: ctx.userId,
      eventType: 'order.completed',
      metadata: { totalMinor: totals.totalMinor },
    });

    await logAudit(
      {
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        action: 'ORDER_CREATED',
        entityType: 'Order',
        entityId: order.id,
        metadata: { orderNumber, totalMinor: totals.totalMinor, source: 'POS' },
      },
      tx
    );

    return finalOrder;
  });

  if (result.customerId) {
    const { recordOrderCustomerActivity } = await import('@/server/services/customer-service');
    await recordOrderCustomerActivity({
      organizationId: ctx.organizationId,
      customerId: result.customerId,
      orderId: result.id,
      orderNumber: result.orderNumber,
      eventType: 'ORDER_COMPLETED',
      userId: ctx.userId,
      storeId: ctx.storeId,
      branchId: ctx.branchId,
      source: 'POS',
      totalMinor: result.totalMinor,
      currency: result.currency,
    });
  }

  await emitOrderEvent({
    type: 'order.completed',
    organizationId: ctx.organizationId,
    orderId: result.id,
    userId: ctx.userId,
    payload: { orderNumber: result.orderNumber },
  });

  return result;
}

export async function openPosSession(
  ctx: PosContext,
  input: { openingCash?: number; notes?: string }
) {
  const register = await ensureDefaultRegister(
    ctx.organizationId,
    ctx.storeId,
    ctx.branchId
  );

  const existing = await prisma.posSession.findFirst({
    where: {
      organizationId: ctx.organizationId,
      registerId: register.id,
      userId: ctx.userId,
      status: 'OPEN',
    },
  });
  if (existing) return existing;

  return prisma.posSession.create({
    data: {
      organizationId: ctx.organizationId,
      storeId: ctx.storeId,
      branchId: ctx.branchId,
      registerId: register.id,
      userId: ctx.userId,
      openingCash: input.openingCash ?? 0,
      notes: input.notes,
      status: 'OPEN',
    },
    include: { register: true },
  });
}

export async function closePosSession(
  ctx: PosContext,
  sessionId: string,
  input: { closingCash: number; notes?: string }
) {
  const session = await prisma.posSession.findFirst({
    where: { id: sessionId, organizationId: ctx.organizationId, status: 'OPEN' },
  });
  if (!session) throw new Error('NOT_FOUND');

  const expectedCash = session.openingCash + session.cashSales;
  const cashDifference = input.closingCash - expectedCash;

  return prisma.posSession.update({
    where: { id: sessionId },
    data: {
      status: 'CLOSED',
      closingCash: input.closingCash,
      expectedCash,
      cashDifference,
      closedAt: new Date(),
      notes: input.notes ?? session.notes,
    },
  });
}

export async function getOpenSession(ctx: PosContext) {
  const register = await ensureDefaultRegister(
    ctx.organizationId,
    ctx.storeId,
    ctx.branchId
  );
  return prisma.posSession.findFirst({
    where: {
      organizationId: ctx.organizationId,
      registerId: register.id,
      userId: ctx.userId,
      status: 'OPEN',
    },
    include: { register: true },
  });
}

export async function holdCart(ctx: PosContext, cartId: string, label?: string) {
  const cart = await prisma.cart.findFirst({
    where: { id: cartId, organizationId: ctx.organizationId, userId: ctx.userId, status: 'ACTIVE' },
    include: { items: true },
  });
  if (!cart?.items.length) throw new Error('VALIDATION_ERROR');

  await prisma.cart.update({
    where: { id: cartId },
    data: { status: 'HELD', heldAt: new Date(), heldLabel: label || 'Held cart' },
  });

  return getOrCreateActiveCart(ctx);
}

export async function listHeldCarts(ctx: PosContext) {
  return prisma.cart.findMany({
    where: { organizationId: ctx.organizationId, userId: ctx.userId, status: 'HELD' },
    include: { items: true },
    orderBy: { heldAt: 'desc' },
  });
}

export async function resumeHeldCart(ctx: PosContext, cartId: string) {
  const active = await prisma.cart.findFirst({
    where: { organizationId: ctx.organizationId, userId: ctx.userId, status: 'ACTIVE' },
  });
  if (active) {
    await prisma.cart.update({ where: { id: active.id }, data: { status: 'CANCELLED' } });
  }

  const held = await prisma.cart.findFirst({
    where: { id: cartId, organizationId: ctx.organizationId, status: 'HELD' },
  });
  if (!held) throw new Error('NOT_FOUND');

  await prisma.cart.update({
    where: { id: cartId },
    data: { status: 'ACTIVE', heldAt: null, heldLabel: null },
  });

  return getOrCreateActiveCart(ctx);
}

export async function voidPosOrder(ctx: PosContext, orderId: string, reason: string) {
  const loc = await ensureDefaultStockLocation(
    ctx.organizationId,
    ctx.storeId,
    ctx.branchId,
    'Branch'
  );

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: orderId,
        organizationId: ctx.organizationId,
        status: 'COMPLETED',
        source: 'POS',
      },
      include: { items: true, payments: true, posSession: true },
    });
    if (!order) throw new Error('NOT_FOUND');

    for (const item of order.items) {
      const variant = await tx.productVariant.findFirst({ where: { id: item.variantId } });
      if (variant?.trackInventory) {
        await adjustStockInTx(tx, {
          organizationId: ctx.organizationId,
          userId: ctx.userId,
          variantId: item.variantId,
          stockLocationId: loc.id,
          quantityDelta: item.quantity,
          type: 'RETURN',
          referenceType: 'Order',
          referenceId: order.id,
          reason: `Void ${order.orderNumber}: ${reason}`,
        });
      }
    }

    if (order.posSessionId) {
      const cashTotal = order.payments
        .filter((p) => p.method === 'CASH')
        .reduce((s, p) => s + p.amountMinor, 0);
      await tx.posSession.update({
        where: { id: order.posSessionId },
        data: {
          cashSales: { decrement: cashTotal },
          totalSales: { decrement: order.totalMinor },
          orderCount: { decrement: 1 },
        },
      });
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        fulfillmentStatus: 'CANCELLED',
        paymentStatus: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledById: ctx.userId,
        cancelReason: reason,
      },
    });

    await recordOrderEvent(tx, {
      organizationId: ctx.organizationId,
      orderId,
      userId: ctx.userId,
      eventType: 'order.voided',
      metadata: { reason },
    });

    return updated;
  });

  await emitOrderEvent({
    type: 'order.cancelled',
    organizationId: ctx.organizationId,
    orderId,
    userId: ctx.userId,
  });

  return result;
}
