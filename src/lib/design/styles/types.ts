export const STORE_STYLE_IDS = [
  'minimal',
  'editorial',
  'luxury',
  'bold',
  'organic',
  'modern',
  'classic',
  'experimental',
] as const;

export type StoreStyleId = (typeof STORE_STYLE_IDS)[number];

export type StyleTokenOverrides = {
  spaceSectionMultiplier: number;
  spaceContentMultiplier: number;
  borderWeight: string;
  typeScaleMultiplier: number;
  shadowIntensity: number;
  motionMultiplier: number;
  cardPadding: string;
  productCardComposition: 'minimal' | 'editorial' | 'luxury' | 'bold' | 'organic' | 'modern' | 'classic' | 'experimental';
  heroComposition: 'centered' | 'split' | 'editorial' | 'asymmetric' | 'minimal' | 'full-image';
};

export type StoreStyleDefinition = {
  id: StoreStyleId;
  name: string;
  description: string;
  tokens: StyleTokenOverrides;
  tags: string[];
};
