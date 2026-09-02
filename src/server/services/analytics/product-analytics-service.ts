import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import type { AnalyticsFilters, TopProductRow } from '@/types/analytics';

export async function getTopProducts(
  filters: AnalyticsFilters,
  range: { from: Date; to: Date },
  limit = 10
): Promise<TopProductRow[]> {
  const storeFilter = filters.storeId ? Prisma.sql`AND o.store_id = ${filters.storeId}::uuid` : Prisma.empty;
  const branchFilter = filters.branchId ? Prisma.sql`AND o.branch_id = ${filters.branchId}::uuid` : Prisma.empty;
  const channelFilter = filters.channel ? Prisma.sql`AND o.source = ${filters.channel}::"OrderSource"` : Prisma.empty;

  const rows = await prisma.$queryRaw<
    {
      product_id: string;
      variant_id: string;
      product_name: string;
      variant_name: string | null;
      sku: string;
      units_sold: bigint;
      revenue_minor: bigint;
      order_count: bigint;
    }[]
  >`
    SELECT oi.product_id,
           oi.variant_id,
           oi.product_name,
           oi.variant_name,
           oi.sku,
           SUM(oi.quantity)::bigint AS units_sold,
           SUM(oi.total_minor)::bigint AS revenue_minor,
           COUNT(DISTINCT oi.order_id)::bigint AS order_count
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    WHERE o.organization_id = ${filters.organizationId}::uuid
      AND o.status = 'COMPLETED'
      AND COALESCE(o.completed_at, o.created_at) >= ${range.from}
      AND COALESCE(o.completed_at, o.created_at) <= ${range.to}
      ${storeFilter}
      ${branchFilter}
      ${channelFilter}
    GROUP BY oi.product_id, oi.variant_id, oi.product_name, oi.variant_name, oi.sku
    ORDER BY revenue_minor DESC
    LIMIT ${limit}
  `;

  return rows.map((r) => ({
    productId: r.product_id,
    variantId: r.variant_id,
    productName: r.product_name,
    variantName: r.variant_name,
    sku: r.sku,
    unitsSold: Number(r.units_sold),
    revenueMinor: Number(r.revenue_minor),
    orderCount: Number(r.order_count),
  }));
}
