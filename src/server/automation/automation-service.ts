import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { AutomationVersionConfig } from '@/types/automation';
import { isScheduledTrigger } from '@/server/automation/triggers/registry';
import { scheduleNextRun } from '@/server/automation/scheduler-service';

export async function listAutomations(organizationId: string) {
  const automations = await prisma.automation.findMany({
    where: { organizationId, status: { not: 'ARCHIVED' } },
    include: {
      currentVersion: true,
      executions: {
        orderBy: { startedAt: 'desc' },
        take: 1,
        select: { startedAt: true, status: true },
      },
      _count: { select: { executions: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const stats = await prisma.automationExecution.groupBy({
    by: ['automationId', 'status'],
    where: { organizationId },
    _count: { id: true },
  });

  const statsMap = new Map<string, { total: number; succeeded: number }>();
  for (const row of stats) {
    const current = statsMap.get(row.automationId) ?? { total: 0, succeeded: 0 };
    current.total += row._count.id;
    if (row.status === 'SUCCEEDED') current.succeeded += row._count.id;
    statsMap.set(row.automationId, current);
  }

  return automations.map((a: (typeof automations)[number]) => {
    const s = statsMap.get(a.id);
    const successRate = s && s.total > 0 ? Math.round((s.succeeded / s.total) * 100) : null;
    return {
      id: a.id,
      name: a.name,
      description: a.description,
      status: a.status,
      triggerType: a.currentVersion?.triggerType ?? null,
      storeId: a.storeId,
      branchId: a.branchId,
      lastExecution: a.executions[0] ?? null,
      executionCount: a._count.executions,
      successRate,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    };
  });
}

export async function getAutomation(organizationId: string, automationId: string) {
  const automation = await prisma.automation.findFirst({
    where: { id: automationId, organizationId },
    include: {
      currentVersion: true,
      versions: { orderBy: { versionNumber: 'desc' } },
    },
  });
  if (!automation) throw new Error('NOT_FOUND');
  return automation;
}

export async function createAutomation(params: {
  organizationId: string;
  createdById: string;
  name: string;
  description?: string;
  storeId?: string;
  branchId?: string;
  config: AutomationVersionConfig;
}) {
  return prisma.$transaction(async (tx) => {
    const automation = await tx.automation.create({
      data: {
        organizationId: params.organizationId,
        createdById: params.createdById,
        name: params.name,
        description: params.description,
        storeId: params.storeId,
        branchId: params.branchId,
        status: 'DRAFT',
      },
    });

    const version = await tx.automationVersion.create({
      data: {
        automationId: automation.id,
        versionNumber: 1,
        triggerType: params.config.trigger.type,
        config: params.config as unknown as Prisma.InputJsonValue,
      },
    });

    return tx.automation.update({
      where: { id: automation.id },
      data: { currentVersionId: version.id },
      include: { currentVersion: true },
    });
  });
}

export async function updateAutomationDraft(
  organizationId: string,
  automationId: string,
  input: {
    name?: string;
    description?: string;
    config?: AutomationVersionConfig;
  }
) {
  const automation = await prisma.automation.findFirst({
    where: { id: automationId, organizationId },
    include: { currentVersion: true },
  });
  if (!automation) throw new Error('NOT_FOUND');
  if (automation.status !== 'DRAFT') throw new Error('INVALID_STATE');

  if (input.config) {
    const nextVersion = (automation.currentVersion?.versionNumber ?? 0) + 1;
    const version = await prisma.automationVersion.create({
      data: {
        automationId,
        versionNumber: nextVersion,
        triggerType: input.config.trigger.type,
        config: input.config as unknown as Prisma.InputJsonValue,
      },
    });
    return prisma.automation.update({
      where: { id: automationId },
      data: {
        name: input.name ?? automation.name,
        description: input.description ?? automation.description,
        currentVersionId: version.id,
      },
      include: { currentVersion: true },
    });
  }

  return prisma.automation.update({
    where: { id: automationId },
    data: {
      name: input.name,
      description: input.description,
    },
    include: { currentVersion: true },
  });
}

export async function activateAutomation(organizationId: string, automationId: string) {
  const automation = await getAutomation(organizationId, automationId);
  if (!automation.currentVersion) throw new Error('VALIDATION_ERROR');

  const updated = await prisma.automation.update({
    where: { id: automationId },
    data: { status: 'ACTIVE' },
    include: { currentVersion: true },
  });

  if (
    automation.currentVersion &&
    isScheduledTrigger(automation.currentVersion.triggerType)
  ) {
    const config = automation.currentVersion.config as AutomationVersionConfig;
    if (config.schedule) {
      await scheduleNextRun({
        organizationId,
        automationId,
        versionId: automation.currentVersion.id,
        schedule: config.schedule,
      });
    }
  }

  return updated;
}

export async function pauseAutomation(organizationId: string, automationId: string) {
  const automation = await prisma.automation.findFirst({
    where: { id: automationId, organizationId },
  });
  if (!automation) throw new Error('NOT_FOUND');

  return prisma.automation.update({
    where: { id: automationId },
    data: { status: 'PAUSED' },
  });
}

export async function archiveAutomation(organizationId: string, automationId: string) {
  const automation = await prisma.automation.findFirst({
    where: { id: automationId, organizationId },
  });
  if (!automation) throw new Error('NOT_FOUND');

  return prisma.automation.update({
    where: { id: automationId },
    data: { status: 'ARCHIVED' },
  });
}

export async function duplicateAutomation(
  organizationId: string,
  automationId: string,
  createdById: string
) {
  const source = await getAutomation(organizationId, automationId);
  if (!source.currentVersion) throw new Error('NOT_FOUND');

  const config = source.currentVersion.config as AutomationVersionConfig;
  return createAutomation({
    organizationId,
    createdById,
    name: `${source.name} (copy)`,
    description: source.description ?? undefined,
    storeId: source.storeId ?? undefined,
    branchId: source.branchId ?? undefined,
    config,
  });
}

export async function listAutomationExecutions(
  organizationId: string,
  automationId: string,
  page = 1,
  pageSize = 20
) {
  const skip = (page - 1) * pageSize;
  const [executions, total] = await Promise.all([
    prisma.automationExecution.findMany({
      where: { organizationId, automationId },
      include: { steps: { orderBy: { stepIndex: 'asc' } } },
      orderBy: { startedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.automationExecution.count({ where: { organizationId, automationId } }),
  ]);

  return { executions, total, page, pageSize };
}

export async function getAutomationMetrics(
  organizationId: string
): Promise<import('@/types/automation').AutomationMetrics> {
  const [automations, executionStats, topByCount, failedByCount] = await Promise.all([
    prisma.automation.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { id: true },
    }),
    prisma.automationExecution.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { id: true },
    }),
    prisma.automationExecution.groupBy({
      by: ['automationId'],
      where: { organizationId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
    prisma.automationExecution.groupBy({
      by: ['automationId'],
      where: { organizationId, status: 'FAILED' },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
  ]);

  const statusCounts = Object.fromEntries(
    automations.map((a: { status: string; _count: { id: number } }) => [a.status, a._count.id])
  );
  const execCounts = Object.fromEntries(
    executionStats.map((e: { status: string; _count: { id: number } }) => [e.status, e._count.id])
  );

  const totalExecutions = executionStats.reduce(
    (s: number, e: { _count: { id: number } }) => s + e._count.id,
    0
  );
  const successful = execCounts.SUCCEEDED ?? 0;
  const failed = execCounts.FAILED ?? 0;
  const skipped = execCounts.SKIPPED ?? 0;

  const automationIds = [
    ...new Set([
      ...topByCount.map((t) => t.automationId),
      ...failedByCount.map((f) => f.automationId),
    ]),
  ];
  const automationNames = await prisma.automation.findMany({
    where: { id: { in: automationIds } },
    select: { id: true, name: true },
  });
  const nameMap = new Map(
    automationNames.map((a: { id: string; name: string }) => [a.id, a.name])
  );

  return {
    totalAutomations: automations.reduce(
      (s: number, a: { _count: { id: number } }) => s + a._count.id,
      0
    ),
    activeAutomations: statusCounts.ACTIVE ?? 0,
    pausedAutomations: statusCounts.PAUSED ?? 0,
    totalExecutions,
    successfulExecutions: successful,
    failedExecutions: failed,
    skippedExecutions: skipped,
    successRate: totalExecutions > 0 ? Math.round((successful / totalExecutions) * 100) : 0,
    topAutomations: topByCount.map((t: { automationId: string; _count: { id: number } }) => ({
      id: t.automationId,
      name: nameMap.get(t.automationId) ?? 'Unknown',
      executionCount: t._count.id,
    })),
    mostFailedAutomations: failedByCount.map((f: { automationId: string; _count: { id: number } }) => ({
      id: f.automationId,
      name: nameMap.get(f.automationId) ?? 'Unknown',
      failureCount: f._count.id,
    })),
  };
}
