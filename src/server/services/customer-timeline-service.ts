import { prisma } from '@/lib/db';
import { getCustomerOrThrow, recordCustomerEvent } from '@/server/services/customer-service';
import { getCustomerMetrics } from '@/server/services/customer-metrics-service';
import { listCustomerAddresses } from '@/server/services/customer-address-service';
import type { CustomerDetail } from '@/types/customer';

export async function listCustomerNotes(
  organizationId: string,
  customerId: string,
  limit = 20
) {
  await getCustomerOrThrow(organizationId, customerId);
  return prisma.customerNote.findMany({
    where: { organizationId, customerId },
    include: { author: { select: { fullName: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function createCustomerNote(
  organizationId: string,
  customerId: string,
  authorId: string,
  content: string
) {
  await getCustomerOrThrow(organizationId, customerId);
  if (!content.trim()) throw new Error('VALIDATION_ERROR');

  return prisma.$transaction(async (tx) => {
    const note = await tx.customerNote.create({
      data: {
        organizationId,
        customerId,
        authorId,
        content: content.trim(),
      },
      include: { author: { select: { fullName: true, email: true } } },
    });

    await recordCustomerEvent(
      {
        organizationId,
        customerId,
        userId: authorId,
        eventType: 'customer.note_created',
        metadata: { noteId: note.id },
      },
      tx
    );

    return note;
  });
}

export async function getCustomerTimeline(
  organizationId: string,
  customerId: string,
  limit = 50
) {
  await getCustomerOrThrow(organizationId, customerId);
  return prisma.customerEvent.findMany({
    where: { organizationId, customerId },
    include: { user: { select: { fullName: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getCustomerDetail(
  organizationId: string,
  customerId: string
): Promise<CustomerDetail> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId, deletedAt: null },
    include: {
      tagLinks: { include: { tag: true } },
    },
  });
  if (!customer) throw new Error('NOT_FOUND');

  const [metrics, addresses, recentOrders, recentNotes, timeline] = await Promise.all([
    getCustomerMetrics(organizationId, customerId),
    listCustomerAddresses(organizationId, customerId),
    prisma.order.findMany({
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
    }),
    listCustomerNotes(organizationId, customerId, 10),
    getCustomerTimeline(organizationId, customerId, 30),
  ]);

  return {
    id: customer.id,
    displayName: customer.name,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    status: customer.status,
    source: customer.source,
    notes: customer.notes,
    isWalkIn: customer.isWalkIn,
    metrics,
    tags: customer.tagLinks.map((t) => ({
      id: t.tag.id,
      name: t.tag.name,
      slug: t.tag.slug,
      color: t.tag.color,
    })),
    addresses: addresses.map((a) => ({
      id: a.id,
      firstName: a.firstName,
      lastName: a.lastName,
      company: a.company,
      addressLine1: a.addressLine1,
      addressLine2: a.addressLine2,
      city: a.city,
      state: a.state,
      postalCode: a.postalCode,
      country: a.country,
      phone: a.phone,
      type: a.type,
      isDefault: a.isDefault,
    })),
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
    recentNotes: recentNotes.map((n) => ({
      id: n.id,
      content: n.content,
      authorName: n.author.fullName || n.author.email,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    })),
    timeline: timeline.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      source: e.source,
      userName: e.user?.fullName || e.user?.email || null,
      metadata: e.metadata as Record<string, unknown> | null,
      createdAt: e.createdAt.toISOString(),
    })),
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };
}

export async function exportCustomers(organizationId: string) {
  const customers = await prisma.customer.findMany({
    where: { organizationId, deletedAt: null, isWalkIn: false },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      status: true,
      source: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return customers.map((c) => ({
    id: c.id,
    displayName: c.name,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    status: c.status,
    source: c.source,
    createdAt: c.createdAt.toISOString(),
  }));
}
