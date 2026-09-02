import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { SegmentRuleGroup } from '@/types/marketing';
import { countAudienceMembers, listAudienceMemberIds } from '@/lib/marketing/segment-rules';
import { emitMarketingEvent } from '@/server/events/marketing-events';

export async function listAudiences(organizationId: string, storeId?: string) {
  const audiences = await prisma.marketingAudience.findMany({
    where: {
      organizationId,
      isArchived: false,
      ...(storeId && { OR: [{ storeId }, { storeId: null }] }),
    },
    orderBy: { updatedAt: 'desc' },
  });

  return audiences.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    estimatedCount: a.estimatedCount,
    isArchived: a.isArchived,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));
}

export async function getAudience(organizationId: string, id: string) {
  const audience = await prisma.marketingAudience.findFirst({
    where: { id, organizationId },
  });
  if (!audience) throw new Error('NOT_FOUND');
  return audience;
}

export async function createAudience(
  organizationId: string,
  userId: string,
  input: {
    name: string;
    description?: string;
    rules: SegmentRuleGroup;
    storeId?: string;
  }
) {
  const count = await countAudienceMembers(organizationId, input.rules, input.storeId);

  const audience = await prisma.marketingAudience.create({
    data: {
      organizationId,
      storeId: input.storeId,
      name: input.name,
      description: input.description,
      rules: input.rules as Prisma.InputJsonValue,
      estimatedCount: count,
      createdById: userId,
    },
  });

  await emitMarketingEvent({
    type: 'campaign.audience_created',
    organizationId,
    userId,
    entityId: audience.id,
    payload: { audienceId: audience.id, estimatedCount: count },
  });

  return audience;
}

export async function updateAudience(
  organizationId: string,
  id: string,
  userId: string,
  input: { name?: string; description?: string; rules?: SegmentRuleGroup }
) {
  const existing = await getAudience(organizationId, id);
  const rules = (input.rules ?? existing.rules) as SegmentRuleGroup;
  const count = await countAudienceMembers(organizationId, rules, existing.storeId ?? undefined);

  const audience = await prisma.marketingAudience.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      rules: input.rules ? (input.rules as Prisma.InputJsonValue) : undefined,
      estimatedCount: count,
    },
  });

  return audience;
}

export async function refreshAudienceCount(organizationId: string, id: string) {
  const audience = await getAudience(organizationId, id);
  const count = await countAudienceMembers(
    organizationId,
    audience.rules as SegmentRuleGroup,
    audience.storeId ?? undefined
  );
  await prisma.marketingAudience.update({
    where: { id },
    data: { estimatedCount: count },
  });
  return count;
}

export async function getAudienceSample(organizationId: string, id: string, limit = 10) {
  const audience = await getAudience(organizationId, id);
  const memberIds = await listAudienceMemberIds(
    organizationId,
    audience.rules as SegmentRuleGroup,
    audience.storeId ?? undefined,
    limit
  );
  if (!memberIds.length) return [];

  return prisma.customer.findMany({
    where: { id: { in: memberIds }, organizationId },
    select: { id: true, name: true, email: true, status: true, source: true },
  });
}

export async function archiveAudience(organizationId: string, id: string) {
  const result = await prisma.marketingAudience.updateMany({
    where: { id, organizationId },
    data: { isArchived: true },
  });
  if (!result.count) throw new Error('NOT_FOUND');
}
