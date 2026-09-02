import { prisma } from '@/lib/db';
import type { MarketingCampaignStatus, MarketingChannel, Prisma } from '@prisma/client';
import { generateTrackingCode } from '@/server/services/marketing/promotion-service';
import { emitMarketingEvent } from '@/server/events/marketing-events';

const TRANSITIONS: Record<MarketingCampaignStatus, MarketingCampaignStatus[]> = {
  DRAFT: ['SCHEDULED', 'ACTIVE', 'ARCHIVED'],
  SCHEDULED: ['ACTIVE', 'DRAFT', 'ARCHIVED'],
  ACTIVE: ['PAUSED', 'COMPLETED'],
  PAUSED: ['ACTIVE', 'COMPLETED', 'ARCHIVED'],
  COMPLETED: ['ARCHIVED'],
  ARCHIVED: [],
};

function assertTransition(from: MarketingCampaignStatus, to: MarketingCampaignStatus) {
  if (!TRANSITIONS[from].includes(to)) throw new Error('INVALID_TRANSITION');
}

export async function listCampaigns(organizationId: string, storeId?: string) {
  const campaigns = await prisma.marketingCampaign.findMany({
    where: {
      organizationId,
      status: { not: 'ARCHIVED' },
      ...(storeId && { OR: [{ storeId }, { storeId: null }] }),
    },
    include: {
      audience: { select: { name: true } },
      promotion: { select: { name: true } },
      _count: { select: { conversions: true } },
      conversions: { select: { revenueMinor: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    status: c.status,
    channels: c.channels,
    audienceName: c.audience?.name ?? null,
    promotionName: c.promotion?.name ?? null,
    scheduledStart: c.scheduledStart?.toISOString() ?? null,
    scheduledEnd: c.scheduledEnd?.toISOString() ?? null,
    trackingCode: c.trackingCode,
    orderCount: c._count.conversions,
    revenueMinor: c.conversions.reduce((s, cv) => s + cv.revenueMinor, 0),
    conversionCount: c._count.conversions,
    updatedAt: c.updatedAt.toISOString(),
  }));
}

export async function getCampaign(organizationId: string, id: string) {
  const campaign = await prisma.marketingCampaign.findFirst({
    where: { id, organizationId },
    include: {
      audience: true,
      promotion: { include: { coupons: true } },
      events: { orderBy: { createdAt: 'desc' }, take: 50 },
      conversions: {
        orderBy: { attributedAt: 'desc' },
        take: 20,
        include: { campaign: false },
      },
      _count: { select: { conversions: true } },
    },
  });
  if (!campaign) throw new Error('NOT_FOUND');
  return campaign;
}

export async function createCampaign(
  organizationId: string,
  userId: string,
  input: {
    name: string;
    description?: string;
    audienceId?: string;
    promotionId?: string;
    messageTitle?: string;
    messageBody?: string;
    channels?: MarketingChannel[];
    scheduledStart?: string;
    scheduledEnd?: string;
    timezone?: string;
    storeId?: string;
    automationId?: string;
    status?: MarketingCampaignStatus;
  }
) {
  const campaign = await prisma.marketingCampaign.create({
    data: {
      organizationId,
      storeId: input.storeId,
      audienceId: input.audienceId,
      promotionId: input.promotionId,
      automationId: input.automationId,
      name: input.name,
      description: input.description,
      messageTitle: input.messageTitle,
      messageBody: input.messageBody,
      channels: input.channels ?? ['IN_APP'],
      trackingCode: generateTrackingCode(),
      status: input.status ?? 'DRAFT',
      scheduledStart: input.scheduledStart ? new Date(input.scheduledStart) : undefined,
      scheduledEnd: input.scheduledEnd ? new Date(input.scheduledEnd) : undefined,
      timezone: input.timezone ?? 'UTC',
      createdById: userId,
    },
  });

  await prisma.marketingCampaignEvent.create({
    data: {
      organizationId,
      campaignId: campaign.id,
      type: 'campaign.created',
      metadata: { name: campaign.name },
    },
  });

  await emitMarketingEvent({
    type: 'campaign.created',
    organizationId,
    userId,
    entityId: campaign.id,
    payload: { campaignId: campaign.id, status: campaign.status },
  });

  return campaign;
}

export async function updateCampaign(
  organizationId: string,
  id: string,
  userId: string,
  input: Partial<{
    name: string;
    description: string;
    audienceId: string;
    promotionId: string;
    messageTitle: string;
    messageBody: string;
    channels: MarketingChannel[];
    scheduledStart: string;
    scheduledEnd: string;
    timezone: string;
    costMinor: number;
  }>
) {
  const existing = await getCampaign(organizationId, id);
  if (!['DRAFT', 'SCHEDULED', 'PAUSED'].includes(existing.status)) {
    throw new Error('CAMPAIGN_LOCKED');
  }

  return prisma.marketingCampaign.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      audienceId: input.audienceId,
      promotionId: input.promotionId,
      messageTitle: input.messageTitle,
      messageBody: input.messageBody,
      channels: input.channels,
      scheduledStart: input.scheduledStart ? new Date(input.scheduledStart) : undefined,
      scheduledEnd: input.scheduledEnd ? new Date(input.scheduledEnd) : undefined,
      timezone: input.timezone,
      costMinor: input.costMinor,
    },
  });
}

