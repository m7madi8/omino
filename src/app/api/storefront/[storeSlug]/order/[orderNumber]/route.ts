import { z } from 'zod';
import { handleStorefrontError } from '@/lib/api/storefront';
import { getPublicOrder } from '@/server/services/storefront-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storeSlug: string; orderNumber: string }> }
) {
  try {
    const { storeSlug, orderNumber } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (!token) {
      return Response.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }
    z.string().uuid().parse(token);

    const order = await getPublicOrder(storeSlug, orderNumber, token);
    return Response.json({ order });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }
    return handleStorefrontError(err);
  }
}
