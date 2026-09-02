import { NextResponse } from 'next/server';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { getStoreThemeState, listAvailableThemes } from '@/server/services/theme-service';

export async function GET() {
  try {
    const ctx = await requireTenantContext();
    const [themes, state] = await Promise.all([
      Promise.resolve(listAvailableThemes()),
      getStoreThemeState(ctx.organizationId),
    ]);

    return NextResponse.json({ themes, ...state });
  } catch (error) {
    return handleApiError(error);
  }
}
