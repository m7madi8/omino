import { prisma } from '@/lib/db';
import type { MarketingOverview } from '@/types/marketing';
import { listCampaigns } from '@/server/services/marketing/campaign-service';

export async function getMarketingOverview(
  organizationId: string,
  storeId?: string
): Promise<MarketingOverview> {
  const campaignWhere = {
    organizationId,
    ...(storeId && { OR: [{ storeId }, { storeId: null }] }),
  };

  const [
    activeCampaigns,
    draftCampaigns,
    audienceSum,
    conversions,
    revenueAgg,
    recentEvents,
    campaigns,
  ] = await Promise.all([
    prisma.marketingCampaign.count({ where: { ...campaignWhere, status: 'ACTIVE' } }),
    prisma.marketingCampaign.count({ where: { ...campaignWhere, status: 'DRAFT' } }),
    prisma.marketingAudience.aggregate({
      where: { organizationId, isArchived: false },
      _sum: { estimatedCount: true },
    }),
    prisma.marketingConversion.count({ where: { organizationId } }),
    prisma.marketingConversion.aggregate({
      where: { organizationId },
      _sum: { revenueMinor: true },
    }),
    prisma.marketingCampaignEvent.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { campaign: { select: { name: true } } },
    }),
    listCampaigns(organizationId, storeId),
  ]);

  const attributedRevenueMinor = revenueAgg._sum.revenueMinor ?? 0;
  const topCampaign =
    campaigns.length > 0
      ? [...campaigns].sort((a, b) => b.revenueMinor - a.revenueMinor)[0]
      : null;

  const totalAudience = audienceSum._sum.estimatedCount ?? 0;
  const conversionRate =
    totalAudience > 0 ? Math.round((conversions / totalAudience) * 10000) / 100 : 0;

  return {
    activeCampaigns,
    draftCampaigns,
    totalAudience,
    attributedOrders: conversions,
    attributedRevenueMinor,
    conversionRate,
    topCampaign,
    recentActivity: recentEvents.map((e) => ({
      type: e.type,
      message: `${e.campaign.name}: ${e.type.replace('campaign.', '')}`,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}

export async function getPromotionUsageStats(organizationId: string, promotionId: string) {
  const [redemptions, revenue] = await Promise.all([
    prisma.marketingPromotionRedemption.count({ where: { organizationId, promotionId } }),
    prisma.marketingPromotionRedemption.aggregate({
      where: { organizationId, promotionId },
      _sum: { discountMinor: true },
    }),
  ]);

  return {
    redemptionCount: redemptions,
    totalDiscountMinor: revenue._sum.discountMinor ?? 0,
  };
}
