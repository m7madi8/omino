import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { StockMovementType } from '@/types/prisma-enums';
import { emitCatalogEvent } from '@/server/events/catalog-events';

type Tx = Prisma.TransactionClient;

export function computeAvailable(onHand: number, reserved: number): number {
  return Math.max(0, onHand - reserved);
}

export function isLowStock(
  available: number,
  threshold: number | null | undefined
): boolean {
  if (threshold == null) return false;
  return available <= threshold;
}

export async function ensureDefaultStockLocation(
  organizationId: string,
  storeId: string,
  branchId: string,
  branchName: string,
  tx: Tx = prisma
) {
  const existing = await tx.stockLocation.findFirst({
    where: { organizationId, branchId, isDefault: true },
  });
  if (existing) return existing;

  const slug = `loc-${branchId.slice(0, 8)}`;
  return tx.stockLocation.create({
    data: {
      organizationId,
      storeId,
      branchId,
      name: branchName,
      slug,
      type: 'BRANCH',
      isDefault: true,
    },
  });
}

export async function listStockLocations(organizationId: string) {
  return prisma.stockLocation.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    include: {
      store: { select: { name: true } },
      branch: { select: { name: true } },
    },
  });
}

export async function getStockLocationOrThrow(
  organizationId: string,
  stockLocationId: string
) {
  const loc = await prisma.stockLocation.findFirst({
    where: { id: stockLocationId, organizationId, deletedAt: null },
  });
  if (!loc) throw new Error('NOT_FOUND');
  return loc;
}

type AdjustStockInput = {
  organizationId: string;
  userId: string;
  variantId: string;
  stockLocationId: string;
  quantityDelta: number;
  type: StockMovementType;
  reason?: string;
  referenceType?: string;
  referenceId?: string;
  allowNegative?: boolean;
};

export async function adjustStockInTx(tx: Tx, input: AdjustStockInput) {
  if (input.quantityDelta === 0) {
    throw new Error('VALIDATION_ERROR');
  }

  const variant = await tx.productVariant.findFirst({
    where: { id: input.variantId, organizationId: input.organizationId, deletedAt: null },
  });
  if (!variant) throw new Error('NOT_FOUND');
  if (!variant.trackInventory) throw new Error('VALIDATION_ERROR');

  const location = await tx.stockLocation.findFirst({
    where: { id: input.stockLocationId, organizationId: input.organizationId, deletedAt: null },
  });
  if (!location) throw new Error('NOT_FOUND');

  const level = await tx.stockLevel.upsert({
    where: {
      variantId_stockLocationId: {
        variantId: input.variantId,
        stockLocationId: input.stockLocationId,
      },
    },
    create: {
      organizationId: input.organizationId,
      variantId: input.variantId,
      stockLocationId: input.stockLocationId,
      quantityOnHand: 0,
      quantityReserved: 0,
      quantityIncoming: 0,
      lowStockThreshold: variant.lowStockThreshold,
      reorderPoint: variant.reorderPoint,
    },
    update: {},
  });

  const newOnHand = level.quantityOnHand + input.quantityDelta;
  if (newOnHand < 0 && !input.allowNegative) {
    throw new Error('INSUFFICIENT_STOCK');
  }

  const updated = await tx.stockLevel.update({
    where: { id: level.id },
    data: { quantityOnHand: newOnHand },
  });

  const movement = await tx.stockMovement.create({
    data: {
      organizationId: input.organizationId,
      variantId: input.variantId,
      stockLocationId: input.stockLocationId,
      userId: input.userId,
      type: input.type,
      quantity: input.quantityDelta,
      balanceAfter: newOnHand,
      reason: input.reason,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
    },
  });

  return { level: updated, movement, variant };
}

export async function adjustStock(input: AdjustStockInput) {
  const result = await prisma.$transaction((tx) => adjustStockInTx(tx, input));

  const available = computeAvailable(result.level.quantityOnHand, result.level.quantityReserved);
  const threshold = result.level.lowStockThreshold ?? result.variant.lowStockThreshold;
  const eventSource = input.referenceType === 'automation' ? 'automation' : undefined;
  if (isLowStock(available, threshold)) {
    await emitCatalogEvent({
      type: 'inventory.low_stock',
      organizationId: input.organizationId,
      userId: input.userId,
      source: eventSource,
      payload: {
        variantId: input.variantId,
        stockLocationId: input.stockLocationId,
        available,
        threshold,
      },
    });
  }

  await emitCatalogEvent({
    type: 'inventory.adjusted',
    organizationId: input.organizationId,
    userId: input.userId,
    source: eventSource,
    payload: {
      movementId: result.movement.id,
      variantId: input.variantId,
      stockLocationId: input.stockLocationId,
      quantityDelta: input.quantityDelta,
      balanceAfter: result.level.quantityOnHand,
      type: input.type,
    },
  });

  return result;
}

export async function setInitialStock(
  organizationId: string,
  userId: string,
  variantId: string,
  stockLocationId: string,
  quantity: number,
  lowStockThreshold?: number
) {
  if (quantity <= 0) return null;

  await prisma.stockLevel.upsert({
    where: {
      variantId_stockLocationId: { variantId, stockLocationId },
    },
    create: {
      organizationId,
      variantId,
      stockLocationId,
      quantityOnHand: 0,
      lowStockThreshold,
    },
    update: {
      ...(lowStockThreshold != null && { lowStockThreshold }),
    },
  });

  return adjustStock({
    organizationId,
    userId,
    variantId,
    stockLocationId,
    quantityDelta: quantity,
    type: 'INITIAL',
    reason: 'Initial stock on product creation',
  });
}

