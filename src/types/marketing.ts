import type { DiscountType, MarketingCampaignStatus, MarketingChannel, MarketingPromotionStatus } from '@prisma/client';

export type SegmentRuleOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'in'
  | 'not_in';

export type SegmentRule = {
  field: string;
  operator: SegmentRuleOperator;
  value: string | number | boolean | string[];
};

export type SegmentRuleGroup = {
  logic: 'AND' | 'OR';
  rules: (SegmentRule | SegmentRuleGroup)[];
};

export type AudienceSummary = {
  id: string;
  name: string;
  description: string | null;
  estimatedCount: number | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PromotionSummary = {
  id: string;
  name: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  status: MarketingPromotionStatus;
  startsAt: string | null;
  endsAt: string | null;
  usageCount: number;
  couponCodes: string[];
  createdAt: string;
};

export type CampaignSummary = {
  id: string;
  name: string;
  description: string | null;
  status: MarketingCampaignStatus;
  channels: MarketingChannel[];
  audienceName: string | null;
  promotionName: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  trackingCode: string | null;
  orderCount: number;
  revenueMinor: number;
  conversionCount: number;
  updatedAt: string;
};

export type MarketingOverview = {
  activeCampaigns: number;
  draftCampaigns: number;
  totalAudience: number;
  attributedOrders: number;
  attributedRevenueMinor: number;
  conversionRate: number;
  topCampaign: CampaignSummary | null;
  recentActivity: { type: string; message: string; createdAt: string }[];
};

export type CouponValidationResult =
  | {
      valid: true;
      promotionId: string;
      couponId: string;
      code: string;
      discountType: DiscountType;
      discountValue: number;
      discountAmountMinor: number;
      freeShipping?: boolean;
    }
  | { valid: false; error: string };

export type CampaignTemplate = {
  id: string;
  name: string;
  description: string;
  audienceRules: SegmentRuleGroup;
  suggestedPromotion?: {
    name: string;
    discountType: DiscountType;
    discountValue: number;
  };
};
