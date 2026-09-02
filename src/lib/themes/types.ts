export const STORE_THEME_IDS = ['aura', 'noir', 'form', 'atelier', 'pulse'] as const;

export type StoreThemeId = (typeof STORE_THEME_IDS)[number];

export type ThemeCategory =
  | 'minimal'
  | 'editorial'
  | 'luxury'
  | 'modern'
  | 'bold'
  | 'product-first'
  | 'beauty'
  | 'fashion'
  | 'lifestyle';

export type ThemeMotionPersonality = 'subtle' | 'sharp' | 'minimal' | 'editorial' | 'energetic';

export type ThemeComponentVariants = {
  header: 'aura' | 'noir' | 'form' | 'atelier' | 'pulse';
  hero: 'aura' | 'noir' | 'form' | 'atelier' | 'pulse';
  productCard: 'aura' | 'noir' | 'form' | 'atelier' | 'pulse';
  footer: 'aura' | 'noir' | 'form' | 'atelier' | 'pulse';
  category: 'aura' | 'noir' | 'form' | 'atelier' | 'pulse';
  productGrid: 'bento' | 'uniform' | 'editorial' | 'compact' | 'mosaic';
};

export type ThemeTokenSet = {
  fontHeading: string;
  fontBody: string;
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  spaceSection: string;
  spaceContent: string;
  shadowCard: string;
  shadowFloating: string;
  motionDuration: string;
  motionEase: string;
};

export type StoreThemeDefinition = {
  id: StoreThemeId;
  version: string;
  name: string;
  description: string;
  philosophy: string;
  bestFor: string[];
  tags: string[];
  categories: ThemeCategory[];
  previewGradient: string;
  tokens: ThemeTokenSet;
  variants: ThemeComponentVariants;
  motion: ThemeMotionPersonality;
};

export type ThemeListItem = Pick<
  StoreThemeDefinition,
  'id' | 'version' | 'name' | 'description' | 'tags' | 'categories' | 'previewGradient' | 'philosophy' | 'bestFor'
>;
