import { prisma } from '@/lib/db';
import type { StoreExperienceDocument } from '@/types/store-experience';
import { applyTheme, parseExperienceDocument, updateDraft } from '@/lib/storefront/store-experience-engine';
import { getTheme, listThemeSummaries } from '@/lib/themes/registry';
import type { StoreThemeId } from '@/lib/themes/types';
import { getStoreSettings, updateStoreSettings } from '@/server/services/store-service';

export function listAvailableThemes() {
  return listThemeSummaries();
}

export async function getStoreThemeState(organizationId: string) {
  const store = await getStoreSettings(organizationId);
  const doc = parseExperienceDocument(store.themeSettings);
  const liveThemeId = doc.live.appearance.themeId;
  const draftThemeId = doc.draft.appearance.themeId;

  return {
    store: {
      id: store.id,
      name: store.name,
      publicSlug: store.publicSlug,
      primaryColor: store.primaryColor,
      secondaryColor: store.secondaryColor,
    },
    publishedTheme: {
      id: liveThemeId,
      name: getTheme(liveThemeId).name,
      version: getTheme(liveThemeId).version,
    },
    draftTheme: {
      id: draftThemeId,
      name: getTheme(draftThemeId).name,
      version: getTheme(draftThemeId).version,
    },
    publishedAt: doc.publishedAt,
    hasUnpublishedChanges: JSON.stringify(doc.live) !== JSON.stringify(doc.draft),
  };
}

export async function applyThemeToDraft(organizationId: string, themeId: StoreThemeId) {
  const theme = getTheme(themeId);
  const store = await getStoreSettings(organizationId);
  const doc = parseExperienceDocument(store.themeSettings);
  const nextDoc = updateDraft(doc, {
    appearance: applyTheme(themeId, doc.draft.appearance),
  });

  await updateStoreSettings(organizationId, store.id, {
    themeSettings: nextDoc as StoreExperienceDocument,
  });

  return {
    themeId,
    themeVersion: theme.version,
    themeName: theme.name,
    hasUnpublishedChanges: JSON.stringify(nextDoc.live) !== JSON.stringify(nextDoc.draft),
  };
}

export const PREVIEW_COOKIE = 'omino_sf_preview_theme';
export const PREVIEW_COOKIE_MAX_AGE = 60 * 30; // 30 minutes
