export const PRODUCT_LAYOUT_IDS = [
  'grid',
  'editorial',
  'masonry',
  'large-feature',
  'compact',
  'magazine',
  'horizontal-scroll',
] as const;

export type ProductLayoutId = (typeof PRODUCT_LAYOUT_IDS)[number];

export const HERO_LAYOUT_IDS = [
  'centered',
  'split',
  'full-image',
  'editorial',
  'asymmetric',
  'text-overlay',
  'product-focused',
  'minimal',
  'image-focused',
] as const;

export type HeroLayoutId = (typeof HERO_LAYOUT_IDS)[number];

export const COLLECTION_LAYOUT_IDS = [
  'standard',
  'editorial',
  'masonry',
  'large-image',
  'category-first',
  'product-first',
] as const;

export type CollectionLayoutId = (typeof COLLECTION_LAYOUT_IDS)[number];

export type StoreLayoutId = ProductLayoutId;

export type LayoutDefinition = {
  id: StoreLayoutId;
  name: string;
  description: string;
  productGrid: 'uniform' | 'editorial' | 'bento' | 'compact' | 'mosaic';
  columns: { mobile: number; tablet: number; desktop: number };
};

export const LAYOUT_REGISTRY: Record<StoreLayoutId, LayoutDefinition> = {
  grid: {
    id: 'grid',
    name: 'Grid',
    description: 'Balanced product grid for general commerce.',
    productGrid: 'uniform',
    columns: { mobile: 2, tablet: 3, desktop: 4 },
  },
  editorial: {
    id: 'editorial',
    name: 'Editorial',
    description: 'Magazine-style asymmetric product rhythm.',
    productGrid: 'editorial',
    columns: { mobile: 2, tablet: 2, desktop: 3 },
  },
  masonry: {
    id: 'masonry',
    name: 'Masonry',
    description: 'Bento mosaic with varied tile sizes.',
    productGrid: 'bento',
    columns: { mobile: 2, tablet: 3, desktop: 4 },
  },
  'large-feature': {
    id: 'large-feature',
    name: 'Large Feature',
    description: 'Hero products with oversized tiles.',
    productGrid: 'mosaic',
    columns: { mobile: 1, tablet: 2, desktop: 3 },
  },
  compact: {
    id: 'compact',
    name: 'Compact',
    description: 'Dense grid for large catalogs.',
    productGrid: 'compact',
    columns: { mobile: 2, tablet: 4, desktop: 5 },
  },
  magazine: {
    id: 'magazine',
    name: 'Magazine',
    description: 'Editorial grid with narrative spacing.',
    productGrid: 'editorial',
    columns: { mobile: 1, tablet: 2, desktop: 3 },
  },
  'horizontal-scroll': {
    id: 'horizontal-scroll',
    name: 'Horizontal Scroll',
    description: 'Swipeable product rows.',
    productGrid: 'compact',
    columns: { mobile: 2, tablet: 3, desktop: 4 },
  },
};

export const DEFAULT_LAYOUT_ID: StoreLayoutId = 'grid';

export function getLayout(id: string): LayoutDefinition {
  if (id in LAYOUT_REGISTRY) return LAYOUT_REGISTRY[id as StoreLayoutId];
  return LAYOUT_REGISTRY[DEFAULT_LAYOUT_ID];
}

export function listLayouts(): LayoutDefinition[] {
  return PRODUCT_LAYOUT_IDS.map((id) => LAYOUT_REGISTRY[id]);
}

/** Map theme productGrid variant to layoutId */
export function inferLayoutId(input: {
  layoutId?: string;
  themeProductGrid?: string;
}): StoreLayoutId {
  if (input.layoutId && input.layoutId in LAYOUT_REGISTRY) {
    return input.layoutId as StoreLayoutId;
  }
  const gridMap: Record<string, StoreLayoutId> = {
    uniform: 'grid',
    compact: 'compact',
    editorial: 'editorial',
    bento: 'masonry',
    mosaic: 'large-feature',
  };
  if (input.themeProductGrid && gridMap[input.themeProductGrid]) {
    return gridMap[input.themeProductGrid];
  }
  return DEFAULT_LAYOUT_ID;
}
