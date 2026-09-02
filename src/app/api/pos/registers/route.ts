import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { ensureDefaultRegister, getOpenSession } from '@/server/services/pos-service';

export async function GET() {
  try {
    const ctx = await requireTenantContext('pos.read');
    if (!ctx.storeId || !ctx.branchId) {
      return Response.json({ error: 'NO_BRANCH_CONTEXT' }, { status: 400 });
    }

    const register = await ensureDefaultRegister(
      ctx.organizationId,
      ctx.storeId,
      ctx.branchId
    );
    const session = await getOpenSession({
      organizationId: ctx.organizationId,
      storeId: ctx.storeId,
      branchId: ctx.branchId,
      userId: ctx.userId,
      currency: ctx.currency,
    });

    return Response.json({ register, session });
  } catch (err) {
    return handleApiError(err);
  }
}
