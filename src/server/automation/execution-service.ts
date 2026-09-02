import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type {
  AutomationVersionConfig,
  BusinessEventInput,
  AutomationExecutionContext,
} from '@/types/automation';
import { triggerMatches } from '@/server/automation/triggers/registry';
import { evaluateConditionGroup } from '@/server/automation/conditions/engine';
import { executeAutomationAction } from '@/server/automation/actions/executor';
import { getCustomerMetrics } from '@/server/services/customer-metrics-service';
import { getOrderDetail } from '@/server/services/order-service';
import { checkRateLimit } from '@/lib/security/rate-limit';

const AUTOMATION_EXEC_LIMIT = parseInt(
  process.env.AUTOMATION_EXEC_RATE_LIMIT_PER_MINUTE ?? '60',
  10
);

function delayToMs(delay: { seconds?: number; minutes?: number; hours?: number; days?: number }) {
  return (
    (delay.seconds ?? 0) * 1000 +
    (delay.minutes ?? 0) * 60_000 +
    (delay.hours ?? 0) * 3_600_000 +
    (delay.days ?? 0) * 86_400_000
  );
}

async function enrichEventData(
  event: BusinessEventInput & { id?: string }
): Promise<Record<string, unknown>> {
  const enriched: Record<string, unknown> = {
    event: {
      type: event.type,
      payload: event.payload,
      entityType: event.entityType,
      entityId: event.entityId,
    },
    payload: event.payload,
  };

  const orderId =
    (event.payload.orderId as string) ||
    (event.entityType === 'order' ? event.entityId : undefined);

  if (orderId) {
    try {
      const order = await getOrderDetail(event.organizationId, orderId);
      enriched.order = {
        id: order.id,
        orderNumber: order.orderNumber,
        totalMinor: order.totalMinor,
        status: order.status,
        customerId: order.customerId,
        source: order.source,
      };
    } catch {
      // order may not exist in edge cases
    }
  }

  const customerId =
    (event.payload.customerId as string) ||
    (event.entityType === 'customer' ? event.entityId : undefined) ||
    (enriched.order as { customerId?: string } | undefined)?.customerId;

  if (customerId) {
    try {
      const metrics = await getCustomerMetrics(event.organizationId, customerId);
      enriched.customer = {
        id: customerId,
        totalOrders: metrics.totalOrders,
        completedOrders: metrics.completedOrders,
        totalRevenueMinor: metrics.totalRevenueMinor,
        netRevenueMinor: metrics.netRevenueMinor,
      };
    } catch {
      // customer may not exist
    }
  }

  return enriched;
}

function buildIdempotencyKey(
  eventId: string,
  automationId: string,
  versionId: string
) {
  return `${eventId}:${automationId}:${versionId}`;
}

export async function processEventForAutomations(
  event: BusinessEventInput & { id: string }
): Promise<void> {
  const rate = checkRateLimit(
    `automation-exec:${event.organizationId}`,
    AUTOMATION_EXEC_LIMIT
  );
  if (!rate.allowed) {
    console.warn('[automation] rate limit exceeded', event.organizationId);
    return;
  }

  const automations = await prisma.automation.findMany({
    where: {
      organizationId: event.organizationId,
      status: 'ACTIVE',
      currentVersion: { isNot: null },
    },
    include: { currentVersion: true },
  });

  if (automations.length === 0) return;

  const enrichedData = await enrichEventData(event);

  for (const automation of automations) {
    const version = automation.currentVersion;
    if (!version) continue;

    if (!triggerMatches(version.triggerType, event.type)) continue;

    if (automation.storeId && event.storeId && automation.storeId !== event.storeId) continue;
    if (automation.branchId && event.branchId && automation.branchId !== event.branchId) continue;

    const idempotencyKey = buildIdempotencyKey(event.id, automation.id, version.id);

    const existing = await prisma.automationExecution.findUnique({
      where: {
        organizationId_idempotencyKey: {
          organizationId: event.organizationId,
          idempotencyKey,
        },
      },
    });
    if (existing) continue;

    await runAutomationExecution({
      automationId: automation.id,
      versionId: version.id,
      organizationId: event.organizationId,
      businessEventId: event.id,
      eventType: event.type,
      idempotencyKey,
      event,
      enrichedData,
      storeId: automation.storeId,
      branchId: automation.branchId,
    });
  }
}

