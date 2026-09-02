import type { StoreHeroConfig } from '@/types/store-theme';
import { getStoreHeroConfig } from '@/types/store-theme';
import type {
  StoreAnnouncementConfig,
  StoreAppearanceConfig,
  StoreExperienceConfig,
  StoreExperienceDocument,
  StoreSeoConfig,
  StoreStylePreset,
  HomepageSection,
} from '@/types/store-experience';
import {
  DEFAULT_ANNOUNCEMENT,
  DEFAULT_APPEARANCE,
  DEFAULT_SEO,
  defaultExperienceConfig,
  defaultExperienceDocument,
  defaultHomepageSections,
} from '@/types/store-experience';
import { DEFAULT_THEME_ID, getTheme, presetToThemeId } from '@/lib/themes/registry';
import { themeToCssVars as buildThemeCssVars } from '@/lib/themes/tokens';
import type { StoreThemeId } from '@/lib/themes/types';

export const STYLE_PRESETS: Record<
  StoreStylePreset,
  { label: string; primary: string; secondary: string; description: string }
> = {
  minimal: {
    label: 'Minimal',
    primary: '#141414',
    secondary: '#F4F4F2',
    description: 'Clean neutrals, restrained contrast',
  },
  editorial: {
    label: 'Editorial',
    primary: '#1A1A1A',
    secondary: '#EDE8E2',
    description: 'Magazine-like rhythm and warmth',
  },
  modern: {
    label: 'Modern',
    primary: '#5B7CFF',
    secondary: '#E8EAEC',
    description: 'Balanced commerce default',
  },
  luxury: {
    label: 'Luxury',
    primary: '#2C2416',
    secondary: '#F7F3ED',
    description: 'Refined, elevated palette',
  },
  bold: {
    label: 'Bold',
    primary: '#E85D3B',
    secondary: '#FFF8F4',
    description: 'High contrast, energetic',
  },
};

export const TYPOGRAPHY_PRESETS = {
  modern: {
    label: 'Modern',
    display: 'var(--font-display)',
    body: 'var(--font-body)',
  },
  editorial: {
    label: 'Editorial',
    display: 'Georgia, "Times New Roman", serif',
    body: 'var(--font-body)',
  },
  minimal: {
    label: 'Minimal',
    display: 'var(--font-body)',
    body: 'var(--font-body)',
  },
  luxury: {
    label: 'Luxury',
    display: 'Georgia, "Times New Roman", serif',
    body: 'var(--font-body)',
  },
} as const;

function parseHero(raw: unknown): StoreHeroConfig {
  return getStoreHeroConfig({ hero: raw });
}

function parseAnnouncement(raw: unknown): StoreAnnouncementConfig {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_ANNOUNCEMENT };
  const a = raw as Record<string, unknown>;
  return {
    enabled: Boolean(a.enabled),
    message: typeof a.message === 'string' ? a.message : '',
    link: typeof a.link === 'string' ? a.link : undefined,
    linkLabel: typeof a.linkLabel === 'string' ? a.linkLabel : undefined,
    dismissible: a.dismissible !== false,
    backgroundColor: typeof a.backgroundColor === 'string' ? a.backgroundColor : null,
    textColor: typeof a.textColor === 'string' ? a.textColor : null,
  };
}

function parseAppearance(raw: unknown): StoreAppearanceConfig {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_APPEARANCE };
  const a = raw as Record<string, unknown>;
  const preset =
    a.preset === 'minimal' ||
    a.preset === 'editorial' ||
    a.preset === 'modern' ||
    a.preset === 'luxury' ||
    a.preset === 'bold'
      ? a.preset
      : 'modern';
  const typography =
    a.typography === 'editorial' ||
    a.typography === 'minimal' ||
    a.typography === 'luxury' ||
    a.typography === 'modern'
      ? a.typography
      : 'modern';
  const radius =
    a.radius === 'none' || a.radius === 'md' || a.radius === 'lg' ? a.radius : 'sm';

  const themeIdRaw = typeof a.themeId === 'string' ? a.themeId : null;
  const themeId: StoreThemeId =
    themeIdRaw && themeIdRaw in getTheme(themeIdRaw)
      ? (themeIdRaw as StoreThemeId)
      : presetToThemeId(preset);

  const themeVersion =
    typeof a.themeVersion === 'string' ? a.themeVersion : getTheme(themeId).version;

  return { themeId, themeVersion, preset, typography, radius };
}

function parseSeo(raw: unknown): StoreSeoConfig {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SEO };
  const s = raw as Record<string, unknown>;
  return {
    title: typeof s.title === 'string' ? s.title : '',
    description: typeof s.description === 'string' ? s.description : '',
    ogImageUrl: typeof s.ogImageUrl === 'string' ? s.ogImageUrl : null,
    indexable: s.indexable !== false,
  };
}

