import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  createConversation,
  listConversations,
} from '@/server/ai/conversation-service';

const createSchema = z.object({
  title: z.string().optional(),
  agentType: z.enum(['ANALYST', 'OPERATIONS', 'CUSTOMER', 'GROWTH']).optional(),
});

export async function GET() {
  try {
    const ctx = await requireTenantContext('ai.use');
    const conversations = await listConversations(ctx.organizationId, ctx.userId);
    return NextResponse.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        agentType: c.agentType,
        updatedAt: c.updatedAt.toISOString(),
        messageCount: c._count.messages,
        lastMessage: c.messages[0]?.content?.slice(0, 120) ?? null,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext('ai.use');
    const body = createSchema.parse(await request.json().catch(() => ({})));
    const conversation = await createConversation({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      title: body.title,
      agentType: body.agentType,
    });
    return NextResponse.json({ conversation }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
