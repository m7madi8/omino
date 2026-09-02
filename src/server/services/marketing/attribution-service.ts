import { prisma } from '@/lib/db';
import { emitMarketingEvent } from '@/server/events/marketing-events';

/** Last-touch attribution: attribute order to most recent active campaign touch. */
export async function attributeOrderToCampaign(input: {
  organizationId: string;
  orderId: string;
  customerId?: string;
  revenueMinor: number;
  campaignId?: string;
  promotionId?: string;
  couponCode?: string;
}) {
  if (!input.campaignId) return null;

  const existing = await prisma.marketingConversion.findUnique({
    where: { orderId: input.orderId },
  });
  if (existing) return existing;

  const conversion = await prisma.marketingConversion.create({
    data: {
      organizationId: input.organizationId,
      campaignId: input.campaignId,
      customerId: input.customerId,
      orderId: input.orderId,
      promotionId: input.promotionId,
      couponCode: input.couponCode,
      revenueMinor: input.revenueMinor,
    },
  });

  await prisma.marketingCampaignEvent.create({
    data: {
      organizationId: input.organizationId,
      campaignId: input.campaignId,
      type: 'campaign.converted',
      metadata: { orderId: input.orderId, revenueMinor: input.revenueMinor },
    },
  });

  await emitMarketingEvent({
    type: 'campaign.converted',
    organizationId: input.organizationId,
    entityId: input.campaignId,
    payload: { orderId: input.orderId, revenueMinor: input.revenueMinor },
  });

  return conversion;
}

export async function getCampaignAttributionSummary(organizationId: string, campaignId: string) {
  const [conversions, revenue] = await Promise.all([
    prisma.marketingConversion.count({ where: { organizationId, campaignId } }),
    prisma.marketingConversion.aggregate({
      where: { organizationId, campaignId },
      _sum: { revenueMinor: true },
    }),
  ]);

  return {
    conversionCount: conversions,
    revenueMinor: revenue._sum.revenueMinor ?? 0,
  };
}
