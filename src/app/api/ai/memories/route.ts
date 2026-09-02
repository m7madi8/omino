import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  deleteMemory,
  listMemories,
  upsertMemory,
} from '@/server/ai/memory-service';
import { getUsageSummary } from '@/server/ai/usage-service';
import { isAiConfigured } from '@/server/ai/config';

export async function GET() {
  try {
    const ctx = await requireTenantContext('ai.use');
    const [memories, usage] = await Promise.all([
      listMemories(ctx.organizationId, ctx.userId),
      getUsageSummary(ctx.organizationId),
    ]);
    return NextResponse.json({
      memories,
      usage,
      configured: isAiConfigured(),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const memorySchema = z.object({
  category: z.enum(['BUSINESS', 'OPERATIONAL', 'AI_PREFERENCE']),
  key: z.string().min(1).max(100),
  value: z.string().min(1).max(2000),
});

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext('ai.use');
    const body = memorySchema.parse(await request.json());
    const memory = await upsertMemory({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      ...body,
    });
    return NextResponse.json({ memory }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await requireTenantContext('ai.use');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }
    await deleteMemory(ctx.organizationId, id, ctx.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
