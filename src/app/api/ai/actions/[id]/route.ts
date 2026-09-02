import { NextResponse } from 'next/server';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  cancelAction,
  confirmAction,
  getAction,
} from '@/server/ai/action-service';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireTenantContext('ai.use');
    const { id } = await params;
    const action = await getAction(ctx.organizationId, id);
    return NextResponse.json({ action });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireTenantContext('ai.execute');
    const { id } = await params;
    const body = (await request.json()) as { action?: 'confirm' | 'cancel' };

    const action = await getAction(ctx.organizationId, id);

    if (body.action === 'cancel') {
      const cancelled = await cancelAction(ctx.organizationId, ctx.userId, id);
      return NextResponse.json({ action: cancelled });
    }

    const confirmed = await confirmAction({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      actionId: id,
      permissions: ctx.user.permissions,
      conversationId: action.conversationId ?? '',
      storeId: ctx.storeId,
      branchId: ctx.branchId,
      currency: ctx.currency,
    });

    return NextResponse.json({ action: confirmed });
  } catch (err) {
    return handleApiError(err);
  }
}
