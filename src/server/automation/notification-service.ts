import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

export async function createInternalNotification(input: {
  organizationId: string;
  userId?: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.internalNotification.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      title: input.title,
      body: input.body,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function listInternalNotifications(
  organizationId: string,
  userId?: string,
  limit = 20
) {
  return prisma.internalNotification.findMany({
    where: {
      organizationId,
      ...(userId ? { OR: [{ userId }, { userId: null }] } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
