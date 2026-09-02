import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { closePosSession, getOpenSession, openPosSession } from '@/server/services/pos-service';

function posCtx(ctx: Awaited<ReturnType<typeof requireTenantContext>>) {
  if (!ctx.storeId || !ctx.branchId) throw new Error('VALIDATION_ERROR');
  return {
    organizationId: ctx.organizationId,
    storeId: ctx.storeId,
    branchId: ctx.branchId,
    userId: ctx.userId,
    currency: ctx.currency,
  };
}

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext('pos.manage_sessions');
    const body = await request.json();
    const pctx = posCtx(ctx);

    if (body.action === 'close') {
      const data = z
        .object({ sessionId: z.string().uuid(), closingCash: z.number().int().min(0), notes: z.string().optional() })
        .parse(body);
      const session = await closePosSession(pctx, data.sessionId, {
        closingCash: data.closingCash,
        notes: data.notes,
      });
      return Response.json({ session });
    }

    const data = z
      .object({ openingCash: z.number().int().min(0).optional(), notes: z.string().optional() })
      .parse(body);
    const session = await openPosSession(pctx, data);
    return Response.json({ session });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }
    return handleApiError(err);
  }
}

export async function GET() {
  try {
    const ctx = await requireTenantContext('pos.read');
    const session = await getOpenSession(posCtx(ctx));
    return Response.json({ session });
  } catch (err) {
    return handleApiError(err);
  }
}
