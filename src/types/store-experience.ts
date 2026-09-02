import type { StoreHeroConfig } from '@/types/store-theme';
import { DEFAULT_HERO_CONFIG } from '@/types/store-theme';
import { DEFAULT_THEME_ID } from '@/lib/themes/registry';

export type StoreStylePreset = 'minimal' | 'editorial' | 'modern' | 'luxury' | 'bold';
export type StoreTypographyPreset = 'modern' | 'editorial' | 'minimal' | 'luxury';

export type StoreAnnouncementConfig = {
  enabled: boolean;
  message: string;
  link?: string;
  linkLabel?: string;
  dismissible: boolean;
  backgroundColor?: string | null;
  textColor?: string | null;
};

export type StoreAppearanceConfig = {
  themeId: import('@/lib/themes/types').StoreThemeId;
  themeVersion: string;
  /** @deprecated Use themeId — kept for migration */
  preset?: StoreStylePreset;
  typography?: StoreTypographyPreset;
  radius?: 'none' | 'sm' | 'md' | 'lg';
};

export type StoreSeoConfig = {
  title?: string;
  description?: string;
  ogImageUrl?: string | null;
  indexable: boolean;
};

export type StorePoliciesConfig = {
  shipping?: string;
  returns?: string;
  privacy?: string;
  terms?: string;
};

export type HomepageSectionType =
  | 'hero'
  | 'featured-products'
  | 'featured-collection'
  | 'category-showcase'
  | 'promotional-banner'
  | 'brand-story'
  | 'newsletter'
  | 'rich-text';

export type HomepageSection = {
  id: string;
  type: HomepageSectionType;
  enabled: boolean;
  config: Record<string, unknown>;
};

export type StoreExperienceConfig = {
  hero: StoreHeroConfig;
  announcement: StoreAnnouncementConfig;
  appearance: StoreAppearanceConfig;
  sections: HomepageSection[];
  seo: StoreSeoConfig;
  policies: StorePoliciesConfig;
};

export type StoreExperienceDocument = {
  version: 2;
  publishedAt: string | null;
  live: StoreExperienceConfig;
  draft: StoreExperienceConfig;
};

export const DEFAULT_ANNOUNCEMENT: StoreAnnouncementConfig = {
  enabled: false,
  message: '',
  dismissible: true,
};

export const DEFAULT_APPEARANCE: StoreAppearanceConfig = {
  themeId: DEFAULT_THEME_ID,
  themeVersion: '1.0.0',
  preset: 'modern',
  typography: 'modern',
  radius: 'sm',
};

export const DEFAULT_SEO: StoreSeoConfig = {
  title: '',
  description: '',
  ogImageUrl: null,
  indexable: true,
};

export const DEFAULT_POLICIES: StorePoliciesConfig = {};

export function defaultExperienceConfig(): StoreExperienceConfig {
  return {
    hero: { ...DEFAULT_HERO_CONFIG },
    announcement: { ...DEFAULT_ANNOUNCEMENT },
    appearance: { ...DEFAULT_APPEARANCE },
    sections: defaultHomepageSections(),
    seo: { ...DEFAULT_SEO },
    policies: { ...DEFAULT_POLICIES },
  };
}

export function defaultHomepageSections(): HomepageSection[] {
  return [
    { id: 'hero', type: 'hero', enabled: true, config: {} },
    { id: 'featured-products', type: 'featured-products', enabled: true, config: { title: 'Featured products' } },
    { id: 'category-showcase', type: 'category-showcase', enabled: true, config: { title: 'Shop by category' } },
  ];
}

export function defaultExperienceDocument(): StoreExperienceDocument {
  const config = defaultExperienceConfig();
  return {
    version: 2,
    publishedAt: null,
    live: structuredClone(config),
    draft: structuredClone(config),
  };
}
