import type { StoreExperienceConfig } from '@/types/store-experience';
import { getTheme, presetToThemeId } from '@/lib/themes/registry';
import type { StoreThemeId } from '@/lib/themes/types';

export function resolveThemeId(config: StoreExperienceConfig): StoreThemeId {
  const appearance = config.appearance as { themeId?: string; preset?: string };
  if (appearance.themeId && appearance.themeId in getTheme(appearance.themeId)) {
    return appearance.themeId as StoreThemeId;
  }
  return presetToThemeId(appearance.preset);
}

export function themeToCssVars(
  config: StoreExperienceConfig,
  primaryColor?: string | null,
  secondaryColor?: string | null
): Record<string, string> {
  const theme = getTheme(resolveThemeId(config));
  const tokens = theme.tokens;

  return {
    '--store-primary': primaryColor || 'var(--store-primary, #5B7CFF)',
    '--store-secondary': secondaryColor || 'var(--store-secondary, #E8EAEC)',
    '--store-background': '#ffffff',
    '--store-foreground': 'color-mix(in srgb, var(--store-primary) 80%, #14100d)',
    '--store-muted': 'color-mix(in srgb, var(--store-primary) 40%, var(--store-foreground) 24%)',
    '--store-surface': 'color-mix(in srgb, var(--store-secondary) 24%, #ffffff)',
    '--store-border': 'color-mix(in srgb, var(--store-primary) 16%, #ffffff 84%)',
    '--store-accent': 'var(--store-primary)',
    '--store-font-heading': tokens.fontHeading,
    '--store-font-body': tokens.fontBody,
    '--store-radius-sm': tokens.radiusSm,
    '--store-radius-md': tokens.radiusMd,
    '--store-radius-lg': tokens.radiusLg,
    '--store-space-section': tokens.spaceSection,
    '--store-space-content': tokens.spaceContent,
    '--store-shadow-card': tokens.shadowCard,
    '--store-shadow-floating': tokens.shadowFloating,
    '--store-motion-duration': tokens.motionDuration,
    '--store-motion-ease': tokens.motionEase,
    '--sf-font-display': tokens.fontHeading,
    '--sf-font-body': tokens.fontBody,
    '--sf-radius': tokens.radiusMd,
  };
}