export async function runAutomationExecution(params: {
  automationId: string;
  versionId: string;
  organizationId: string;
  businessEventId?: string;
  eventType?: string;
  idempotencyKey: string;
  event: BusinessEventInput & { id?: string };
  enrichedData: Record<string, unknown>;
  storeId?: string | null;
  branchId?: string | null;
  resumeFromStep?: number;
  executionId?: string;
}) {
  const version = await prisma.automationVersion.findUnique({
    where: { id: params.versionId },
  });
  if (!version) return;

  const config = version.config as AutomationVersionConfig;
  const startTime = Date.now();

  let execution = params.executionId
    ? await prisma.automationExecution.findUnique({ where: { id: params.executionId } })
    : null;

  if (!execution) {
    const conditionEval = evaluateConditionGroup(config.conditions, {
      ...params.enrichedData,
      ...params.event.payload,
    });

    execution = await prisma.automationExecution.create({
      data: {
        organizationId: params.organizationId,
        automationId: params.automationId,
        versionId: params.versionId,
        businessEventId: params.businessEventId,
        eventType: params.eventType,
        idempotencyKey: params.idempotencyKey,
        status: conditionEval.passed ? 'RUNNING' : 'SKIPPED',
        conditionResult: conditionEval as unknown as Prisma.InputJsonValue,
        eventSnapshot: params.event as unknown as Prisma.InputJsonValue,
        startedAt: new Date(),
      },
    });

    if (!conditionEval.passed) {
      await prisma.automationExecution.update({
        where: { id: execution.id },
        data: { completedAt: new Date(), durationMs: Date.now() - startTime },
      });
      return execution;
    }
  }

  const context: AutomationExecutionContext = {
    organizationId: params.organizationId,
    storeId: params.storeId ?? params.event.storeId ?? null,
    branchId: params.branchId ?? params.event.branchId ?? null,
    actorId: params.event.actorId ?? null,
    event: params.event,
    enrichedData: params.enrichedData,
  };

  const startStep = params.resumeFromStep ?? 0;

  for (let i = startStep; i < config.steps.length; i++) {
    const step = config.steps[i];

    if (step.type === 'delay') {
      const runAt = new Date(Date.now() + delayToMs(step.delay));
      await prisma.automationScheduledJob.create({
        data: {
          organizationId: params.organizationId,
          automationId: params.automationId,
          versionId: params.versionId,
          executionId: execution.id,
          stepIndex: i + 1,
          jobType: 'delay',
          runAt,
          payload: {
            event: params.event,
            enrichedData: params.enrichedData,
            idempotencyKey: params.idempotencyKey,
          } as Prisma.InputJsonValue,
        },
      });

      await prisma.automationExecutionStep.create({
        data: {
          executionId: execution.id,
          stepIndex: i,
          stepType: 'delay',
          status: 'SUCCEEDED',
          input: step.delay as unknown as Prisma.InputJsonValue,
          output: { scheduledFor: runAt.toISOString() } as Prisma.InputJsonValue,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      });
      return execution;
    }

    const actionStep = step;
    const stepRecord = await prisma.automationExecutionStep.create({
      data: {
        executionId: execution.id,
        stepIndex: i,
        stepType: 'action',
        actionType: actionStep.actionType,
        input: actionStep.input as Prisma.InputJsonValue,
        status: 'RUNNING',
        maxAttempts: actionStep.maxAttempts ?? 3,
        startedAt: new Date(),
      },
    });

    try {
      const output = await executeAutomationAction(
        actionStep.actionType,
        actionStep.input,
        context,
        `${params.idempotencyKey}:step:${i}`
      );

      await prisma.automationExecutionStep.update({
        where: { id: stepRecord.id },
        data: {
          status: 'SUCCEEDED',
          output: output as Prisma.InputJsonValue,
          attemptCount: 1,
          completedAt: new Date(),
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ACTION_FAILED';
      const maxAttempts = actionStep.maxAttempts ?? 3;

      if (maxAttempts > 1) {
        const nextRetryAt = new Date(Date.now() + 60_000);
        await prisma.automationExecutionStep.update({
          where: { id: stepRecord.id },
          data: {
            status: 'PENDING',
            error: message,
            attemptCount: 1,
            maxAttempts,
            nextRetryAt,
          },
        });
      } else {
        await prisma.automationExecutionStep.update({
          where: { id: stepRecord.id },
          data: {
            status: 'FAILED',
            error: message,
            attemptCount: 1,
            completedAt: new Date(),
          },
        });

        await prisma.automationExecution.update({
          where: { id: execution.id },
          data: {
            status: 'FAILED',
            error: message,
            completedAt: new Date(),
            durationMs: Date.now() - startTime,
          },
        });
        return execution;
      }
    }
  }

  await prisma.automationExecution.update({
    where: { id: execution.id },
    data: {
      status: 'SUCCEEDED',
      completedAt: new Date(),
      durationMs: Date.now() - startTime,
    },
  });

  return execution;
}

export async function processScheduledJobs(limit = 50) {
  const jobs = await prisma.automationScheduledJob.findMany({
    where: {
      status: 'pending',
      runAt: { lte: new Date() },
    },
    orderBy: { runAt: 'asc' },
    take: limit,
  });

  for (const job of jobs) {
    await prisma.automationScheduledJob.update({
      where: { id: job.id },
      data: { status: 'processing' },
    });

    try {
      if (job.jobType === 'delay' && job.executionId && job.stepIndex != null) {
        const payload = job.payload as {
          event: BusinessEventInput;
          enrichedData: Record<string, unknown>;
          idempotencyKey: string;
        };

        await runAutomationExecution({
          automationId: job.automationId,
          versionId: job.versionId,
          organizationId: job.organizationId,
          idempotencyKey: payload.idempotencyKey,
          event: payload.event,
          enrichedData: payload.enrichedData,
          executionId: job.executionId,
          resumeFromStep: job.stepIndex,
        });
      } else if (job.jobType === 'schedule') {
        const automation = await prisma.automation.findUnique({
          where: { id: job.automationId },
          include: { currentVersion: true },
        });
        if (automation?.status === 'ACTIVE' && automation.currentVersion) {
          const syntheticEvent: BusinessEventInput & { id: string } = {
            id: job.id,
            type: automation.currentVersion.triggerType,
            organizationId: job.organizationId,
            storeId: automation.storeId,
            branchId: automation.branchId,
            payload: {},
            source: 'scheduler',
          };
          const enrichedData = await enrichEventData(syntheticEvent);
          await runAutomationExecution({
            automationId: job.automationId,
            versionId: job.versionId,
            organizationId: job.organizationId,
            businessEventId: undefined,
            eventType: syntheticEvent.type,
            idempotencyKey: `schedule:${job.id}`,
            event: syntheticEvent,
            enrichedData,
            storeId: automation.storeId,
            branchId: automation.branchId,
          });
        }
      }

      await prisma.automationScheduledJob.update({
        where: { id: job.id },
        data: { status: 'completed', processedAt: new Date() },
      });
    } catch (err) {
      console.error('[automation] scheduled job failed', job.id, err);
      await prisma.automationScheduledJob.update({
        where: { id: job.id },
        data: { status: 'failed', processedAt: new Date() },
      });
    }
  }

  return jobs.length;
}

export async function retryFailedSteps(limit = 20) {
  const steps = await prisma.automationExecutionStep.findMany({
    where: {
      status: 'PENDING',
      nextRetryAt: { lte: new Date() },
    },
    include: { execution: true },
    take: limit,
  });

  for (const step of steps) {
    if (!step.actionType || !step.execution) continue;
    if (step.attemptCount >= step.maxAttempts) {
      await prisma.automationExecutionStep.update({
        where: { id: step.id },
        data: { status: 'FAILED', completedAt: new Date() },
      });
      continue;
    }

    const eventSnapshot = step.execution.eventSnapshot as BusinessEventInput;
    const enrichedData = await enrichEventData(eventSnapshot);

    const context: AutomationExecutionContext = {
      organizationId: step.execution.organizationId,
      storeId: eventSnapshot.storeId ?? null,
      branchId: eventSnapshot.branchId ?? null,
      actorId: eventSnapshot.actorId ?? null,
      event: eventSnapshot,
      enrichedData,
    };

    try {
      const output = await executeAutomationAction(
        step.actionType,
        (step.input ?? {}) as Record<string, unknown>,
        context,
        `${step.execution.idempotencyKey}:retry:${step.id}`
      );

      await prisma.automationExecutionStep.update({
        where: { id: step.id },
        data: {
          status: 'SUCCEEDED',
          output: output as Prisma.InputJsonValue,
          attemptCount: step.attemptCount + 1,
          completedAt: new Date(),
          nextRetryAt: null,
          error: null,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ACTION_FAILED';
      const nextAttempt = step.attemptCount + 1;
      const backoffMs = Math.min(3600_000, 60_000 * Math.pow(2, nextAttempt - 1));

      if (nextAttempt >= step.maxAttempts) {
        await prisma.automationExecutionStep.update({
          where: { id: step.id },
          data: {
            status: 'FAILED',
            error: message,
            attemptCount: nextAttempt,
            completedAt: new Date(),
          },
        });
        await prisma.automationExecution.update({
          where: { id: step.executionId },
          data: { status: 'FAILED', error: message, completedAt: new Date() },
        });
      } else {
        await prisma.automationExecutionStep.update({
          where: { id: step.id },
          data: {
            status: 'PENDING',
            error: message,
            attemptCount: nextAttempt,
            nextRetryAt: new Date(Date.now() + backoffMs),
          },
        });
      }
    }
  }
}