export async function listInventory(params: {
  organizationId: string;
  stockLocationId?: string;
  lowStockOnly?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = params.page ?? 1;
  const pageSize = Math.min(params.pageSize ?? 25, 100);
  const skip = (page - 1) * pageSize;

  const where: Prisma.StockLevelWhereInput = {
    organizationId: params.organizationId,
    variant: { deletedAt: null, product: { deletedAt: null } },
    ...(params.stockLocationId && { stockLocationId: params.stockLocationId }),
  };

  if (params.search) {
    where.variant = {
      deletedAt: null,
      product: { deletedAt: null },
      OR: [
        { sku: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
        { product: { name: { contains: params.search, mode: 'insensitive' } } },
      ],
    };
  }

  const levels = await prisma.stockLevel.findMany({
    where,
    include: {
      variant: {
        include: {
          product: { select: { id: true, name: true } },
        },
      },
      stockLocation: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    skip,
    take: pageSize,
  });

  const items = levels
    .map((l) => {
      const available = computeAvailable(l.quantityOnHand, l.quantityReserved);
      const threshold = l.lowStockThreshold ?? l.variant.lowStockThreshold;
      const low = isLowStock(available, threshold);
      return {
        variantId: l.variantId,
        productId: l.variant.product.id,
        productName: l.variant.product.name,
        variantName: l.variant.name,
        sku: l.variant.sku,
        stockLocationId: l.stockLocationId,
        stockLocationName: l.stockLocation.name,
        quantityOnHand: l.quantityOnHand,
        quantityReserved: l.quantityReserved,
        quantityAvailable: available,
        quantityIncoming: l.quantityIncoming,
        lowStockThreshold: threshold,
        isLowStock: low,
      };
    })
    .filter((item) => !params.lowStockOnly || item.isLowStock);

  const total = await prisma.stockLevel.count({ where });

  return { items, total, page, pageSize };
}

export async function getVariantInventoryDetail(
  organizationId: string,
  variantId: string
) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, organizationId, deletedAt: null },
    include: {
      product: {
        include: {
          images: { orderBy: { position: 'asc' }, take: 1 },
          category: { select: { name: true } },
        },
      },
      optionValues: {
        include: { optionValue: { include: { option: true } } },
      },
      stockLevels: {
        include: { stockLocation: true },
      },
      stockMovements: {
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          stockLocation: { select: { name: true } },
          user: { select: { fullName: true, email: true } },
        },
      },
    },
  });

  if (!variant) throw new Error('NOT_FOUND');
  return variant;
}

export async function createStockTransfer(input: {
  organizationId: string;
  userId: string;
  fromLocationId: string;
  toLocationId: string;
  notes?: string;
  items: { variantId: string; quantity: number }[];
}) {
  if (input.fromLocationId === input.toLocationId) {
    throw new Error('VALIDATION_ERROR');
  }
  if (!input.items.length) throw new Error('VALIDATION_ERROR');

  const transfer = await prisma.$transaction(async (tx) => {
    await getStockLocationOrThrow(input.organizationId, input.fromLocationId);
    await getStockLocationOrThrow(input.organizationId, input.toLocationId);

    const created = await tx.stockTransfer.create({
      data: {
        organizationId: input.organizationId,
        fromLocationId: input.fromLocationId,
        toLocationId: input.toLocationId,
        status: 'PENDING',
        notes: input.notes,
        createdById: input.userId,
        items: {
          create: input.items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        },
      },
      include: { items: true },
    });

    for (const item of input.items) {
      await adjustStockInTx(tx, {
        organizationId: input.organizationId,
        userId: input.userId,
        variantId: item.variantId,
        stockLocationId: input.fromLocationId,
        quantityDelta: -item.quantity,
        type: 'TRANSFER_OUT',
        reason: `Transfer ${created.id}`,
        referenceType: 'StockTransfer',
        referenceId: created.id,
      });
    }

    return created;
  });

  await emitCatalogEvent({
    type: 'inventory.transferred',
    organizationId: input.organizationId,
    userId: input.userId,
    payload: { transferId: transfer.id, status: 'PENDING' },
  });

  return transfer;
}

export async function completeStockTransfer(
  organizationId: string,
  userId: string,
  transferId: string
) {
  const completed = await prisma.$transaction(async (tx) => {
    const transfer = await tx.stockTransfer.findFirst({
      where: { id: transferId, organizationId },
      include: { items: true },
    });
    if (!transfer || transfer.status === 'COMPLETED') throw new Error('NOT_FOUND');

    for (const item of transfer.items) {
      await adjustStockInTx(tx, {
        organizationId,
        userId,
        variantId: item.variantId,
        stockLocationId: transfer.toLocationId,
        quantityDelta: item.quantity,
        type: 'TRANSFER_IN',
        reason: `Transfer ${transfer.id}`,
        referenceType: 'StockTransfer',
        referenceId: transfer.id,
      });

      await tx.stockTransferItem.update({
        where: { id: item.id },
        data: { quantityReceived: item.quantity },
      });
    }

    return tx.stockTransfer.update({
      where: { id: transferId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  });

  await emitCatalogEvent({
    type: 'inventory.transferred',
    organizationId,
    userId,
    payload: { transferId, status: 'COMPLETED' },
  });

  return completed;
}
