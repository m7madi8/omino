import { NextResponse } from 'next/server';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { listActions } from '@/server/ai/action-service';

export async function GET() {
  try {
    const ctx = await requireTenantContext('ai.use');
    const actions = await listActions(ctx.organizationId);
    return NextResponse.json({
      actions: actions.map((a) => ({
        id: a.id,
        toolName: a.toolName,
        status: a.status,
        input: a.input,
        dryRunResult: a.dryRunResult,
        result: a.result,
        error: a.error,
        user: a.user,
        conversationTitle: a.conversation?.title,
        createdAt: a.createdAt.toISOString(),
        executedAt: a.executedAt?.toISOString() ?? null,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
