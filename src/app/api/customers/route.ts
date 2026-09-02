import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { createCustomer, findCustomerMatches } from '@/server/services/customer-service';
import { searchCustomers } from '@/server/services/customer-search-service';
import { exportCustomers } from '@/server/services/customer-timeline-service';
import { logAudit } from '@/server/services/audit-service';

const createSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
  source: z.enum(['POS', 'ONLINE_STORE', 'MANUAL', 'IMPORT', 'API']).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  skipDuplicateCheck: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const ctx = await requireTenantContext('customers.read');
    const { searchParams } = new URL(request.url);

    if (searchParams.get('export') === 'true') {
      const { assertPermission } = await import('@/lib/permissions/check');
      assertPermission(ctx.user, 'customers.export');
      const rows = await exportCustomers(ctx.organizationId);
      await logAudit({
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        action: 'CUSTOMER_EXPORT',
        entityType: 'Customer',
        metadata: { count: rows.length },
      });
      return NextResponse.json({ customers: rows });
    }

    if (searchParams.get('match') === 'true') {
      const email = searchParams.get('email') || undefined;
      const phone = searchParams.get('phone') || undefined;
      const name = searchParams.get('name') || undefined;
      const matches = await findCustomerMatches(ctx.organizationId, { email, phone, name });
      return NextResponse.json({ matches });
    }

    const result = await searchCustomers({
      organizationId: ctx.organizationId,
      search: searchParams.get('search') || searchParams.get('q') || undefined,
      status: (searchParams.get('status') as never) || undefined,
      source: (searchParams.get('source') as never) || undefined,
      tagId: searchParams.get('tagId') || undefined,
      sortBy: (searchParams.get('sortBy') as 'name' | 'createdAt') || undefined,
      sortDir: (searchParams.get('sortDir') as 'asc' | 'desc') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      pageSize: parseInt(searchParams.get('pageSize') || '25', 10),
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext('customers.write');
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const customer = await createCustomer(
      ctx.organizationId,
      ctx.userId,
      {
        ...parsed.data,
        email: parsed.data.email || undefined,
        source: parsed.data.source ?? 'MANUAL',
      },
      { skipDuplicateCheck: parsed.data.skipDuplicateCheck }
    );

    return NextResponse.json({ customer }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
