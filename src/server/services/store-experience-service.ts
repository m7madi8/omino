import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import {
  parseExperienceDocument,
  publishDraft,
  updateDraft,
} from '@/lib/storefront/store-experience-engine';
import type { StoreExperienceConfig, StoreExperienceDocument } from '@/types/store-experience';
import { getStoreHeroConfig } from '@/types/store-theme';

function isV2Document(raw: unknown): raw is StoreExperienceDocument {
  return (
    !!raw &&
    typeof raw === 'object' &&
    (raw as StoreExperienceDocument).version === 2 &&
    !!(raw as StoreExperienceDocument).draft &&
    !!(raw as StoreExperienceDocument).live
  );
}

export function mergeThemeSettingsInput(
  current: unknown,
  incoming: unknown
): StoreExperienceDocument {
  const doc = parseExperienceDocument(current);

  if (isV2Document(incoming)) {
    return {
      version: 2,
      publishedAt: incoming.publishedAt ?? doc.publishedAt,
      live: doc.live,
      draft: incoming.draft,
    };
  }

  if (!incoming || typeof incoming !== 'object') return doc;

  const patch = incoming as Record<string, unknown>;
  const experiencePatch: Partial<StoreExperienceConfig> = {};

  if (patch.hero && typeof patch.hero === 'object') {
    experiencePatch.hero = {
      ...doc.draft.hero,
      ...(patch.hero as StoreExperienceConfig['hero']),
    };
  }

  if (patch.announcement && typeof patch.announcement === 'object') {
    experiencePatch.announcement = {
      ...doc.draft.announcement,
      ...(patch.announcement as StoreExperienceConfig['announcement']),
    };
  }

  if (patch.appearance && typeof patch.appearance === 'object') {
    experiencePatch.appearance = {
      ...doc.draft.appearance,
      ...(patch.appearance as StoreExperienceConfig['appearance']),
    };
  }

  if (patch.sections && Array.isArray(patch.sections)) {
    experiencePatch.sections = patch.sections as StoreExperienceConfig['sections'];
  }

  if (patch.seo && typeof patch.seo === 'object') {
    experiencePatch.seo = {
      ...doc.draft.seo,
      ...(patch.seo as StoreExperienceConfig['seo']),
    };
  }

  if (patch.policies && typeof patch.policies === 'object') {
    experiencePatch.policies = {
      ...doc.draft.policies,
      ...(patch.policies as StoreExperienceConfig['policies']),
    };
  }

  if (Object.keys(experiencePatch).length === 0 && patch.hero === undefined) {
    const legacyHero = getStoreHeroConfig(incoming);
    if (legacyHero) {
      experiencePatch.hero = legacyHero;
    }
  }

  return updateDraft(doc, experiencePatch);
}

export async function publishStoreExperience(organizationId: string, storeId: string) {
  const store = await prisma.store.findFirst({ where: { id: storeId, organizationId } });
  if (!store) throw new Error('NOT_FOUND');

  const doc = parseExperienceDocument(store.themeSettings);
  const published = publishDraft(doc);

  return prisma.store.update({
    where: { id: storeId },
    data: {
      themeSettings: published as unknown as Prisma.InputJsonValue,
    },
  });
}

export function getExperienceDocument(themeSettings: unknown): StoreExperienceDocument {
  return parseExperienceDocument(themeSettings);
}
