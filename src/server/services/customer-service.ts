import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { CustomerSource, CustomerStatus } from '@/types/prisma-enums';
import {
  buildDisplayName,
  normalizeEmail,
  normalizePhone,
  splitDisplayName,
} from '@/lib/customer-utils';
import { emitCustomerEvent } from '@/server/events/customer-events';

type Tx = Prisma.TransactionClient;

export async function recordCustomerEvent(
  input: {
    organizationId: string;
    customerId: string;
    userId?: string;
    eventType: string;
    storeId?: string;
    branchId?: string;
    source?: string;
    metadata?: Record<string, unknown>;
  },
  tx: Tx = prisma
) {
  const event = await tx.customerEvent.create({
    data: {
      organizationId: input.organizationId,
      customerId: input.customerId,
      userId: input.userId,
      eventType: input.eventType,
      storeId: input.storeId,
      branchId: input.branchId,
      source: input.source,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });

  await emitCustomerEvent({
    type: input.eventType as never,
    organizationId: input.organizationId,
    customerId: input.customerId,
    userId: input.userId,
    payload: input.metadata,
  });

  return event;
}

export type CreateCustomerInput = {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: CustomerStatus;
  source?: CustomerSource;
  notes?: string;
  tagIds?: string[];
};

function prepareCustomerData(
  organizationId: string,
  input: CreateCustomerInput
) {
  const emailNormalized = normalizeEmail(input.email);
  const phoneNormalized = normalizePhone(input.phone);
  const displayName = buildDisplayName({
    firstName: input.firstName,
    lastName: input.lastName,
    name: input.name,
    email: input.email,
    phone: input.phone,
  });
  const split = !input.firstName && !input.lastName && input.name
    ? splitDisplayName(input.name)
    : { firstName: input.firstName ?? null, lastName: input.lastName ?? null };

  return {
    organizationId,
    firstName: split.firstName,
    lastName: split.lastName,
    name: displayName,
    email: input.email?.trim() || null,
    emailNormalized,
    phone: input.phone?.trim() || null,
    phoneNormalized,
    status: input.status ?? 'ACTIVE',
    source: input.source ?? 'MANUAL',
    notes: input.notes?.trim() || null,
  };
}

export async function findCustomerMatches(
  organizationId: string,
  input: { email?: string; phone?: string; name?: string }
) {
  const emailNormalized = normalizeEmail(input.email);
  const phoneNormalized = normalizePhone(input.phone);
  const matches: { id: string; displayName: string; email: string | null; phone: string | null; matchReason: 'email' | 'phone' | 'name' }[] = [];
  const seen = new Set<string>();

  if (emailNormalized) {
    const byEmail = await prisma.customer.findMany({
      where: { organizationId, deletedAt: null, emailNormalized, isWalkIn: false },
      take: 5,
    });
    for (const c of byEmail) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        matches.push({
          id: c.id,
          displayName: c.name,
          email: c.email,
          phone: c.phone,
          matchReason: 'email',
        });
      }
    }
  }

  if (phoneNormalized) {
    const byPhone = await prisma.customer.findMany({
      where: { organizationId, deletedAt: null, phoneNormalized, isWalkIn: false },
      take: 5,
    });
    for (const c of byPhone) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        matches.push({
          id: c.id,
          displayName: c.name,
          email: c.email,
          phone: c.phone,
          matchReason: 'phone',
        });
      }
    }
  }

  if (input.name?.trim() && matches.length === 0) {
    const byName = await prisma.customer.findMany({
      where: {
        organizationId,
        deletedAt: null,
        isWalkIn: false,
        name: { equals: input.name.trim(), mode: 'insensitive' },
      },
      take: 3,
    });
    for (const c of byName) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        matches.push({
          id: c.id,
          displayName: c.name,
          email: c.email,
          phone: c.phone,
          matchReason: 'name',
        });
      }
    }
  }

  return matches;
}

export async function createCustomer(
  organizationId: string,
  userId: string | undefined,
  input: CreateCustomerInput,
  options?: { skipDuplicateCheck?: boolean }
) {
  if (!options?.skipDuplicateCheck) {
    const matches = await findCustomerMatches(organizationId, input);
    if (matches.length > 0) {
      const err = new Error('DUPLICATE_CUSTOMER');
      (err as Error & { matches: unknown }).matches = matches;
      throw err;
    }
  }

  if (!input.email && !input.phone && !input.name && !input.firstName) {
    throw new Error('VALIDATION_ERROR');
  }

  const data = prepareCustomerData(organizationId, input);

  const customer = await prisma.$transaction(async (tx) => {
    const created = await tx.customer.create({ data });

    if (input.tagIds?.length) {
      await tx.customerTagAssignment.createMany({
        data: input.tagIds.map((tagId) => ({ customerId: created.id, tagId })),
        skipDuplicates: true,
      });
    }

    await recordCustomerEvent(
      {
        organizationId,
        customerId: created.id,
        userId,
        eventType: 'CUSTOMER_CREATED',
        source: data.source,
        metadata: { displayName: created.name },
      },
      tx
    );

    return created;
  });

  return customer;
}

