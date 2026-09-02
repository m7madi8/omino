import type { StoreThemeId } from '@/lib/themes/types';
import { listThemes } from '@/lib/themes/registry';

type RecommendInput = {
  categoryNames?: string[];
  productCount?: number;
  primaryColor?: string | null;
  storeName?: string;
};

const CATEGORY_THEME_MAP: Record<string, StoreThemeId[]> = {
  beauty: ['aura', 'atelier', 'form'],
  skincare: ['aura', 'atelier'],
  fashion: ['noir', 'atelier', 'pulse'],
  jewelry: ['noir', 'aura'],
  food: ['pulse', 'form'],
  electronics: ['form', 'pulse'],
  lifestyle: ['aura', 'atelier', 'pulse'],
};

export function recommendTheme(input: RecommendInput): {
  themeId: StoreThemeId;
  reason: string;
} | null {
  const themes = listThemes();
  const categories = (input.categoryNames || []).map((c) => c.toLowerCase());

  for (const cat of categories) {
    for (const [key, ids] of Object.entries(CATEGORY_THEME_MAP)) {
      if (cat.includes(key)) {
        const theme = themes.find((t) => t.id === ids[0]);
        if (theme) {
          return {
            themeId: theme.id,
            reason: `Your ${cat} catalog pairs naturally with ${theme.name}'s ${theme.tags.join(' / ')} direction.`,
          };
        }
      }
    }
  }

  if ((input.productCount ?? 0) > 40) {
    return {
      themeId: 'form',
      reason: 'A larger catalog benefits from FORM\'s clear product hierarchy and structured grid.',
    };
  }

  return null;
}
