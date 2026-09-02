import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  archiveCustomer,
  updateCustomer,
} from '@/server/services/customer-service';
import { getCustomerDetail } from '@/server/services/customer-timeline-service';
import { getCustomerContext } from '@/server/services/customer-metrics-service';

const updateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantContext('customers.read');
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    if (searchParams.get('context') === 'ai') {
      const context = await getCustomerContext(ctx.organizationId, id);
      return NextResponse.json(context);
    }

    const customer = await getCustomerDetail(ctx.organizationId, id);
    return NextResponse.json(customer);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantContext('customers.write');
    const { id } = await params;
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const customer = await updateCustomer(ctx.organizationId, id, ctx.userId, {
      ...parsed.data,
      email: parsed.data.email || undefined,
    });
    return NextResponse.json({ customer });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantContext('customers.delete');
    const { id } = await params;
    await archiveCustomer(ctx.organizationId, id, ctx.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
