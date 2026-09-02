import { cookies } from 'next/headers';
import { PREVIEW_COOKIE } from '@/server/services/theme-service';
import type { StoreThemeId } from '@/lib/themes/types';

export type StorefrontPreviewSession = {
  themeId: StoreThemeId;
  mode: 'draft' | 'live';
  storeSlug: string;
};

export async function getStorefrontPreviewSession(
  storeSlug: string
): Promise<StorefrontPreviewSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(PREVIEW_COOKIE)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StorefrontPreviewSession;
    if (parsed.storeSlug !== storeSlug) return null;
    return parsed;
  } catch {
    return null;
  }
}
