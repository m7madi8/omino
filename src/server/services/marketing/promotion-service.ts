import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import type { DiscountType, MarketingPromotionStatus } from '@prisma/client';
import { calculateCartTotals } from '@/lib/pos/calculations';
import { countAudienceMembers, customerMatchesAudience } from '@/lib/marketing/segment-rules';
import type { CouponValidationResult, SegmentRuleGroup } from '@/types/marketing';
import { emitMarketingEvent } from '@/server/events/marketing-events';
import {
  calculatePromotionDiscount,
  resolveProductCollectionIds,
  buildCouponValidationFromPromotion,
} from '@/server/services/promotion-engine';

export async function listPromotions(organizationId: string, storeId?: string) {
  const promotions = await prisma.marketingPromotion.findMany({
    where: {
      organizationId,
      ...(storeId && { OR: [{ storeId }, { storeId: null }] }),
      status: { not: 'ARCHIVED' },
    },
    include: { coupons: { select: { code: true, usageCount: true } }, _count: { select: { redemptions: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  return promotions.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    discountType: p.discountType,
    discountValue: p.discountValue,
    status: p.status,
    startsAt: p.startsAt?.toISOString() ?? null,
    endsAt: p.endsAt?.toISOString() ?? null,
    usageCount: p._count.redemptions,
    couponCodes: p.coupons.map((c) => c.code),
    createdAt: p.createdAt.toISOString(),
  }));
}

export async function getPromotion(organizationId: string, id: string) {
  const p = await prisma.marketingPromotion.findFirst({
    where: { id, organizationId },
    include: { coupons: true, _count: { select: { redemptions: true } } },
  });
  if (!p) throw new Error('NOT_FOUND');
  return p;
}

export async function createPromotion(
  organizationId: string,
  userId: string,
  input: {
    name: string;
    description?: string;
    discountType: DiscountType;
    discountValue: number;
    minOrderMinor?: number;
    productIds?: string[];
    categoryIds?: string[];
    collectionIds?: string[];
    promotionKind?: import('@prisma/client').PromotionKind;
    customerTagIds?: string[];
    audienceId?: string;
    usageLimit?: number;
    perCustomerLimit?: number;
    startsAt?: string;
    endsAt?: string;
    storeId?: string;
    couponCode?: string;
    status?: MarketingPromotionStatus;
  }
) {
  const promotion = await prisma.$transaction(async (tx) => {
    const created = await tx.marketingPromotion.create({
      data: {
        organizationId,
        storeId: input.storeId,
        name: input.name,
        description: input.description,
        discountType: input.discountType,
        discountValue:
          input.discountType === 'PERCENT'
            ? Math.min(input.discountValue, 10000)
            : input.discountValue,
        minOrderMinor: input.minOrderMinor,
        productIds: input.productIds ?? [],
        categoryIds: input.categoryIds ?? [],
        collectionIds: input.collectionIds ?? [],
        promotionKind: input.promotionKind ?? 'PERCENT_OFF',
        customerTagIds: input.customerTagIds ?? [],
        audienceId: input.audienceId,
        usageLimit: input.usageLimit,
        perCustomerLimit: input.perCustomerLimit,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
        endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
        status: input.status ?? 'DRAFT',
        createdById: userId,
      },
    });

    if (input.couponCode) {
      await tx.marketingCoupon.create({
        data: {
          organizationId,
          promotionId: created.id,
          code: input.couponCode.toUpperCase().trim(),
          usageLimit: input.usageLimit,
        },
      });
    }

    return created;
  });

  await emitMarketingEvent({
    type: 'promotion.created',
    organizationId,
    userId,
    entityId: promotion.id,
    payload: { promotionId: promotion.id, name: promotion.name },
  });

  return promotion;
}

export async function updatePromotionStatus(
  organizationId: string,
  id: string,
  status: MarketingPromotionStatus,
  userId: string
) {
  const p = await prisma.marketingPromotion.updateMany({
    where: { id, organizationId },
    data: { status },
  });
  if (!p.count) throw new Error('NOT_FOUND');

  await emitMarketingEvent({
    type: status === 'ACTIVE' ? 'promotion.activated' : 'promotion.updated',
    organizationId,
    userId,
    entityId: id,
    payload: { promotionId: id, status },
  });
}

function promotionIsActive(p: {
  status: MarketingPromotionStatus;
  startsAt: Date | null;
  endsAt: Date | null;
}) {
  const now = new Date();
  if (p.status !== 'ACTIVE') return false;
  if (p.startsAt && p.startsAt > now) return false;
  if (p.endsAt && p.endsAt < now) return false;
  return true;
}

export async function validateCoupon(input: {
  organizationId: string;
  code: string;
  subtotalMinor: number;
  customerId?: string;
  storeId?: string;
  productIds?: string[];
  categoryIds?: string[];
  items?: { productId: string; categoryId?: string | null; quantity: number; unitPriceMinor: number }[];
}): Promise<CouponValidationResult> {
  const code = input.code.toUpperCase().trim();
  const coupon = await prisma.marketingCoupon.findFirst({
    where: { organizationId: input.organizationId, code, isActive: true },
    include: { promotion: { include: { _count: { select: { redemptions: true } } } } },
  });

  if (!coupon) return { valid: false, error: 'INVALID_CODE' };
  const promo = coupon.promotion;

  if (!promotionIsActive(promo)) return { valid: false, error: 'PROMOTION_INACTIVE' };
  if (promo.storeId && input.storeId && promo.storeId !== input.storeId) {
    return { valid: false, error: 'STORE_NOT_ELIGIBLE' };
  }
  if (promo.minOrderMinor && input.subtotalMinor < promo.minOrderMinor) {
    return { valid: false, error: 'MIN_ORDER_NOT_MET' };
  }

  const totalUsage = promo._count.redemptions;
  if (promo.usageLimit != null && totalUsage >= promo.usageLimit) {
    return { valid: false, error: 'USAGE_LIMIT_REACHED' };
  }
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    return { valid: false, error: 'COUPON_LIMIT_REACHED' };
  }

  if (input.customerId && promo.perCustomerLimit) {
    const customerUses = await prisma.marketingPromotionRedemption.count({
      where: { promotionId: promo.id, customerId: input.customerId },
    });
    if (customerUses >= promo.perCustomerLimit) {
      return { valid: false, error: 'CUSTOMER_LIMIT_REACHED' };
    }
  }

  if (promo.customerTagIds.length && input.customerId) {
    const hasTag = await prisma.customerTagAssignment.count({
      where: { customerId: input.customerId, tagId: { in: promo.customerTagIds } },
    });
    if (!hasTag) return { valid: false, error: 'CUSTOMER_NOT_ELIGIBLE' };
  }

  if (promo.audienceId && input.customerId) {
    const audience = await prisma.marketingAudience.findFirst({
      where: { id: promo.audienceId, organizationId: input.organizationId },
    });
    if (audience) {
      const matches = await customerMatchesAudience(
        input.organizationId,
        input.customerId,
        audience.rules as SegmentRuleGroup,
        promo.storeId ?? undefined
      );
      if (!matches) return { valid: false, error: 'CUSTOMER_NOT_IN_AUDIENCE' };
    }
  }

  if (promo.productIds.length && input.items?.length) {
    const cartProductIds = new Set(input.items.map((i) => i.productId));
    const eligible = promo.productIds.some((id) => cartProductIds.has(id));
    if (!eligible) return { valid: false, error: 'PRODUCT_NOT_ELIGIBLE' };
  }

  if (promo.categoryIds.length && input.items?.length) {
    const cartCats = new Set(input.items.map((i) => i.categoryId).filter(Boolean));
    const eligible = promo.categoryIds.some((id) => cartCats.has(id));
    if (!eligible) return { valid: false, error: 'CATEGORY_NOT_ELIGIBLE' };
  }

  const productIds = input.items?.map((i) => i.productId) ?? [];
  const collectionMap = await resolveProductCollectionIds(input.organizationId, productIds);

  if (promo.collectionIds.length && input.items?.length) {
    const eligible = input.items.some((item) => {
      const cols = collectionMap.get(item.productId) ?? [];
      return promo.collectionIds.some((id) => cols.includes(id));
    });
    if (!eligible) return { valid: false, error: 'COLLECTION_NOT_ELIGIBLE' };
  }

  const cartItems = (input.items ?? []).map((i) => ({
    productId: i.productId,
    categoryId: i.categoryId,
    collectionIds: collectionMap.get(i.productId) ?? [],
    quantity: i.quantity,
    unitPriceMinor: i.unitPriceMinor,
  }));

  const discountAmountMinor =
    promo.promotionKind === 'FREE_SHIPPING'
      ? 0
      : calculatePromotionDiscount({
          promotionKind: promo.promotionKind,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          items: cartItems,
          eligibleProductIds: promo.productIds,
          eligibleCategoryIds: promo.categoryIds,
          eligibleCollectionIds: promo.collectionIds,
          subtotalMinor: input.subtotalMinor,
        });

  return buildCouponValidationFromPromotion(
    {
      id: promo.id,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      promotionKind: promo.promotionKind,
      productIds: promo.productIds,
      categoryIds: promo.categoryIds,
      collectionIds: promo.collectionIds,
    },
    { id: coupon.id, code },
    discountAmountMinor
  );
}

export async function recordPromotionRedemption(input: {
  organizationId: string;
  promotionId: string;
  couponId?: string;
  orderId: string;
  customerId?: string;
  discountMinor: number;
  userId?: string;
}) {
  await prisma.$transaction(async (tx) => {
    await tx.marketingPromotionRedemption.create({
      data: {
        organizationId: input.organizationId,
        promotionId: input.promotionId,
        couponId: input.couponId,
        orderId: input.orderId,
        customerId: input.customerId,
        discountMinor: input.discountMinor,
      },
    });
    if (input.couponId) {
      await tx.marketingCoupon.update({
        where: { id: input.couponId },
        data: { usageCount: { increment: 1 } },
      });
    }
  });

  await emitMarketingEvent({
    type: 'promotion.redeemed',
    organizationId: input.organizationId,
    userId: input.userId,
    entityId: input.promotionId,
    payload: { orderId: input.orderId, discountMinor: input.discountMinor },
  });
}

export function generateTrackingCode() {
  return randomBytes(6).toString('hex').toUpperCase();
}

export async function applyCouponToCart(input: {
  cartId: string;
  organizationId: string;
  code: string;
  customerId?: string;
  storeId: string;
}) {
  const cart = await prisma.cart.findFirst({
    where: { id: input.cartId, organizationId: input.organizationId, status: 'ACTIVE' },
    include: {
      items: { include: { product: { select: { categoryId: true } } } },
    },
  });
  if (!cart) throw new Error('NOT_FOUND');

  const subtotalMinor = cart.items.reduce(
    (s, i) => s + i.unitPriceMinor * i.quantity - i.discountAmount,
    0
  );

  const validation = await validateCoupon({
    organizationId: input.organizationId,
    code: input.code,
    subtotalMinor,
    customerId: input.customerId ?? cart.customerId ?? undefined,
    storeId: input.storeId,
    items: cart.items.map((i) => ({
      productId: i.productId,
      categoryId: i.product.categoryId,
      quantity: i.quantity,
      unitPriceMinor: i.unitPriceMinor,
    })),
  });

  if (!validation.valid) throw new Error(validation.error);

  const updated = await prisma.cart.update({
    where: { id: cart.id },
    data: {
      couponCode: validation.code,
      promotionId: validation.promotionId,
      discountType: validation.discountType,
      discountValue: validation.discountValue,
      discountAmount: validation.discountAmountMinor,
    },
    include: { items: true },
  });

  return { cart: updated, validation };
}

export async function removeCouponFromCart(cartId: string, organizationId: string) {
  return prisma.cart.update({
    where: { id: cartId },
    data: {
      couponCode: null,
      promotionId: null,
      discountType: null,
      discountValue: null,
      discountAmount: 0,
    },
  });
}
