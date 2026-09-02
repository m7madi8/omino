import { prisma } from '@/lib/db';
import { calculateCartTotals } from '@/lib/pos/calculations';
import type { DiscountType, PromotionKind } from '@prisma/client';
import type { CouponValidationResult } from '@/types/marketing';

export type CartItemForPromotion = {
  productId: string;
  categoryId?: string | null;
  collectionIds?: string[];
  quantity: number;
  unitPriceMinor: number;
};

export function calculatePromotionDiscount(input: {
  promotionKind: PromotionKind;
  discountType: DiscountType;
  discountValue: number;
  items: CartItemForPromotion[];
  eligibleProductIds?: string[];
  eligibleCategoryIds?: string[];
  eligibleCollectionIds?: string[];
  subtotalMinor: number;
}): number {
  if (input.promotionKind === 'FREE_SHIPPING') return 0;

  let eligibleSubtotal = input.subtotalMinor;

  const hasRestrictions =
    (input.eligibleProductIds?.length ?? 0) > 0 ||
    (input.eligibleCategoryIds?.length ?? 0) > 0 ||
    (input.eligibleCollectionIds?.length ?? 0) > 0;

  if (hasRestrictions && input.items.length) {
    eligibleSubtotal = input.items
      .filter((item) => {
        if (input.eligibleProductIds?.includes(item.productId)) return true;
        if (item.categoryId && input.eligibleCategoryIds?.includes(item.categoryId)) return true;
        if (item.collectionIds?.some((id) => input.eligibleCollectionIds?.includes(id))) return true;
        return false;
      })
      .reduce((s, i) => s + i.unitPriceMinor * i.quantity, 0);
  }

  if (eligibleSubtotal <= 0) return 0;

  const totals = calculateCartTotals({
    items: [{ quantity: 1, unitPriceMinor: eligibleSubtotal }],
    discountType: input.discountType,
    discountValue: input.discountValue,
  });

  return totals.discountAmount;
}

export function applyFreeShipping(promotionKind: PromotionKind): boolean {
  return promotionKind === 'FREE_SHIPPING';
}

export async function resolveProductCollectionIds(
  organizationId: string,
  productIds: string[]
): Promise<Map<string, string[]>> {
  if (!productIds.length) return new Map();

  const links = await prisma.collectionProduct.findMany({
    where: {
      productId: { in: productIds },
      collection: { organizationId, deletedAt: null, status: 'ACTIVE' },
    },
    select: { productId: true, collectionId: true },
  });

  const map = new Map<string, string[]>();
  for (const link of links) {
    const list = map.get(link.productId) ?? [];
    list.push(link.collectionId);
    map.set(link.productId, list);
  }
  return map;
}

export function buildCouponValidationFromPromotion(
  promo: {
    id: string;
    discountType: DiscountType;
    discountValue: number;
    promotionKind: PromotionKind;
    productIds: string[];
    categoryIds: string[];
    collectionIds: string[];
  },
  coupon: { id: string; code: string },
  discountAmountMinor: number
): CouponValidationResult {
  return {
    valid: true,
    promotionId: promo.id,
    couponId: coupon.id,
    code: coupon.code,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    discountAmountMinor,
    freeShipping: promo.promotionKind === 'FREE_SHIPPING',
  };
}
