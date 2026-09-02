import { NextResponse } from 'next/server';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { listCampaigns, createCampaign } from '@/server/services/marketing/campaign-service';
import { getCampaignTemplate } from '@/server/services/marketing/templates';
import { createAudience } from '@/server/services/marketing/audience-service';
import { createPromotion } from '@/server/services/marketing/promotion-service';
import type { MarketingChannel } from '@prisma/client';

export async function GET() {
  try {
    const ctx = await requireTenantContext('marketing.read');
    const campaigns = await listCampaigns(ctx.organizationId, ctx.storeId ?? undefined);
    return NextResponse.json({ campaigns });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext('marketing.create_campaign');
    const body = await request.json();

    if (body.templateId) {
      const template = getCampaignTemplate(body.templateId);
      if (!template) return NextResponse.json({ error: 'INVALID_TEMPLATE' }, { status: 400 });

      const audience = await createAudience(ctx.organizationId, ctx.userId, {
        name: `${template.name} Audience`,
        description: template.description,
        rules: template.audienceRules,
        storeId: ctx.storeId ?? undefined,
      });

      let promotionId: string | undefined;
      if (template.suggestedPromotion) {
        const promo = await createPromotion(ctx.organizationId, ctx.userId, {
          ...template.suggestedPromotion,
          storeId: ctx.storeId ?? undefined,
          status: 'DRAFT',
        });
        promotionId = promo.id;
      }

      const campaign = await createCampaign(ctx.organizationId, ctx.userId, {
        name: template.name,
        description: template.description,
        audienceId: audience.id,
        promotionId,
        storeId: ctx.storeId ?? undefined,
        status: 'DRAFT',
      });

      return NextResponse.json({ campaign, audienceId: audience.id, promotionId }, { status: 201 });
    }

    const campaign = await createCampaign(ctx.organizationId, ctx.userId, {
      name: body.name,
      description: body.description,
      audienceId: body.audienceId,
      promotionId: body.promotionId,
      messageTitle: body.messageTitle,
      messageBody: body.messageBody,
      channels: body.channels as MarketingChannel[] | undefined,
      scheduledStart: body.scheduledStart,
      scheduledEnd: body.scheduledEnd,
      timezone: body.timezone,
      storeId: body.storeId ?? ctx.storeId ?? undefined,
      automationId: body.automationId,
      status: 'DRAFT',
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
