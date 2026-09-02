import { prisma } from '@/lib/db';
import type { AutomationScheduleConfig } from '@/types/automation';

function computeNextRun(schedule: AutomationScheduleConfig, from = new Date()): Date {
  const next = new Date(from);
  next.setSeconds(0, 0);
  next.setHours(schedule.hour, schedule.minute, 0, 0);

  if (schedule.type === 'daily') {
    if (next <= from) next.setDate(next.getDate() + 1);
    return next;
  }

  if (schedule.type === 'weekly') {
    const targetDay = schedule.dayOfWeek ?? 1;
    const currentDay = next.getDay();
    let daysUntil = (targetDay - currentDay + 7) % 7;
    if (daysUntil === 0 && next <= from) daysUntil = 7;
    next.setDate(next.getDate() + daysUntil);
    return next;
  }

  if (schedule.type === 'monthly') {
    const targetDate = schedule.dayOfMonth ?? 1;
    next.setDate(targetDate);
    if (next <= from) next.setMonth(next.getMonth() + 1);
    return next;
  }

  return next;
}

export async function scheduleNextRun(params: {
  organizationId: string;
  automationId: string;
  versionId: string;
  schedule: AutomationScheduleConfig;
}) {
  const runAt = computeNextRun(params.schedule);

  return prisma.automationScheduledJob.create({
    data: {
      organizationId: params.organizationId,
      automationId: params.automationId,
      versionId: params.versionId,
      jobType: 'schedule',
      runAt,
      payload: { schedule: params.schedule },
    },
  });
}

export async function rescheduleAfterRun(params: {
  organizationId: string;
  automationId: string;
  versionId: string;
  schedule: AutomationScheduleConfig;
}) {
  return scheduleNextRun(params);
}

export { computeNextRun };
