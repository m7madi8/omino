'use client';

import { createContext, useContext, useMemo } from 'react';
import { getTheme } from '@/lib/themes/registry';
import type { StoreThemeDefinition, StoreThemeId } from '@/lib/themes/types';
import type { StoreExperienceConfig } from '@/types/store-experience';
import { resolveThemeId } from '@/lib/themes/tokens';

type ThemeContextValue = {
  themeId: StoreThemeId;
  theme: StoreThemeDefinition;
  experience: StoreExperienceConfig;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function StoreThemeProvider({
  experience,
  themeIdOverride,
  children,
}: {
  experience: StoreExperienceConfig;
  themeIdOverride?: StoreThemeId | null;
  children: React.ReactNode;
}) {
  const themeId = themeIdOverride || resolveThemeId(experience);
  const theme = getTheme(themeId);

  const value = useMemo(
    () => ({ themeId, theme, experience }),
    [themeId, theme, experience]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useStoreTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    const fallback = getTheme('form');
    return {
      themeId: fallback.id,
      theme: fallback,
      experience: null as unknown as StoreExperienceConfig,
    };
  }
  return ctx;
}
