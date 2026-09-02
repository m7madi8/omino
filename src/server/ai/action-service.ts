import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { logAudit } from '@/server/services/audit-service';
import { executeWriteTool } from '@/server/ai/tools/handlers';
import { getToolDefinition } from '@/server/ai/tools/registry';
import { hasToolPermission } from '@/server/ai/tools/executor';
import type { ToolExecutionContext } from '@/types/ai';

export async function createPendingAction(params: {
  organizationId: string;
  userId: string;
  conversationId: string;
  toolName: string;
  input: Record<string, unknown>;
  dryRunResult: unknown;
  idempotencyKey?: string;
}) {
  return prisma.aiAction.create({
    data: {
      organizationId: params.organizationId,
      userId: params.userId,
      conversationId: params.conversationId,
      toolName: params.toolName,
      input: params.input as Prisma.InputJsonValue,
      dryRunResult: params.dryRunResult as Prisma.InputJsonValue,
      status: 'PENDING',
      confirmationRequired: true,
      idempotencyKey: params.idempotencyKey,
    },
  });
}

export async function listActions(organizationId: string, limit = 50) {
  return prisma.aiAction.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { fullName: true, email: true } },
      conversation: { select: { title: true } },
    },
  });
}

export async function getAction(organizationId: string, actionId: string) {
  const action = await prisma.aiAction.findFirst({
    where: { id: actionId, organizationId },
  });
  if (!action) throw new Error('NOT_FOUND');
  return action;
}

export async function confirmAction(params: {
  organizationId: string;
  userId: string;
  actionId: string;
  permissions: ToolExecutionContext['permissions'];
  conversationId: string;
  storeId: string | null;
  branchId: string | null;
  currency: string;
}) {
  const action = await prisma.aiAction.findFirst({
    where: {
      id: params.actionId,
      organizationId: params.organizationId,
      status: 'PENDING',
    },
  });

  if (!action) throw new Error('NOT_FOUND');
  if (action.userId !== params.userId) throw new Error('FORBIDDEN');

  const def = getToolDefinition(action.toolName);
  if (!def) throw new Error('UNKNOWN_TOOL');

  if (!hasToolPermission(params.permissions, def.permissions)) {
    throw new Error('FORBIDDEN');
  }

  const ctx: ToolExecutionContext = {
    organizationId: params.organizationId,
    userId: params.userId,
    storeId: params.storeId,
    branchId: params.branchId,
    currency: params.currency,
    permissions: params.permissions,
    conversationId: params.conversationId,
  };

  await prisma.aiAction.update({
    where: { id: action.id },
    data: { status: 'CONFIRMED', confirmedAt: new Date() },
  });

  try {
    const result = await executeWriteTool(
      ctx,
      action.toolName,
      action.input as Record<string, unknown>
    );

    const updated = await prisma.aiAction.update({
      where: { id: action.id },
      data: {
        status: 'EXECUTED',
        executedAt: new Date(),
        result: result as Prisma.InputJsonValue,
      },
    });

    if (def.auditRequired) {
      await logAudit({
        organizationId: params.organizationId,
        userId: params.userId,
        action: 'AI_ACTION_EXECUTED',
        entityType: 'ai_action',
        entityId: action.id,
        metadata: {
          tool: action.toolName,
          input: action.input,
          result,
          source: 'AI',
          confirmed: true,
        },
      });
    }

    return updated;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'EXECUTION_FAILED';
    await prisma.aiAction.update({
      where: { id: action.id },
      data: { status: 'FAILED', error: message },
    });
    throw err;
  }
}

export async function cancelAction(
  organizationId: string,
  userId: string,
  actionId: string
) {
  const action = await prisma.aiAction.findFirst({
    where: { id: actionId, organizationId, userId, status: 'PENDING' },
  });
  if (!action) throw new Error('NOT_FOUND');

  return prisma.aiAction.update({
    where: { id: actionId },
    data: { status: 'CANCELLED' },
  });
}

export async function getPendingActionsForConversation(
  organizationId: string,
  conversationId: string
) {
  return prisma.aiAction.findMany({
    where: { organizationId, conversationId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });
}