async function recordCampaignEvent(
  organizationId: string,
  campaignId: string,
  type: string,
  metadata?: Prisma.InputJsonValue
) {
  await prisma.marketingCampaignEvent.create({
    data: { organizationId, campaignId, type, metadata },
  });
}

export async function transitionCampaign(
  organizationId: string,
  id: string,
  userId: string,
  to: MarketingCampaignStatus
) {
  const campaign = await getCampaign(organizationId, id);
  assertTransition(campaign.status, to);

  const now = new Date();
  const data: Prisma.MarketingCampaignUpdateInput = { status: to };
  if (to === 'ACTIVE') {
    data.startedAt = campaign.startedAt ?? now;
  }
  if (to === 'COMPLETED') {
    data.completedAt = now;
  }

  const updated = await prisma.marketingCampaign.update({ where: { id }, data });

  const eventType =
    to === 'ACTIVE'
      ? 'campaign.started'
      : to === 'PAUSED'
        ? 'campaign.paused'
        : to === 'COMPLETED'
          ? 'campaign.completed'
          : 'campaign.updated';

  await recordCampaignEvent(organizationId, id, eventType, { status: to });
  await emitMarketingEvent({
    type: eventType,
    organizationId,
    userId,
    entityId: id,
    payload: { campaignId: id, status: to },
  });

  return updated;
}

/** Activate scheduled campaigns whose start time has passed; complete expired ones. */
export async function processScheduledCampaigns() {
  const now = new Date();

  const toActivate = await prisma.marketingCampaign.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledStart: { lte: now },
    },
  });

  for (const c of toActivate) {
    await prisma.marketingCampaign.update({
      where: { id: c.id },
      data: { status: 'ACTIVE', startedAt: now },
    });
    await recordCampaignEvent(c.organizationId, c.id, 'campaign.started', { scheduled: true });
  }

  const toComplete = await prisma.marketingCampaign.findMany({
    where: {
      status: { in: ['ACTIVE', 'PAUSED'] },
      scheduledEnd: { lte: now },
    },
  });

  for (const c of toComplete) {
    await prisma.marketingCampaign.update({
      where: { id: c.id },
      data: { status: 'COMPLETED', completedAt: now },
    });
    await recordCampaignEvent(c.organizationId, c.id, 'campaign.completed', { scheduled: true });
  }

  return { activated: toActivate.length, completed: toComplete.length };
}

export async function resolveCampaignByTrackingCode(code: string) {
  return prisma.marketingCampaign.findFirst({
    where: { trackingCode: code.toUpperCase(), status: 'ACTIVE' },
    select: { id: true, organizationId: true, storeId: true, promotionId: true },
  });
}

export async function recordCampaignClick(
  organizationId: string,
  campaignId: string,
  metadata?: Record<string, unknown>
) {
  await recordCampaignEvent(organizationId, campaignId, 'campaign.clicked', metadata as Prisma.InputJsonValue);
  await emitMarketingEvent({
    type: 'campaign.clicked',
    organizationId,
    entityId: campaignId,
    payload: metadata,
  });
}
