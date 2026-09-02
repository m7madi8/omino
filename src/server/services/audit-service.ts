import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

export type AuditAction =
  | 'ORDER_CREATED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_CANCELLED'
  | 'ORDER_COMPLETED'
  | 'PAYMENT_CREATED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUNDED'
  | 'ORDER_REFUNDED';

export async function logAudit(
  input: {
    organizationId: string;
    userId?: string;
    action: AuditAction | string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  },
  tx: Tx = prisma
) {
  return tx.auditLog.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
