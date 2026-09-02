import { NextResponse } from 'next/server';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  getAudience,
  updateAudience,
  archiveAudience,
  getAudienceSample,
  refreshAudienceCount,
} from '@/server/services/marketing/audience-service';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireTenantContext('marketing.read');
    const { id } = await params;
    const audience = await getAudience(ctx.organizationId, id);
    const sample = await getAudienceSample(ctx.organizationId, id, 10);
    return NextResponse.json({ audience, sample });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const ctx = await requireTenantContext('marketing.manage_audiences');
    const { id } = await params;
    const body = await request.json();

    if (body.action === 'archive') {
      await archiveAudience(ctx.organizationId, id);
      return NextResponse.json({ ok: true });
    }
    if (body.action === 'refresh_count') {
      const count = await refreshAudienceCount(ctx.organizationId, id);
      return NextResponse.json({ estimatedCount: count });
    }

    const audience = await updateAudience(ctx.organizationId, id, ctx.userId, body);
    return NextResponse.json({ audience });
  } catch (err) {
    return handleApiError(err);
  }
}