function parseSections(raw: unknown): HomepageSection[] {
  if (!Array.isArray(raw)) return defaultHomepageSections();
  const sections: HomepageSection[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const s = item as Record<string, unknown>;
    const type = s.type;
    if (typeof type !== 'string') continue;
    const validTypes = [
      'hero',
      'featured-products',
      'featured-collection',
      'category-showcase',
      'promotional-banner',
      'brand-story',
      'newsletter',
      'rich-text',
    ];
    if (!validTypes.includes(type)) continue;
    sections.push({
      id: typeof s.id === 'string' ? s.id : `${type}-${sections.length}`,
      type: type as HomepageSection['type'],
      enabled: s.enabled !== false,
      config: s.config && typeof s.config === 'object' ? (s.config as Record<string, unknown>) : {},
    });
  }
  return sections.length ? sections : defaultHomepageSections();
}

function parseExperienceConfig(raw: unknown): StoreExperienceConfig {
  if (!raw || typeof raw !== 'object') return defaultExperienceConfig();
  const c = raw as Record<string, unknown>;
  return {
    hero: parseHero(c.hero),
    announcement: parseAnnouncement(c.announcement),
    appearance: parseAppearance(c.appearance),
    sections: parseSections(c.sections),
    seo: parseSeo(c.seo),
    policies:
      c.policies && typeof c.policies === 'object'
        ? (c.policies as StoreExperienceConfig['policies'])
        : {},
  };
}

export function parseExperienceDocument(raw: unknown): StoreExperienceDocument {
  if (!raw || typeof raw !== 'object') return defaultExperienceDocument();

  const doc = raw as Record<string, unknown>;

  if (doc.version === 2 && doc.live && doc.draft) {
    return {
      version: 2,
      publishedAt: typeof doc.publishedAt === 'string' ? doc.publishedAt : null,
      live: parseExperienceConfig(doc.live),
      draft: parseExperienceConfig(doc.draft),
    };
  }

  const legacyConfig = parseExperienceConfig({
    hero: doc.hero,
    announcement: doc.announcement,
    appearance: doc.appearance,
    sections: doc.sections,
    seo: doc.seo,
  });
  legacyConfig.hero = getStoreHeroConfig(raw);

  return {
    version: 2,
    publishedAt: typeof doc.publishedAt === 'string' ? doc.publishedAt : null,
    live: structuredClone(legacyConfig),
    draft: structuredClone(legacyConfig),
  };
}

export function getLiveExperience(themeSettings: unknown): StoreExperienceConfig {
  return parseExperienceDocument(themeSettings).live;
}

export function getDraftExperience(themeSettings: unknown): StoreExperienceConfig {
  return parseExperienceDocument(themeSettings).draft;
}

export function applyStylePreset(
  preset: StoreStylePreset,
  current?: Partial<StoreAppearanceConfig>
): { primaryColor: string; secondaryColor: string; appearance: StoreAppearanceConfig } {
  const colors = STYLE_PRESETS[preset];
  const themeId = presetToThemeId(preset);
  return {
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    appearance: {
      themeId,
      themeVersion: getTheme(themeId).version,
      preset,
      typography: current?.typography || DEFAULT_APPEARANCE.typography,
      radius: current?.radius || DEFAULT_APPEARANCE.radius,
    },
  };
}

export function applyTheme(
  themeId: StoreThemeId,
  current?: Partial<StoreAppearanceConfig>
): StoreAppearanceConfig {
  const theme = getTheme(themeId);
  return {
    themeId,
    themeVersion: theme.version,
    preset: current?.preset,
    typography: current?.typography || DEFAULT_APPEARANCE.typography,
    radius: current?.radius || DEFAULT_APPEARANCE.radius,
  };
}

export function experienceToCssVars(
  config: StoreExperienceConfig,
  primaryColor?: string | null,
  secondaryColor?: string | null
): Record<string, string> {
  return buildThemeCssVars(config, primaryColor, secondaryColor);
}

export function publishDraft(doc: StoreExperienceDocument): StoreExperienceDocument {
  return {
    version: 2,
    publishedAt: new Date().toISOString(),
    live: structuredClone(doc.draft),
    draft: structuredClone(doc.draft),
  };
}

export function updateDraft(
  doc: StoreExperienceDocument,
  patch: Partial<StoreExperienceConfig>
): StoreExperienceDocument {
  return {
    ...doc,
    draft: {
      ...doc.draft,
      ...patch,
      hero: patch.hero ? { ...doc.draft.hero, ...patch.hero } : doc.draft.hero,
      announcement: patch.announcement
        ? { ...doc.draft.announcement, ...patch.announcement }
        : doc.draft.announcement,
      appearance: patch.appearance
        ? { ...doc.draft.appearance, ...patch.appearance }
        : doc.draft.appearance,
      seo: patch.seo ? { ...doc.draft.seo, ...patch.seo } : doc.draft.seo,
      sections: patch.sections ?? doc.draft.sections,
      policies: patch.policies ? { ...doc.draft.policies, ...patch.policies } : doc.draft.policies,
    },
  };
}

export function getStoreHeroFromTheme(themeSettings: unknown): StoreHeroConfig {
  return getLiveExperience(themeSettings).hero;
}
