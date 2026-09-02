import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { getConversation } from '@/server/ai/conversation-service';
import { runOrchestrator } from '@/server/ai/orchestrator';
import type { ToolExecutionContext } from '@/types/ai';

const messageSchema = z.object({
  message: z.string().min(1).max(4000),
  context: z
    .object({
      page: z.string().optional(),
      entityType: z.string().optional(),
      entityId: z.string().optional(),
    })
    .optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

function mapAiError(err: unknown): { status: number; error: string } | null {
  if (!(err instanceof Error)) return null;
  const map: Record<string, { status: number; error: string }> = {
    AI_DISABLED: { status: 503, error: 'AI_DISABLED' },
    RATE_LIMITED: { status: 429, error: 'RATE_LIMITED' },
    AI_NOT_CONFIGURED: { status: 503, error: 'AI_NOT_CONFIGURED' },
    AI_AUTH_ERROR: { status: 503, error: 'AI_AUTH_ERROR' },
    AI_RATE_LIMITED: { status: 429, error: 'AI_RATE_LIMITED' },
    AI_TIMEOUT: { status: 504, error: 'AI_TIMEOUT' },
    AI_UNAVAILABLE: { status: 503, error: 'AI_UNAVAILABLE' },
    AI_PROVIDER_ERROR: { status: 502, error: 'AI_PROVIDER_ERROR' },
  };
  return map[err.message] ?? null;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireTenantContext('ai.use');
    const { id } = await params;
    const stream = new URL(request.url).searchParams.get('stream') === 'true';

    await getConversation(ctx.organizationId, ctx.userId, id);

    const body = messageSchema.parse(await request.json());

    const toolCtx: ToolExecutionContext = {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      storeId: ctx.storeId,
      branchId: ctx.branchId,
      currency: ctx.currency,
      permissions: ctx.user.permissions,
      conversationId: id,
    };

    if (!stream) {
      const result = await runOrchestrator({
        ctx: toolCtx,
        input: {
          conversationId: id,
          message: body.message,
          context: body.context,
        },
      });
      return NextResponse.json({ result });
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          const result = await runOrchestrator({
            ctx: toolCtx,
            input: {
              conversationId: id,
              message: body.message,
              context: body.context,
            },
            onProgress: (progress) => send(progress.type, progress),
          });
          send('done', { result });
        } catch (err) {
          const mapped = mapAiError(err);
          send('error', mapped ?? { error: 'UNKNOWN_ERROR' });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    const mapped = mapAiError(err);
    if (mapped) {
      return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    }
    return handleApiError(err);
  }
}