export async function findOrCreateCustomerFromCheckout(
  organizationId: string,
  input: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    source: CustomerSource;
    userId?: string;
  }
) {
  const matches = await findCustomerMatches(organizationId, input);
  if (matches.length === 1) {
    return prisma.customer.findFirstOrThrow({
      where: { id: matches[0].id, organizationId },
    });
  }
  if (matches.length > 1) {
    const err = new Error('AMBIGUOUS_CUSTOMER_MATCH');
    (err as Error & { matches: unknown }).matches = matches;
    throw err;
  }

  return createCustomer(
    organizationId,
    input.userId,
    { ...input, source: input.source },
    { skipDuplicateCheck: true }
  );
}

export async function updateCustomer(
  organizationId: string,
  customerId: string,
  userId: string | undefined,
  input: Partial<CreateCustomerInput> & { status?: CustomerStatus }
) {
  const existing = await prisma.customer.findFirst({
    where: { id: customerId, organizationId, deletedAt: null },
  });
  if (!existing) throw new Error('NOT_FOUND');
  if (existing.isWalkIn) throw new Error('VALIDATION_ERROR');

  const merged: CreateCustomerInput & { status: CustomerStatus } = {
    firstName: input.firstName ?? existing.firstName ?? undefined,
    lastName: input.lastName ?? existing.lastName ?? undefined,
    name: input.name ?? existing.name,
    email: input.email !== undefined ? input.email : existing.email ?? undefined,
    phone: input.phone !== undefined ? input.phone : existing.phone ?? undefined,
    notes: input.notes !== undefined ? input.notes : existing.notes ?? undefined,
    status: input.status ?? existing.status,
    source: existing.source,
  };

  const data = {
    ...prepareCustomerData(organizationId, merged),
    status: merged.status,
    notes: merged.notes ?? null,
  };

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.customer.update({
      where: { id: customerId },
      data,
    });

    await recordCustomerEvent(
      {
        organizationId,
        customerId,
        userId,
        eventType: 'CUSTOMER_UPDATED',
        metadata: { fields: Object.keys(input) },
      },
      tx
    );

    return row;
  });

  return updated;
}

export async function archiveCustomer(
  organizationId: string,
  customerId: string,
  userId?: string
) {
  const existing = await prisma.customer.findFirst({
    where: { id: customerId, organizationId, deletedAt: null },
  });
  if (!existing) throw new Error('NOT_FOUND');
  if (existing.isWalkIn) throw new Error('VALIDATION_ERROR');

  return prisma.$transaction(async (tx) => {
    const row = await tx.customer.update({
      where: { id: customerId },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });

    await recordCustomerEvent(
      {
        organizationId,
        customerId,
        userId,
        eventType: 'CUSTOMER_UPDATED',
        metadata: { archived: true },
      },
      tx
    );

    return row;
  });
}

export async function getCustomerOrThrow(organizationId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId, deletedAt: null },
  });
  if (!customer) throw new Error('NOT_FOUND');
  return customer;
}

export async function getWalkInCustomer(organizationId: string) {
  let customer = await prisma.customer.findFirst({
    where: { organizationId, isWalkIn: true },
  });
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        organizationId,
        name: 'Walk-in Customer',
        isWalkIn: true,
        source: 'POS',
      },
    });
  }
  return customer;
}

export async function attachCustomerToCart(
  organizationId: string,
  userId: string,
  cartId: string,
  customerId: string | null
) {
  const cart = await prisma.cart.findFirst({
    where: { id: cartId, organizationId, userId, status: 'ACTIVE' },
  });
  if (!cart) throw new Error('NOT_FOUND');

  if (customerId) {
    await getCustomerOrThrow(organizationId, customerId);
  }

  return prisma.cart.update({
    where: { id: cartId },
    data: { customerId },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      items: true,
    },
  });
}

export async function recordOrderCustomerActivity(input: {
  organizationId: string;
  customerId: string;
  orderId: string;
  orderNumber: string;
  eventType: 'ORDER_CREATED' | 'ORDER_COMPLETED' | 'ORDER_CANCELLED' | 'ORDER_REFUNDED';
  userId?: string;
  storeId?: string;
  branchId?: string;
  source?: string;
  totalMinor?: number;
  currency?: string;
}) {
  const eventMap = {
    ORDER_CREATED: 'customer.order_created',
    ORDER_COMPLETED: 'customer.order_completed',
    ORDER_CANCELLED: 'customer.order_cancelled',
    ORDER_REFUNDED: 'customer.order_refunded',
  } as const;

  return recordCustomerEvent({
    organizationId: input.organizationId,
    customerId: input.customerId,
    userId: input.userId,
    eventType: eventMap[input.eventType],
    storeId: input.storeId,
    branchId: input.branchId,
    source: input.source,
    metadata: {
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      totalMinor: input.totalMinor,
      currency: input.currency,
    },
  });
}
