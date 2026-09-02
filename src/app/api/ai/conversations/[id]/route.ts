import { NextResponse } from 'next/server';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  deleteConversation,
  getConversation,
} from '@/server/ai/conversation-service';
import { getPendingActionsForConversation } from '@/server/ai/action-service';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireTenantContext('ai.use');
    const { id } = await params;
    const conversation = await getConversation(
      ctx.organizationId,
      ctx.userId,
      id
    );
    const pendingActions = await getPendingActionsForConversation(
      ctx.organizationId,
      id
    );
    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        agentType: conversation.agentType,
        messages: conversation.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
          metadata: m.metadata,
        })),
        toolCalls: conversation.toolCalls.map((t) => ({
          id: t.id,
          toolName: t.toolName,
          status: t.status,
          risk: t.risk,
          createdAt: t.createdAt.toISOString(),
        })),
        pendingActions,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireTenantContext('ai.use');
    const { id } = await params;
    await deleteConversation(ctx.organizationId, ctx.userId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
