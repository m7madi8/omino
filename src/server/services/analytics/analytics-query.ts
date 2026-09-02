import { Prisma } from '@prisma/client';
import type { AnalyticsFilters } from '@/types/analytics';

/** Orders counted on completedAt when present, otherwise createdAt. */
export function orderDateFieldSql() {
  return Prisma.sql`COALESCE(o.completed_at, o.created_at)`;
}

export function buildOrderWhere(
  filters: AnalyticsFilters,
  range?: { from: Date; to: Date }
): Prisma.OrderWhereInput {
  return {
    organizationId: filters.organizationId,
    ...(filters.storeId && { storeId: filters.storeId }),
    ...(filters.branchId && { branchId: filters.branchId }),
    ...(filters.channel && { source: filters.channel }),
    ...(range && {
      OR: [
        { completedAt: { gte: range.from, lte: range.to } },
        {
          completedAt: null,
          createdAt: { gte: range.from, lte: range.to },
        },
      ],
    }),
  };
}

export function buildCompletedOrderWhere(
  filters: AnalyticsFilters,
  range: { from: Date; to: Date }
): Prisma.OrderWhereInput {
  return {
    organizationId: filters.organizationId,
    ...(filters.storeId && { storeId: filters.storeId }),
    ...(filters.branchId && { branchId: filters.branchId }),
    ...(filters.channel && { source: filters.channel }),
    status: 'COMPLETED',
    OR: [
      { completedAt: { gte: range.from, lte: range.to } },
      { completedAt: null, createdAt: { gte: range.from, lte: range.to } },
    ],
  };
}
