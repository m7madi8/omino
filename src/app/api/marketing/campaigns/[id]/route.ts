import { NextResponse } from 'next/server';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  getCampaign,
  updateCampaign,
  transitionCampaign,
} from '@/server/services/marketing/campaign-service';
import { getCampaignAttributionSummary } from '@/server/services/marketing/attribution-service';
import { getAudienceSample } from '@/server/services/marketing/audience-service';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireTenantContext('marketing.read');
    const { id } = await params;
    const campaign = await getCampaign(ctx.organizationId, id);
    const attribution = await getCampaignAttributionSummary(ctx.organizationId, id);
    const sample =
      campaign.audienceId != null
        ? await getAudienceSample(ctx.organizationId, campaign.audienceId, 5)
        : [];

    return NextResponse.json({ campaign, attribution, audienceSample: sample });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const ctx = await requireTenantContext('marketing.write');
    const { id } = await params;
    const body = await request.json();

    if (body.action === 'activate') {
      const ctxPerm = await requireTenantContext('marketing.activate_campaign');
      const campaign = await transitionCampaign(ctxPerm.organizationId, id, ctxPerm.userId, 'ACTIVE');
      return NextResponse.json({ campaign });
    }
    if (body.action === 'pause') {
      const ctxPerm = await requireTenantContext('marketing.pause_campaign');
      const campaign = await transitionCampaign(ctxPerm.organizationId, id, ctxPerm.userId, 'PAUSED');
      return NextResponse.json({ campaign });
    }
    if (body.action === 'schedule') {
      const campaign = await transitionCampaign(ctx.organizationId, id, ctx.userId, 'SCHEDULED');
      return NextResponse.json({ campaign });
    }
    if (body.action === 'complete') {
      const campaign = await transitionCampaign(ctx.organizationId, id, ctx.userId, 'COMPLETED');
      return NextResponse.json({ campaign });
    }
    if (body.action === 'archive') {
      const campaign = await transitionCampaign(ctx.organizationId, id, ctx.userId, 'ARCHIVED');
      return NextResponse.json({ campaign });
    }

    const campaign = await updateCampaign(ctx.organizationId, id, ctx.userId, body);
    return NextResponse.json({ campaign });
  } catch (err) {
    return handleApiError(err);
  }
}
