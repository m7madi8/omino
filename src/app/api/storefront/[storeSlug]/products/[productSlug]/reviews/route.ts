import { z } from 'zod';
import { cookies } from 'next/headers';
import { handleApiError } from '@/lib/api/tenant';
import { resolveStoreByPublicSlug } from '@/server/services/storefront-service';
import { createProductReview, listProductReviews, getProductReviewSummary } from '@/server/services/review-service';
import { SESSION_COOKIE } from '@/server/services/storefront-customer-auth-service';
import { prisma } from '@/lib/db';
import { emitStorefrontEvent } from '@/server/events/storefront-events';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeSlug: string; productSlug: string }> }
) {
  try {
    const { storeSlug, productSlug } = await params;
    const store = await resolveStoreByPublicSlug(storeSlug);
    const product = await prisma.product.findFirst({
      where: {
        organizationId: store.organizationId,
        slug: productSlug,
        deletedAt: null,
        status: 'ACTIVE',
      },
    });
    if (!product) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });

    const [reviews, summary] = await Promise.all([
      listProductReviews(store.organizationId, product.id, { status: 'PUBLISHED' }),
      getProductReviewSummary(store.organizationId, product.id),
    ]);

    return Response.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        verifiedPurchase: r.verifiedPurchase,
        customerName: r.customer?.name?.split(' ')[0] ?? 'Customer',
        createdAt: r.createdAt.toISOString(),
      })),
      summary,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ storeSlug: string; productSlug: string }> }
) {
  try {
    const { storeSlug, productSlug } = await params;
    const store = await resolveStoreByPublicSlug(storeSlug);
    const cookieStore = await cookies();
    const accountId = cookieStore.get(`${SESSION_COOKIE}_${store.id}`)?.value;

    const account = accountId
      ? await prisma.storefrontAccount.findFirst({
          where: { id: accountId, storeId: store.id },
        })
      : null;

    const product = await prisma.product.findFirst({
      where: {
        organizationId: store.organizationId,
        slug: productSlug,
        deletedAt: null,
      },
    });
    if (!product) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });

    const body = await request.json();
    const data = z
      .object({
        rating: z.number().int().min(1).max(5),
        title: z.string().max(120).optional(),
        body: z.string().max(2000).optional(),
        orderId: z.string().uuid().optional(),
      })
      .parse(body);

    const review = await createProductReview({
      organizationId: store.organizationId,
      storeId: store.id,
      productId: product.id,
      customerId: account?.customerId,
      orderId: data.orderId,
      rating: data.rating,
      title: data.title,
      body: data.body,
    });

    await emitStorefrontEvent({
      type: 'REVIEW_CREATED',
      organizationId: store.organizationId,
      storeId: store.id,
      productId: product.id,
      payload: { reviewId: review.id },
    });

    return Response.json({ review: { id: review.id, status: review.status } }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }
    return handleApiError(err);
  }
}
