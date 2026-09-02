import { prisma } from '@/lib/db';
import { getCodPendingSummary } from '@/server/services/analytics/today-dashboard-service';
import { getInventoryMetricsSummary } from '@/server/services/analytics/inventory-analytics-service';
import { resolveDateRange } from '@/lib/analytics/date-range';
import type { AnalyticsFilters } from '@/types/analytics';

export type BusinessInsight = {
  id: string;
  kind: 'LOW_STOCK' | 'COD_PENDING' | 'INACTIVE_CUSTOMER';
  title: string;
  description: string;
  href: string;
  priority: number;
};

export async function getBusinessInsights(input: {
  organizationId: string;
  storeId?: string;
  locale: 'ar' | 'en';
}): Promise<BusinessInsight[]> {
  const range = resolveDateRange('last_30_days');
  const insights: BusinessInsight[] = [];

  const filters: AnalyticsFilters = {
    organizationId: input.organizationId,
    storeId: input.storeId,
    from: range.from,
    to: range.to,
  };

  const [inventory, cod] = await Promise.all([
    getInventoryMetricsSummary(filters, range),
    getCodPendingSummary(input.organizationId, input.storeId),
  ]);

  const isAr = input.locale === 'ar';

  if (inventory.lowStockCount + inventory.outOfStockCount > 0) {
    const top = inventory.alerts[0];
    insights.push({
      id: 'low-stock',
      kind: 'LOW_STOCK',
      title: isAr ? 'مخزون منخفض' : 'Low stock',
      description: top
        ? isAr
          ? `${top.productName} — بقي ${top.available}`
          : `${top.productName} — ${top.available} left`
        : isAr
          ? `${inventory.lowStockCount} منتجات ستنفد قريبًا`
          : `${inventory.lowStockCount} products running low`,
      href: top ? `/app/products` : '/app/inventory',
      priority: 1,
    });
  }

  if (cod.count > 0) {
    insights.push({
      id: 'cod-pending',
      kind: 'COD_PENDING',
      title: isAr ? 'COD غير محصّل' : 'Uncollected COD',
      description: isAr
        ? `${cod.count} طلبات لم يتم تحصيلها`
        : `${cod.count} orders awaiting collection`,
      href: '/app/orders?cod=pending',
      priority: 2,
    });
  }

  const inactiveSince = new Date();
  inactiveSince.setDate(inactiveSince.getDate() - 45);

  const inactiveCustomer = await prisma.customer.findFirst({
    where: {
      organizationId: input.organizationId,
      deletedAt: null,
      isWalkIn: false,
      orders: {
        some: { status: 'COMPLETED' },
        none: { createdAt: { gte: inactiveSince }, status: { not: 'CANCELLED' } },
      },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true },
  });

  if (inactiveCustomer) {
    const name = inactiveCustomer.name;
    insights.push({
      id: `customer-${inactiveCustomer.id}`,
      kind: 'INACTIVE_CUSTOMER',
      title: isAr ? 'زبون مهم' : 'Important customer',
      description: isAr ? `${name} لم يشترِ منذ فترة` : `${name} has not ordered recently`,
      href: `/app/customers/${inactiveCustomer.id}`,
      priority: 3,
    });
  }

  return insights.sort((a, b) => a.priority - b.priority).slice(0, 3);
}
