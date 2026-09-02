import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { STORE_THEME_IDS } from '@/lib/themes/types';
import { PREVIEW_COOKIE, PREVIEW_COOKIE_MAX_AGE } from '@/server/services/theme-service';
import { getStoreSettings } from '@/server/services/store-service';

const bodySchema = z.object({
  themeId: z.enum(STORE_THEME_IDS),
  mode: z.enum(['draft', 'live']).optional(),
});

export async function POST(req: Request) {
  try {
    const ctx = await requireTenantContext();
    const body = bodySchema.parse(await req.json());
    const store = await getStoreSettings(ctx.organizationId);

    const cookieStore = await cookies();
    cookieStore.set(PREVIEW_COOKIE, JSON.stringify({
      themeId: body.themeId,
      mode: body.mode || 'draft',
      storeSlug: store.publicSlug,
    }), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: PREVIEW_COOKIE_MAX_AGE,
    });

    return NextResponse.json({
      previewUrl: `/store/${store.publicSlug}`,
      themeId: body.themeId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    await requireTenantContext();
    const cookieStore = await cookies();
    cookieStore.delete(PREVIEW_COOKIE);
    return NextResponse.json({ cleared: true });
  } catch (error) {
    return handleApiError(error);
  }
}
