import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { CustomerSource, CustomerStatus } from '@/types/prisma-enums';
import { normalizeEmail, normalizePhone } from '@/lib/customer-utils';
import type { CustomerListItem } from '@/types/customer';

export async function searchCustomers(params: {
  organizationId: string;
  search?: string;
  status?: CustomerStatus;
  source?: CustomerSource;
  tagId?: string;
  sortBy?: 'name' | 'createdAt' | 'lastOrder';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}) {
  const page = params.page ?? 1;
  const pageSize = Math.min(params.pageSize ?? 25, 100);
  const skip = (page - 1) * pageSize;
  const sortDir = params.sortDir ?? 'desc';

  const where: Prisma.CustomerWhereInput = {
    organizationId: params.organizationId,
    deletedAt: null,
    isWalkIn: false,
    ...(params.status && { status: params.status }),
    ...(params.source && { source: params.source }),
    ...(params.tagId && {
      tagLinks: { some: { tagId: params.tagId } },
    }),
  };

  if (params.search) {
    const q = params.search.trim();
    const emailNorm = normalizeEmail(q);
    const phoneNorm = normalizePhone(q);
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { firstName: { contains: q, mode: 'insensitive' } },
      { lastName: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
      ...(emailNorm ? [{ emailNormalized: emailNorm }] : []),
      ...(phoneNorm ? [{ phoneNormalized: { contains: phoneNorm } }] : []),
    ];
  }

  const orderBy: Prisma.CustomerOrderByWithRelationInput =
    params.sortBy === 'name'
      ? { name: sortDir }
      : { createdAt: sortDir };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        tagLinks: { include: { tag: true } },
        orders: {
          where: { status: { not: 'CANCELLED' } },
          select: { totalMinor: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  const items: CustomerListItem[] = customers.map((c) => {
    const orderCount = c.orders.length;
    const totalSpentMinor = c.orders.reduce((s, o) => s + o.totalMinor, 0);
    const lastOrderAt = c.orders[0]?.createdAt.toISOString() ?? null;
    return {
      id: c.id,
      displayName: c.name,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      status: c.status as CustomerStatus,
      source: c.source as CustomerSource,
      orderCount,
      totalSpentMinor,
      lastOrderAt,
      tags: c.tagLinks.map((t) => ({ id: t.tag.id, name: t.tag.name, slug: t.tag.slug })),
      createdAt: c.createdAt.toISOString(),
    };
  });

  return { items, total, page, pageSize };
}

export async function quickSearchCustomers(organizationId: string, query: string, limit = 10) {
  const result = await searchCustomers({
    organizationId,
    search: query,
    pageSize: limit,
    sortBy: 'name',
    sortDir: 'asc',
  });
  return result.items;
}
