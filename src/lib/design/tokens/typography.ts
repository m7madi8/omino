import type { StoreTypographyPreset } from '@/types/store-experience';

export type TypographyScale = {
  display: string;
  heading: string;
  body: string;
  mono: string;
  arabic: string;
};

export const platformTypography: TypographyScale = {
  display: 'var(--font-display)',
  heading: 'var(--font-display)',
  body: 'var(--font-body)',
  mono: 'var(--font-mono)',
  arabic: 'var(--font-ar)',
};

export const TYPOGRAPHY_PRESET_FONTS: Record<
  StoreTypographyPreset,
  { heading: string; body: string; label: string }
> = {
  modern: {
    label: 'Modern',
    heading: 'var(--font-display)',
    body: 'var(--font-body)',
  },
  editorial: {
    label: 'Editorial',
    heading: 'Georgia, "Times New Roman", serif',
    body: 'var(--font-body)',
  },
  minimal: {
    label: 'Minimal',
    heading: 'var(--font-body)',
    body: 'var(--font-body)',
  },
  luxury: {
    label: 'Luxury',
    heading: 'Georgia, "Times New Roman", serif',
    body: 'var(--font-body)',
  },
};

export function typographyToCssVars(preset: StoreTypographyPreset): Record<string, string> {
  const fonts = TYPOGRAPHY_PRESET_FONTS[preset] ?? TYPOGRAPHY_PRESET_FONTS.modern;
  return {
    '--store-font-heading': fonts.heading,
    '--store-font-body': fonts.body,
    '--sf-font-display': fonts.heading,
    '--sf-font-body': fonts.body,
  };
}

export function dashboardFontClass(locale: 'en' | 'ar'): string {
  return locale === 'ar' ? 'font-ar' : 'font-body';
}
