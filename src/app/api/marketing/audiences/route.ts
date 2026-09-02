import { NextResponse } from 'next/server';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  listAudiences,
  createAudience,
} from '@/server/services/marketing/audience-service';
import { countAudienceMembers } from '@/lib/marketing/segment-rules';
import type { SegmentRuleGroup } from '@/types/marketing';

export async function GET(request: Request) {
  try {
    const ctx = await requireTenantContext('marketing.read');
    const { searchParams } = new URL(request.url);

    if (searchParams.get('preview') === 'count' && searchParams.get('rules')) {
      const rules = JSON.parse(searchParams.get('rules')!) as SegmentRuleGroup;
      const estimatedCount = await countAudienceMembers(
        ctx.organizationId,
        rules,
        ctx.storeId ?? undefined
      );
      return NextResponse.json({ estimatedCount });
    }

    const audiences = await listAudiences(ctx.organizationId, ctx.storeId ?? undefined);
    return NextResponse.json({ audiences });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext('marketing.manage_audiences');
    const body = await request.json();

    const audience = await createAudience(ctx.organizationId, ctx.userId, {
      name: body.name,
      description: body.description,
      rules: body.rules,
      storeId: body.storeId ?? ctx.storeId ?? undefined,
    });

    return NextResponse.json({ audience }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
