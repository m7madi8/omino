import { prisma } from '@/lib/db';
import type { CustomerMetrics } from '@/types/customer';

export async function getCustomerMetrics(
  organizationId: string,
  customerId: string
): Promise<CustomerMetrics> {
  const orders = await prisma.order.findMany({
    where: { organizationId, customerId },
    select: {
      status: true,
      paymentStatus: true,
      totalMinor: true,
      refundedMinor: true,
      paidMinor: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
  const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED');
  const refundedOrders = orders.filter(
    (o) => o.refundedMinor > 0 || ['REFUNDED', 'PARTIALLY_REFUNDED'].includes(o.paymentStatus)
  );

  const totalRevenueMinor = completedOrders.reduce((s, o) => s + o.totalMinor, 0);
  const refundedMinor = orders.reduce((s, o) => s + o.refundedMinor, 0);
  const netRevenueMinor = completedOrders.reduce(
    (s, o) => s + o.paidMinor - o.refundedMinor,
    0
  );
  const averageOrderValueMinor =
    completedOrders.length > 0
      ? Math.round(totalRevenueMinor / completedOrders.length)
      : 0;

  return {
    totalOrders: orders.length,
    completedOrders: completedOrders.length,
    cancelledOrders: cancelledOrders.length,
    refundedOrders: refundedOrders.length,
    totalRevenueMinor,
    refundedMinor,
    netRevenueMinor,
    averageOrderValueMinor,
    firstOrderAt: orders[0]?.createdAt.toISOString() ?? null,
    lastOrderAt: orders[orders.length - 1]?.createdAt.toISOString() ?? null,
  };
}

export async function getCustomerContext(organizationId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId, deletedAt: null },
    include: { tagLinks: { include: { tag: true } } },
  });
  if (!customer) throw new Error('NOT_FOUND');

  const metrics = await getCustomerMetrics(organizationId, customerId);

  const recentOrders = await prisma.order.findMany({
    where: { organizationId, customerId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      totalMinor: true,
      currency: true,
      source: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return {
    profile: {
      id: customer.id,
      displayName: customer.name,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      source: customer.source,
      tags: customer.tagLinks.map((t) => t.tag.name),
    },
    metrics,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      totalMinor: o.totalMinor,
      currency: o.currency,
      source: o.source,
      createdAt: o.createdAt.toISOString(),
    })),
    activitySummary: {
      lastOrderAt: metrics.lastOrderAt,
      orderCount: metrics.totalOrders,
      netRevenueMinor: metrics.netRevenueMinor,
    },
  };
}
