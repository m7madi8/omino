'use client';

import { createContext, useContext, useMemo } from 'react';
import { resolveDesignExperience } from '@/lib/design/resolve-design-experience';
import { getTheme } from '@/lib/themes/registry';
import type { StoreThemeDefinition, StoreThemeId } from '@/lib/themes/types';
import type { StoreStyleId } from '@/lib/design/styles/types';
import type { StoreLayoutId } from '@/lib/design/layouts/registry';
import type { StoreExperienceConfig } from '@/types/store-experience';
type ThemeContextValue = {
  themeId: StoreThemeId;
  styleId: StoreStyleId;
  layoutId: StoreLayoutId;
  theme: StoreThemeDefinition;
  experience: StoreExperienceConfig;
  componentVariants: ReturnType<typeof resolveDesignExperience>['componentVariants'];
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function StoreThemeProvider({
  experience,
  themeIdOverride,
  primaryColor,
  secondaryColor,
  children,
}: {
  experience: StoreExperienceConfig;
  themeIdOverride?: StoreThemeId | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  children: React.ReactNode;
}) {
  const resolved = useMemo(
    () => resolveDesignExperience(experience, primaryColor, secondaryColor),
    [experience, primaryColor, secondaryColor]
  );

  const themeId = themeIdOverride || (resolved.themeId as StoreThemeId);
  const theme = getTheme(themeId);
  const mergedTheme = useMemo(
    () => ({
      ...theme,
      variants: resolved.componentVariants,
    }),
    [theme, resolved.componentVariants]
  );

  const value = useMemo(
    () => ({
      themeId,
      styleId: resolved.styleId,
      layoutId: resolved.layoutId,
      theme: mergedTheme,
      experience,
      componentVariants: resolved.componentVariants,
    }),
    [themeId, resolved.styleId, resolved.layoutId, mergedTheme, experience, resolved.componentVariants]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useStoreTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    const fallback = getTheme('form');
    return {
      themeId: fallback.id,
      styleId: 'modern' as StoreStyleId,
      layoutId: 'grid' as StoreLayoutId,
      theme: fallback,
      experience: null as unknown as StoreExperienceConfig,
      componentVariants: fallback.variants,
    };
  }
  return ctx;
}
