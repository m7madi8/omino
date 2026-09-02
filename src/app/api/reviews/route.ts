import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { listReviewsForModeration, moderateReview } from '@/server/services/review-service';

export async function GET(request: Request) {
  try {
    const ctx = await requireTenantContext('products.read');
    const url = new URL(request.url);
    const status = url.searchParams.get('status') as 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'HIDDEN' | null;
    const reviews = await listReviewsForModeration(ctx.organizationId, {
      storeId: ctx.storeId ?? undefined,
      status: status ?? undefined,
    });
    return Response.json({ reviews });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireTenantContext('products.write');
    const body = await request.json();
    const { reviewId, status } = z
      .object({
        reviewId: z.string().uuid(),
        status: z.enum(['PENDING', 'PUBLISHED', 'REJECTED', 'HIDDEN']),
      })
      .parse(body);
    const review = await moderateReview(ctx.organizationId, reviewId, status);
    return Response.json({ review });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }
    return handleApiError(err);
  }
}
