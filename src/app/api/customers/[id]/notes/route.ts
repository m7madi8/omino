import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { createCustomerNote } from '@/server/services/customer-timeline-service';

const noteSchema = z.object({
  content: z.string().min(1).max(5000),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantContext('customers.read');
    const { id } = await params;
    const { listCustomerNotes } = await import('@/server/services/customer-timeline-service');
    const notes = await listCustomerNotes(ctx.organizationId, id);
    return NextResponse.json({
      notes: notes.map((n) => ({
        id: n.id,
        content: n.content,
        authorName: n.author.fullName || n.author.email,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantContext('customers.manage_notes');
    const { id } = await params;
    const parsed = noteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const note = await createCustomerNote(
      ctx.organizationId,
      id,
      ctx.userId,
      parsed.data.content
    );
    return NextResponse.json({ note }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
