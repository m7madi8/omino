import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { updateBranch } from '@/server/services/branch-service';

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  address: z.string().max(500).optional().nullable(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantContext('settings.write');
    const { id } = await params;
    const body = updateSchema.parse(await request.json());
    const branch = await updateBranch(ctx.organizationId, id, body);
    return NextResponse.json({ branch });
  } catch (err) {
    return handleApiError(err);
  }
}
