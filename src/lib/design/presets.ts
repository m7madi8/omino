import type { StoreStyleId } from '@/lib/design/styles/types';
import type { StoreLayoutId } from '@/lib/design/layouts/registry';
import type { StoreThemeId } from '@/lib/themes/types';

export type DesignPreset = {
  id: string;
  name: string;
  description: string;
  themeId: StoreThemeId;
  styleId: StoreStyleId;
  layoutId: StoreLayoutId;
  primaryColor: string;
  secondaryColor: string;
  typography: 'modern' | 'editorial' | 'minimal' | 'luxury';
  tags: string[];
};

export const DESIGN_PRESETS: DesignPreset[] = [
  {
    id: 'minimal-studio',
    name: 'Minimal Studio',
    description: 'Clean product-first commerce with generous whitespace.',
    themeId: 'form',
    styleId: 'minimal',
    layoutId: 'grid',
    primaryColor: '#141414',
    secondaryColor: '#F4F4F2',
    typography: 'minimal',
    tags: ['Product', 'Clean', 'Studio'],
  },
  {
    id: 'editorial-fashion',
    name: 'Editorial Fashion',
    description: 'Magazine rhythm for fashion and accessories.',
    themeId: 'noir',
    styleId: 'editorial',
    layoutId: 'masonry',
    primaryColor: '#1A1A1A',
    secondaryColor: '#EDE8E2',
    typography: 'editorial',
    tags: ['Fashion', 'Editorial', 'Bold'],
  },
  {
    id: 'quiet-luxury',
    name: 'Quiet Luxury',
    description: 'Refined palette with premium product presentation.',
    themeId: 'aura',
    styleId: 'luxury',
    layoutId: 'editorial',
    primaryColor: '#2C2416',
    secondaryColor: '#F7F3ED',
    typography: 'luxury',
    tags: ['Luxury', 'Beauty', 'Premium'],
  },
  {
    id: 'modern-commerce',
    name: 'Modern Commerce',
    description: 'Balanced default for general retail.',
    themeId: 'pulse',
    styleId: 'modern',
    layoutId: 'grid',
    primaryColor: '#5B7CFF',
    secondaryColor: '#E8EAEC',
    typography: 'modern',
    tags: ['Retail', 'Modern', 'Default'],
  },
  {
    id: 'bold-brand',
    name: 'Bold Brand',
    description: 'High contrast, expressive typography and CTAs.',
    themeId: 'noir',
    styleId: 'bold',
    layoutId: 'large-feature',
    primaryColor: '#E85D3B',
    secondaryColor: '#FFF8F4',
    typography: 'modern',
    tags: ['Bold', 'Energetic', 'DTC'],
  },
  {
    id: 'organic-living',
    name: 'Organic Living',
    description: 'Warm lifestyle presentation with soft composition.',
    themeId: 'aura',
    styleId: 'organic',
    layoutId: 'grid',
    primaryColor: '#3D4A3A',
    secondaryColor: '#F5F0E8',
    typography: 'minimal',
    tags: ['Lifestyle', 'Organic', 'Warm'],
  },
  {
    id: 'classic-boutique',
    name: 'Classic Boutique',
    description: 'Timeless boutique feel with balanced layouts.',
    themeId: 'atelier',
    styleId: 'classic',
    layoutId: 'editorial',
    primaryColor: '#2A2520',
    secondaryColor: '#F0EBE4',
    typography: 'editorial',
    tags: ['Boutique', 'Classic', 'Timeless'],
  },
  {
    id: 'experimental-atelier',
    name: 'Experimental Atelier',
    description: 'Art-directed asymmetric layouts for advanced merchants.',
    themeId: 'atelier',
    styleId: 'experimental',
    layoutId: 'magazine',
    primaryColor: '#0D0D0D',
    secondaryColor: '#E8E4DC',
    typography: 'editorial',
    tags: ['Advanced', 'Artistic', 'Experimental'],
  },
];

export function getDesignPreset(id: string): DesignPreset | undefined {
  return DESIGN_PRESETS.find((p) => p.id === id);
}

export function recommendPresets(category?: string): DesignPreset[] {
  const cat = (category ?? '').toLowerCase();
  if (cat.includes('fashion') || cat.includes('luxury')) {
    return DESIGN_PRESETS.filter((p) =>
      ['editorial-fashion', 'quiet-luxury', 'classic-boutique'].includes(p.id)
    );
  }
  if (cat.includes('beauty') || cat.includes('wellness')) {
    return DESIGN_PRESETS.filter((p) =>
      ['quiet-luxury', 'organic-living', 'minimal-studio'].includes(p.id)
    );
  }
  return DESIGN_PRESETS.slice(0, 4);
}
