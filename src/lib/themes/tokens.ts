import type { StoreExperienceConfig } from '@/types/store-experience';
import { designExperienceToCssVars } from '@/lib/design/resolve-design-experience';
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
  return designExperienceToCssVars(config, primaryColor, secondaryColor);
}
