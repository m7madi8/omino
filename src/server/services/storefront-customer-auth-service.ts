import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { normalizeEmail } from '@/lib/utils';

const SALT_ROUNDS = 10;
const SESSION_COOKIE = 'omino_storefront_session';

export { SESSION_COOKIE };

export async function registerStorefrontAccount(input: {
  organizationId: string;
  storeId: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}) {
  const email = normalizeEmail(input.email);
  if (!email) throw new Error('INVALID_EMAIL');
  if (input.password.length < 8) throw new Error('WEAK_PASSWORD');

  const existing = await prisma.storefrontAccount.findFirst({
    where: { storeId: input.storeId, email },
  });
  if (existing) throw new Error('EMAIL_TAKEN');

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const name =
    [input.firstName, input.lastName].filter(Boolean).join(' ').trim() || email.split('@')[0];

  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: {
        organizationId: input.organizationId,
        name,
        firstName: input.firstName,
        lastName: input.lastName,
        email,
        emailNormalized: email,
        source: 'ONLINE_STORE',
      },
    });

    const account = await tx.storefrontAccount.create({
      data: {
        organizationId: input.organizationId,
        storeId: input.storeId,
        customerId: customer.id,
        email,
        passwordHash,
      },
      include: { customer: true },
    });

    return account;
  });
}

export async function loginStorefrontAccount(input: {
  storeId: string;
  email: string;
  password: string;
}) {
  const email = normalizeEmail(input.email);
  const account = await prisma.storefrontAccount.findFirst({
    where: { storeId: input.storeId, email },
    include: { customer: true },
  });
  if (!account) throw new Error('INVALID_CREDENTIALS');

  const valid = await bcrypt.compare(input.password, account.passwordHash);
  if (!valid) throw new Error('INVALID_CREDENTIALS');

  await prisma.storefrontAccount.update({
    where: { id: account.id },
    data: { lastLoginAt: new Date() },
  });

  return account;
}

export async function getStorefrontAccountByCustomerId(customerId: string) {
  return prisma.storefrontAccount.findUnique({
    where: { customerId },
    include: { customer: { include: { addresses: true } } },
  });
}

export async function listCustomerOrders(
  organizationId: string,
  customerId: string,
  storeId?: string
) {
  return prisma.order.findMany({
    where: {
      organizationId,
      customerId,
      ...(storeId && { storeId }),
      status: { not: 'DRAFT' },
    },
    include: {
      items: { take: 3 },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getCustomerOrder(
  organizationId: string,
  customerId: string,
  orderId: string
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, organizationId, customerId },
    include: {
      items: true,
      events: { orderBy: { createdAt: 'asc' } },
      payments: true,
    },
  });
  if (!order) throw new Error('NOT_FOUND');
  return order;
}

export function createStorefrontSessionToken() {
  return randomBytes(32).toString('hex');
}
