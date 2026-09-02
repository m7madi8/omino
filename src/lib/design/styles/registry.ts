import type { StoreStyleDefinition, StoreStyleId } from '@/lib/design/styles/types';
import { STORE_STYLE_IDS } from '@/lib/design/styles/types';

const base: Omit<StoreStyleDefinition, 'id' | 'name' | 'description' | 'tags'> = {
  tokens: {
    spaceSectionMultiplier: 1,
    spaceContentMultiplier: 1,
    borderWeight: '1px',
    typeScaleMultiplier: 1,
    shadowIntensity: 1,
    motionMultiplier: 1,
    cardPadding: '1rem',
    productCardComposition: 'modern',
    heroComposition: 'split',
  },
};

export const STYLE_REGISTRY: Record<StoreStyleId, StoreStyleDefinition> = {
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Extreme whitespace, clean typography, restrained borders.',
    tags: ['Clean', 'Whitespace', 'Product-first'],
    tokens: {
      ...base.tokens,
      spaceSectionMultiplier: 1.35,
      spaceContentMultiplier: 1.2,
      borderWeight: '1px',
      typeScaleMultiplier: 0.95,
      shadowIntensity: 0.4,
      motionMultiplier: 0.8,
      cardPadding: '0.75rem',
      productCardComposition: 'minimal',
      heroComposition: 'minimal',
    },
  },
  editorial: {
    id: 'editorial',
    name: 'Editorial',
    description: 'Magazine-inspired layouts, dramatic typography, asymmetric grids.',
    tags: ['Fashion', 'Magazine', 'Storytelling'],
    tokens: {
      ...base.tokens,
      spaceSectionMultiplier: 1.25,
      spaceContentMultiplier: 1.15,
      borderWeight: '1px',
      typeScaleMultiplier: 1.15,
      shadowIntensity: 0.6,
      motionMultiplier: 1.1,
      cardPadding: '1.25rem',
      productCardComposition: 'editorial',
      heroComposition: 'editorial',
    },
  },
  luxury: {
    id: 'luxury',
    name: 'Luxury',
    description: 'Refined spacing, restrained colors, premium product presentation.',
    tags: ['Premium', 'Refined', 'Quiet'],
    tokens: {
      ...base.tokens,
      spaceSectionMultiplier: 1.4,
      spaceContentMultiplier: 1.25,
      borderWeight: '1px',
      typeScaleMultiplier: 1.05,
      shadowIntensity: 0.35,
      motionMultiplier: 0.9,
      cardPadding: '1.5rem',
      productCardComposition: 'luxury',
      heroComposition: 'split',
    },
  },
  bold: {
    id: 'bold',
    name: 'Bold',
    description: 'Large typography, strong visual blocks, confident layouts.',
    tags: ['Energetic', 'Contrast', 'Expressive'],
    tokens: {
      ...base.tokens,
      spaceSectionMultiplier: 0.95,
      spaceContentMultiplier: 0.9,
      borderWeight: '2px',
      typeScaleMultiplier: 1.25,
      shadowIntensity: 0.85,
      motionMultiplier: 1.2,
      cardPadding: '1rem',
      productCardComposition: 'bold',
      heroComposition: 'asymmetric',
    },
  },
  organic: {
    id: 'organic',
    name: 'Organic',
    description: 'Softer geometry, warm visual language, lifestyle-oriented.',
    tags: ['Warm', 'Natural', 'Lifestyle'],
    tokens: {
      ...base.tokens,
      spaceSectionMultiplier: 1.15,
      spaceContentMultiplier: 1.1,
      borderWeight: '1px',
      typeScaleMultiplier: 1,
      shadowIntensity: 0.5,
      motionMultiplier: 1,
      cardPadding: '1.125rem',
      productCardComposition: 'organic',
      heroComposition: 'centered',
    },
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary grids, sharp hierarchy, subtle motion.',
    tags: ['Commerce', 'Clean', 'Default'],
    tokens: {
      ...base.tokens,
      productCardComposition: 'modern',
      heroComposition: 'split',
    },
  },
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Refined typography, balanced layouts, timeless presentation.',
    tags: ['Timeless', 'Boutique', 'Traditional'],
    tokens: {
      ...base.tokens,
      spaceSectionMultiplier: 1.1,
      typeScaleMultiplier: 1.02,
      shadowIntensity: 0.45,
      motionMultiplier: 0.85,
      productCardComposition: 'classic',
      heroComposition: 'centered',
    },
  },
  experimental: {
    id: 'experimental',
    name: 'Experimental',
    description: 'Asymmetric layouts, oversized type, artistic presentation.',
    tags: ['Advanced', 'Artistic', 'Unconventional'],
    tokens: {
      ...base.tokens,
      spaceSectionMultiplier: 1.2,
      typeScaleMultiplier: 1.3,
      shadowIntensity: 0.7,
      motionMultiplier: 1.15,
      productCardComposition: 'experimental',
      heroComposition: 'asymmetric',
    },
  },
};

export const DEFAULT_STYLE_ID: StoreStyleId = 'modern';

export function getStyle(id: string): StoreStyleDefinition {
  if (id in STYLE_REGISTRY) return STYLE_REGISTRY[id as StoreStyleId];
  return STYLE_REGISTRY[DEFAULT_STYLE_ID];
}

export function listStyles(): StoreStyleDefinition[] {
  return STORE_STYLE_IDS.map((id) => STYLE_REGISTRY[id]);
}

/** Map legacy preset or theme category to styleId */
export function inferStyleId(input: {
  styleId?: string;
  preset?: string;
  themeId?: string;
}): StoreStyleId {
  if (input.styleId && input.styleId in STYLE_REGISTRY) {
    return input.styleId as StoreStyleId;
  }
  const presetMap: Record<string, StoreStyleId> = {
    minimal: 'minimal',
    editorial: 'editorial',
    luxury: 'luxury',
    bold: 'bold',
    modern: 'modern',
  };
  if (input.preset && presetMap[input.preset]) return presetMap[input.preset];
  const themeStyleMap: Record<string, StoreStyleId> = {
    aura: 'luxury',
    noir: 'editorial',
    form: 'minimal',
    atelier: 'editorial',
    pulse: 'bold',
  };
  if (input.themeId && themeStyleMap[input.themeId]) return themeStyleMap[input.themeId];
  return DEFAULT_STYLE_ID;
}
