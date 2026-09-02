import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { STORE_THEME_IDS } from '@/lib/themes/types';
import { applyThemeToDraft } from '@/server/services/theme-service';

const bodySchema = z.object({
  themeId: z.enum(STORE_THEME_IDS),
});

export async function POST(req: Request) {
  try {
    const ctx = await requireTenantContext();
    const body = bodySchema.parse(await req.json());
    const result = await applyThemeToDraft(ctx.organizationId, body.themeId);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
