import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  attachTagToCustomer,
  createCustomerTag,
  deleteCustomerTag,
  detachTagFromCustomer,
  listCustomerTags,
  renameCustomerTag,
} from '@/server/services/customer-tag-service';

export async function GET() {
  try {
    const ctx = await requireTenantContext('customers.read');
    const tags = await listCustomerTags(ctx.organizationId);
    return NextResponse.json({
      tags: tags.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        color: t.color,
        customerCount: t._count.assignments,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext('customers.manage_tags');
    const body = await request.json();

    if (body.action === 'create') {
      const data = z.object({ name: z.string().min(1), color: z.string().optional() }).parse(body);
      const tag = await createCustomerTag(ctx.organizationId, data);
      return NextResponse.json({ tag }, { status: 201 });
    }

    if (body.action === 'rename') {
      const data = z.object({ tagId: z.string().uuid(), name: z.string().min(1) }).parse(body);
      const tag = await renameCustomerTag(ctx.organizationId, data.tagId, data.name);
      return NextResponse.json({ tag });
    }

    if (body.action === 'delete') {
      const data = z.object({ tagId: z.string().uuid() }).parse(body);
      await deleteCustomerTag(ctx.organizationId, data.tagId);
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'attach') {
      const data = z.object({ customerId: z.string().uuid(), tagId: z.string().uuid() }).parse(body);
      await attachTagToCustomer(ctx.organizationId, data.customerId, data.tagId, ctx.userId);
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'detach') {
      const data = z.object({ customerId: z.string().uuid(), tagId: z.string().uuid() }).parse(body);
      await detachTagFromCustomer(ctx.organizationId, data.customerId, data.tagId, ctx.userId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }
    return handleApiError(err);
  }
}
