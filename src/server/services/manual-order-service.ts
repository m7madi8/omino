import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import {
  calculateLineTotals,
  calculateOrderTotals,
  generateOrderNumber,
  recordOrderEvent,
} from '@/server/services/order-service';
import { findOrCreateCustomerFromCheckout } from '@/server/services/customer-service';
import {
  adjustStockInTx,
  computeAvailable,
  ensureDefaultStockLocation,
} from '@/server/services/inventory-service';
import { createPayment } from '@/server/services/payment-service';
import type { PaymentMethod } from '@/types/prisma-enums';
import { emitOrderEvent } from '@/server/events/order-events';

export async function createManualOrder(input: {
  organizationId: string;
  storeId: string;
  branchId: string;
  userId: string;
  currency: string;
  taxRateBps?: number;
  customerName: string;
  phone: string;
  variantId: string;
  quantity: number;
  address?: string;
  city?: string;
  country?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}) {
  const accessToken = randomUUID();

  const result = await prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findFirst({
      where: { id: input.variantId, organizationId: input.organizationId, deletedAt: null },
      include: { product: true, stockLevels: true },
    });
    if (!variant || variant.product.deletedAt) throw new Error('NOT_FOUND');

    const loc = await ensureDefaultStockLocation(
      input.organizationId,
      input.storeId,
      input.branchId,
      'Branch',
      tx
    );

    if (variant.product.trackInventory) {
      const level = variant.stockLevels.find((l) => l.stockLocationId === loc.id);
      const available = level
        ? computeAvailable(level.quantityOnHand, level.quantityReserved)
        : 0;
      if (available < input.quantity) throw new Error('INSUFFICIENT_STOCK');
    }

    const customer = await findOrCreateCustomerFromCheckout(input.organizationId, {
      name: input.customerName,
      phone: input.phone,
      source: 'MANUAL',
      userId: input.userId,
    });

    const line = calculateLineTotals({
      unitPriceMinor: variant.sellingPrice,
      quantity: input.quantity,
    });

    const totals = calculateOrderTotals({
      lines: [{ unitPriceMinor: variant.sellingPrice, quantity: input.quantity }],
      taxRateBps: input.taxRateBps ?? 0,
    });

    const orderNumber = await generateOrderNumber(input.organizationId, tx);

    const shippingAddress = input.address
      ? {
          fullName: input.customerName,
          address: input.address,
          city: input.city || '',
          country: input.country || 'PS',
        }
      : undefined;

    const order = await tx.order.create({
      data: {
        organizationId: input.organizationId,
        storeId: input.storeId,
        branchId: input.branchId,
        userId: input.userId,
        customerId: customer.id,
        orderNumber,
        source: 'MANUAL',
        status: 'PENDING',
        paymentStatus: input.paymentMethod === 'COD' ? 'PENDING' : 'PAID',
        fulfillmentStatus: 'UNFULFILLED',
        currency: input.currency,
        subtotalMinor: totals.subtotalMinor,
        taxRateBps: input.taxRateBps ?? 0,
        taxAmount: totals.taxAmount,
        totalMinor: totals.totalMinor,
        paidMinor: input.paymentMethod === 'COD' ? 0 : totals.totalMinor,
        customerName: input.customerName,
        guestPhone: input.phone,
        shippingAddress,
        accessToken,
        notes: input.notes,
        items: {
          create: [
            {
              productId: variant.productId,
              variantId: variant.id,
              productName: variant.product.name,
              variantName: variant.name,
              sku: variant.sku,
              quantity: input.quantity,
              unitPriceMinor: variant.sellingPrice,
              subtotalMinor: line.subtotalMinor,
              totalMinor: line.totalMinor,
            },
          ],
        },
      },
      include: { items: true },
    });

    if (variant.product.trackInventory) {
      await adjustStockInTx(tx, {
        organizationId: input.organizationId,
        userId: input.userId,
        variantId: variant.id,
        stockLocationId: loc.id,
        quantityDelta: -input.quantity,
        type: 'SALE',
        reason: `Manual order ${orderNumber}`,
        referenceType: 'Order',
        referenceId: order.id,
      });
    }

    if (input.paymentMethod === 'COD') {
      await createPayment(
        {
          organizationId: input.organizationId,
          storeId: input.storeId,
          branchId: input.branchId,
          orderId: order.id,
          userId: input.userId,
          method: 'COD',
          amountMinor: totals.totalMinor,
          currency: input.currency,
          status: 'PENDING',
          reference: 'Cash on delivery',
        },
        tx
      );
      await tx.order.update({ where: { id: order.id }, data: { paidMinor: 0 } });
    } else {
      await createPayment(
        {
          organizationId: input.organizationId,
          storeId: input.storeId,
          branchId: input.branchId,
          orderId: order.id,
          userId: input.userId,
          method: input.paymentMethod,
          amountMinor: totals.totalMinor,
          currency: input.currency,
          status: 'PAID',
        },
        tx
      );
    }

    await recordOrderEvent(tx, {
      organizationId: input.organizationId,
      orderId: order.id,
      userId: input.userId,
      eventType: 'order.created',
      metadata: { source: 'MANUAL' },
    });

    return order;
  });

  await emitOrderEvent({
    type: 'order.created',
    organizationId: input.organizationId,
    orderId: result.id,
    userId: input.userId,
  });

  return result;
}
