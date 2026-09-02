import type { StoreThemeDefinition, StoreThemeId } from '@/lib/themes/types';
import { STORE_THEME_IDS } from '@/lib/themes/types';

const baseTokens = {
  radiusSm: '2px',
  radiusMd: '6px',
  radiusLg: '12px',
  spaceSection: '4rem',
  spaceContent: '1.5rem',
  shadowCard: '0 4px 24px -8px color-mix(in srgb, var(--store-primary) 12%, transparent)',
  shadowFloating: '0 16px 48px -20px color-mix(in srgb, var(--store-primary) 20%, transparent)',
  motionEase: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

export const THEME_REGISTRY: Record<StoreThemeId, StoreThemeDefinition> = {
  aura: {
    id: 'aura',
    version: '1.0.0',
    name: 'AURA',
    description: 'Quiet luxury with generous whitespace and refined typography.',
    philosophy: 'Soft, intentional, and unhurried — products breathe in calm editorial space.',
    bestFor: ['Beauty', 'Skincare', 'Lifestyle', 'Wellness'],
    tags: ['Minimal', 'Beauty', 'Editorial'],
    categories: ['minimal', 'beauty', 'lifestyle', 'luxury'],
    previewGradient: 'linear-gradient(145deg, #faf9f7 0%, #f0ebe4 50%, #e8e2d8 100%)',
    motion: 'subtle',
    tokens: {
      ...baseTokens,
      fontHeading: 'Georgia, "Times New Roman", serif',
      fontBody: 'var(--font-body)',
      radiusSm: '4px',
      radiusMd: '8px',
      radiusLg: '16px',
      spaceSection: '5.5rem',
      spaceContent: '2rem',
      motionDuration: '0.55s',
    },
    variants: {
      header: 'aura',
      hero: 'aura',
      productCard: 'aura',
      footer: 'aura',
      category: 'aura',
      productGrid: 'bento',
    },
  },
  noir: {
    id: 'noir',
    version: '1.0.0',
    name: 'NOIR',
    description: 'High-fashion drama with bold contrast and asymmetric composition.',
    philosophy: 'Editorial tension — strong type, dramatic imagery, confident navigation.',
    bestFor: ['Fashion', 'Luxury', 'Accessories', 'Jewelry'],
    tags: ['Luxury', 'Fashion', 'Bold'],
    categories: ['luxury', 'fashion', 'bold', 'editorial'],
    previewGradient: 'linear-gradient(160deg, #0a0a0a 0%, #1a1a1a 40%, #2d2d2d 100%)',
    motion: 'sharp',
    tokens: {
      ...baseTokens,
      fontHeading: 'var(--font-display)',
      fontBody: 'var(--font-body)',
      radiusSm: '0px',
      radiusMd: '0px',
      radiusLg: '0px',
      spaceSection: '4.5rem',
      spaceContent: '1.25rem',
      shadowCard: '0 8px 32px -12px rgba(0,0,0,0.35)',
      shadowFloating: '0 24px 64px -24px rgba(0,0,0,0.45)',
      motionDuration: '0.32s',
    },
    variants: {
      header: 'noir',
      hero: 'noir',
      productCard: 'noir',
      footer: 'noir',
      category: 'noir',
      productGrid: 'editorial',
    },
  },
  form: {
    id: 'form',
    version: '1.0.0',
    name: 'FORM',
    description: 'Modern product-first commerce with precise spacing and clarity.',
    philosophy: 'Structure over decoration — every element serves conversion.',
    bestFor: ['Electronics', 'General ecommerce', 'Services', 'B2B retail'],
    tags: ['Modern', 'Product-first', 'Minimal'],
    categories: ['modern', 'product-first', 'minimal'],
    previewGradient: 'linear-gradient(180deg, #ffffff 0%, #f4f6f8 100%)',
    motion: 'minimal',
    tokens: {
      ...baseTokens,
      fontHeading: 'var(--font-display)',
      fontBody: 'var(--font-body)',
      radiusSm: '4px',
      radiusMd: '6px',
      radiusLg: '8px',
      spaceSection: '3.5rem',
      spaceContent: '1.25rem',
      motionDuration: '0.25s',
    },
    variants: {
      header: 'form',
      hero: 'form',
      productCard: 'form',
      footer: 'form',
      category: 'form',
      productGrid: 'uniform',
    },
  },
  atelier: {
    id: 'atelier',
    version: '1.0.0',
    name: 'ATELIER',
    description: 'Editorial storytelling with premium narrative rhythm.',
    philosophy: 'A magazine spread translated into commerce — story, craft, collection.',
    bestFor: ['Fashion', 'Home', 'Artisan goods', 'Premium brands'],
    tags: ['Editorial', 'Premium', 'Storytelling'],
    categories: ['editorial', 'luxury', 'lifestyle', 'fashion'],
    previewGradient: 'linear-gradient(135deg, #f7f3ed 0%, #ede6db 60%, #e0d5c8 100%)',
    motion: 'editorial',
    tokens: {
      ...baseTokens,
      fontHeading: 'Georgia, "Times New Roman", serif',
      fontBody: 'var(--font-body)',
      radiusSm: '2px',
      radiusMd: '4px',
      radiusLg: '10px',
      spaceSection: '5rem',
      spaceContent: '1.75rem',
      motionDuration: '0.48s',
    },
    variants: {
      header: 'atelier',
      hero: 'atelier',
      productCard: 'atelier',
      footer: 'atelier',
      category: 'atelier',
      productGrid: 'bento',
    },
  },
  pulse: {
    id: 'pulse',
    version: '1.0.0',
    name: 'PULSE',
    description: 'Bold, energetic commerce with expressive typography and rhythm.',
    philosophy: 'High energy without chaos — vibrant, direct, conversion-forward.',
    bestFor: ['Streetwear', 'Food', 'Youth brands', 'Promotional catalogs'],
    tags: ['Bold', 'Youthful', 'High-energy'],
    categories: ['bold', 'modern', 'lifestyle'],
    previewGradient: 'linear-gradient(135deg, #fff8f4 0%, #ffe8dc 50%, #ffd4c4 100%)',
    motion: 'energetic',
    tokens: {
      ...baseTokens,
      fontHeading: 'var(--font-display)',
      fontBody: 'var(--font-body)',
      radiusSm: '8px',
      radiusMd: '14px',
      radiusLg: '20px',
      spaceSection: '3rem',
      spaceContent: '1rem',
      shadowCard: '0 6px 20px -6px color-mix(in srgb, var(--store-primary) 25%, transparent)',
      shadowFloating: '0 20px 40px -16px color-mix(in srgb, var(--store-primary) 30%, transparent)',
      motionDuration: '0.38s',
    },
    variants: {
      header: 'pulse',
      hero: 'pulse',
      productCard: 'pulse',
      footer: 'pulse',
      category: 'pulse',
      productGrid: 'mosaic',
    },
  },
};

export const DEFAULT_THEME_ID: StoreThemeId = 'form';

export function getTheme(id: string | null | undefined): StoreThemeDefinition {
  if (id && id in THEME_REGISTRY) return THEME_REGISTRY[id as StoreThemeId];
  return THEME_REGISTRY[DEFAULT_THEME_ID];
}

export function listThemes(): StoreThemeDefinition[] {
  return STORE_THEME_IDS.map((id) => THEME_REGISTRY[id]);
}

export function listThemeSummaries() {
  return listThemes().map((t) => ({
    id: t.id,
    version: t.version,
    name: t.name,
    description: t.description,
    philosophy: t.philosophy,
    bestFor: t.bestFor,
    tags: t.tags,
    categories: t.categories,
    previewGradient: t.previewGradient,
  }));
}

/** Map legacy appearance presets to theme IDs */
export function presetToThemeId(preset: string | undefined): StoreThemeId {
  switch (preset) {
    case 'minimal':
      return 'form';
    case 'editorial':
      return 'atelier';
    case 'luxury':
      return 'aura';
    case 'bold':
      return 'pulse';
    case 'modern':
    default:
      return 'form';
  }
}
