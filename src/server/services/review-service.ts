import { prisma } from '@/lib/db';
import type { ReviewStatus } from '@prisma/client';

export async function listProductReviews(
  organizationId: string,
  productId: string,
  options?: { status?: ReviewStatus; limit?: number }
) {
  return prisma.productReview.findMany({
    where: {
      organizationId,
      productId,
      ...(options?.status ? { status: options.status } : { status: 'PUBLISHED' }),
    },
    include: {
      customer: { select: { name: true } },
      media: { orderBy: { position: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit ?? 20,
  });
}

export async function getProductReviewSummary(organizationId: string, productId: string) {
  const reviews = await prisma.productReview.findMany({
    where: { organizationId, productId, status: 'PUBLISHED' },
    select: { rating: true },
  });

  if (!reviews.length) {
    return { averageRating: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of reviews) {
    sum += r.rating;
    const key = Math.min(5, Math.max(1, r.rating)) as 1 | 2 | 3 | 4 | 5;
    distribution[key] += 1;
  }

  return {
    averageRating: Math.round((sum / reviews.length) * 10) / 10,
    count: reviews.length,
    distribution,
  };
}

export async function createProductReview(input: {
  organizationId: string;
  storeId: string;
  productId: string;
  customerId?: string;
  orderId?: string;
  rating: number;
  title?: string;
  body?: string;
}) {
  if (input.rating < 1 || input.rating > 5) throw new Error('INVALID_RATING');

  let verifiedPurchase = false;
  if (input.orderId && input.customerId) {
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        orderId: input.orderId,
        productId: input.productId,
        order: { customerId: input.customerId, organizationId: input.organizationId },
      },
    });
    verifiedPurchase = Boolean(orderItem);
  }

  return prisma.productReview.create({
    data: {
      organizationId: input.organizationId,
      storeId: input.storeId,
      productId: input.productId,
      customerId: input.customerId,
      orderId: input.orderId,
      rating: input.rating,
      title: input.title,
      body: input.body,
      verifiedPurchase,
      status: 'PENDING',
    },
  });
}

export async function listReviewsForModeration(
  organizationId: string,
  options?: { storeId?: string; status?: ReviewStatus }
) {
  return prisma.productReview.findMany({
    where: {
      organizationId,
      ...(options?.storeId && { storeId: options.storeId }),
      ...(options?.status ? { status: options.status } : { status: 'PENDING' }),
    },
    include: {
      product: { select: { name: true, slug: true } },
      customer: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function moderateReview(
  organizationId: string,
  reviewId: string,
  status: ReviewStatus
) {
  const review = await prisma.productReview.findFirst({
    where: { id: reviewId, organizationId },
  });
  if (!review) throw new Error('NOT_FOUND');
  return prisma.productReview.update({
    where: { id: reviewId },
    data: { status },
  });
}
