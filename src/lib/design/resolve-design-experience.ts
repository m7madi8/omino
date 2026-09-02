import type { StoreExperienceConfig } from '@/types/store-experience';
import { getTheme, resolveThemeId } from '@/lib/themes';
import { inferLayoutId, getLayout } from '@/lib/design/layouts/registry';
import { inferStyleId, getStyle } from '@/lib/design/styles/registry';
import { typographyToCssVars } from '@/lib/design/tokens/typography';
import type { StoreStyleId } from '@/lib/design/styles/types';
import type { StoreLayoutId } from '@/lib/design/layouts/registry';
import type { ThemeComponentVariants } from '@/lib/themes/types';

export type ResolvedDesignExperience = {
  themeId: string;
  styleId: StoreStyleId;
  layoutId: StoreLayoutId;
  cssVars: Record<string, string>;
  componentVariants: ThemeComponentVariants;
  dataAttributes: {
    theme: string;
    style: StoreStyleId;
    layout: StoreLayoutId;
  };
};

const RADIUS_MAP = {
  none: { sm: '0px', md: '0px', lg: '0px' },
  sm: { sm: '4px', md: '6px', lg: '10px' },
  md: { sm: '6px', md: '10px', lg: '16px' },
  lg: { sm: '8px', md: '14px', lg: '24px' },
} as const;

const SPACING_MAP = {
  compact: 0.85,
  balanced: 1,
  generous: 1.25,
} as const;

function parseSpacing(raw?: string): keyof typeof SPACING_MAP {
  if (raw === 'compact' || raw === 'generous') return raw;
  return 'balanced';
}

export function resolveDesignExperience(
  config: StoreExperienceConfig,
  primaryColor?: string | null,
  secondaryColor?: string | null
): ResolvedDesignExperience {
  const themeId = resolveThemeId(config);
  const theme = getTheme(themeId);
  const appearance = config.appearance;

  const styleId = inferStyleId({
    styleId: (appearance as { styleId?: string }).styleId,
    preset: appearance.preset,
    themeId,
  });
  const style = getStyle(styleId);

  const layoutId = inferLayoutId({
    layoutId: (appearance as { layoutId?: string }).layoutId,
    themeProductGrid: theme.variants.productGrid,
  });
  const layout = getLayout(layoutId);

  const typography = appearance.typography ?? 'modern';
  const radiusKey = appearance.radius ?? 'sm';
  const radii = RADIUS_MAP[radiusKey] ?? RADIUS_MAP.sm;
  const spacingKey = parseSpacing((appearance as { spacing?: string }).spacing);
  const spacingMul = SPACING_MAP[spacingKey];

  const styleMul = style.tokens.spaceSectionMultiplier * spacingMul;
  const contentMul = style.tokens.spaceContentMultiplier * spacingMul;

  const shadowScale = style.tokens.shadowIntensity;

  const cssVars: Record<string, string> = {
    '--store-primary': primaryColor || '#5B7CFF',
    '--store-secondary': secondaryColor || '#E8EAEC',
    '--store-background': '#ffffff',
    '--store-foreground': 'color-mix(in srgb, var(--store-primary) 80%, #14100d)',
    '--store-muted': 'color-mix(in srgb, var(--store-primary) 40%, var(--store-foreground) 24%)',
    '--store-surface': 'color-mix(in srgb, var(--store-secondary) 24%, #ffffff)',
    '--store-border': 'color-mix(in srgb, var(--store-primary) 16%, #ffffff 84%)',
    '--store-accent': 'var(--store-primary)',
    '--store-radius-sm': radii.sm,
    '--store-radius-md': radii.md,
    '--store-radius-lg': radii.lg,
    '--store-space-section': `calc(${theme.tokens.spaceSection} * ${styleMul})`,
    '--store-space-content': `calc(${theme.tokens.spaceContent} * ${contentMul})`,
    '--store-shadow-card': theme.tokens.shadowCard.replace(
      /[\d.]+(?=px)/g,
      (m) => String(parseFloat(m) * shadowScale)
    ),
    '--store-shadow-floating': theme.tokens.shadowFloating,
    '--store-motion-duration': `calc(${parseFloat(theme.tokens.motionDuration) * 1000}ms * ${style.tokens.motionMultiplier})`,
    '--store-motion-ease': theme.tokens.motionEase,
    '--store-border-weight': style.tokens.borderWeight,
    '--store-type-scale': String(style.tokens.typeScaleMultiplier),
    '--store-card-padding': style.tokens.cardPadding,
    ...typographyToCssVars(typography),
    '--sf-font-display': typographyToCssVars(typography)['--sf-font-display'],
    '--sf-font-body': typographyToCssVars(typography)['--sf-font-body'],
    '--sf-radius': radii.md,
  };

  // Theme fonts as fallback when typography preset uses theme defaults
  if (typography === 'modern') {
    cssVars['--store-font-heading'] = theme.tokens.fontHeading;
    cssVars['--store-font-body'] = theme.tokens.fontBody;
    cssVars['--sf-font-display'] = theme.tokens.fontHeading;
    cssVars['--sf-font-body'] = theme.tokens.fontBody;
  }

  const componentVariants: ThemeComponentVariants = {
    ...theme.variants,
    productGrid: layout.productGrid,
    productCard: theme.variants.productCard,
  };

  return {
    themeId,
    styleId,
    layoutId,
    cssVars,
    componentVariants,
    dataAttributes: {
      theme: themeId,
      style: styleId,
      layout: layoutId,
    },
  };
}

/** Backward-compatible wrapper for existing themeToCssVars callers */
export function designExperienceToCssVars(
  config: StoreExperienceConfig,
  primaryColor?: string | null,
  secondaryColor?: string | null
): Record<string, string> {
  return resolveDesignExperience(config, primaryColor, secondaryColor).cssVars;
}
