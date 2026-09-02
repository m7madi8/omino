import { prisma } from '@/lib/db';
import { computeAvailable, isLowStock } from '@/server/services/inventory-service';
import type { AnalyticsFilters, InventoryAlert, InventoryMetricsSummary } from '@/types/analytics';

export async function getInventoryMetricsSummary(
  filters: AnalyticsFilters,
  range: { from: Date; to: Date }
): Promise<InventoryMetricsSummary> {
  const levels = await prisma.stockLevel.findMany({
    where: {
      organizationId: filters.organizationId,
      ...(filters.storeId && {
        stockLocation: {
          storeId: filters.storeId,
          ...(filters.branchId && { branchId: filters.branchId }),
        },
      }),
      variant: { deletedAt: null, product: { deletedAt: null, status: 'ACTIVE' } },
    },
    include: {
      variant: {
        include: { product: { select: { name: true, trackInventory: true } } },
      },
      stockLocation: true,
    },
    take: 500,
  });

  const alerts: InventoryAlert[] = [];
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const l of levels) {
    if (!l.variant.product.trackInventory) continue;
    const available = computeAvailable(l.quantityOnHand, l.quantityReserved);
    const threshold = l.lowStockThreshold ?? l.variant.lowStockThreshold;
    if (available <= 0) {
      outOfStockCount += 1;
      alerts.push({
        variantId: l.variantId,
        productName: l.variant.product.name,
        variantName: l.variant.name,
        sku: l.variant.sku,
        available,
        threshold,
        status: 'OUT_OF_STOCK',
      });
    } else if (isLowStock(available, threshold)) {
      lowStockCount += 1;
      alerts.push({
        variantId: l.variantId,
        productName: l.variant.product.name,
        variantName: l.variant.name,
        sku: l.variant.sku,
        available,
        threshold,
        status: 'LOW_STOCK',
      });
    }
  }

  alerts.sort((a, b) => a.available - b.available);

  const movementCount = await prisma.stockMovement.count({
    where: {
      organizationId: filters.organizationId,
      createdAt: { gte: range.from, lte: range.to },
      ...(filters.storeId && {
        stockLocation: {
          storeId: filters.storeId,
          ...(filters.branchId && { branchId: filters.branchId }),
        },
      }),
    },
  });

  return {
    lowStockCount,
    outOfStockCount,
    movementCount,
    alerts: alerts.slice(0, 10),
  };
}
