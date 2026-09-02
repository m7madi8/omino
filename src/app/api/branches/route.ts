import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { createBranch, listBranchesForStore } from '@/server/services/branch-service';

const createSchema = z.object({
  storeId: z.string().uuid(),
  name: z.string().min(1).max(120),
  address: z.string().max(500).optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const ctx = await requireTenantContext('settings.read');
    const storeId = new URL(request.url).searchParams.get('storeId');
    if (!storeId) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'storeId required' }, { status: 400 });
    }

    const branches = await listBranchesForStore(ctx.organizationId, storeId);
    return NextResponse.json({ branches });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext('settings.write');
    const body = createSchema.parse(await request.json());
    const branch = await createBranch(ctx.organizationId, body.storeId, {
      name: body.name,
      address: body.address,
    });
    return NextResponse.json({ branch }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
