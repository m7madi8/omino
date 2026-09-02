/** Platform (merchant dashboard) design tokens — single source of truth */

export const platformColors = {
  ink: '#070809',
  ink2: '#101214',
  paper: '#f4f5f6',
  paper2: '#e8eaec',
  stone: '#85898d',
  stone2: '#5d6267',
  hairline: '#d7dadd',
  hairlineDark: '#292d31',
  accent: '#5b7cff',
  accentSoft: '#cbd3ff',
  good: '#63d6a0',
  danger: '#c45b5b',
} as const;

export const platformSpacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
} as const;

export const platformRadii = {
  none: '0',
  xs: '6px',
  sm: '10px',
  md: '14px',
  lg: '20px',
  full: '9999px',
} as const;

export const platformShadows = {
  none: 'none',
  soft: '0 18px 40px -28px rgba(7, 8, 9, 0.16)',
  lift: '0 28px 56px -32px rgba(7, 8, 9, 0.2)',
  inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
} as const;

export const platformMotion = {
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
  durationFast: '150ms',
  durationNormal: '200ms',
  durationSlow: '350ms',
} as const;

export const platformBreakpoints = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1440,
} as const;

export const platformPageWidths = {
  narrow: '42rem',   /* max-w-2xl — today, orders */
  default: '72rem',  /* max-w-6xl — overview, store */
  wide: '80rem',
} as const;

export const platformZIndex = {
  base: 0,
  sticky: 10,
  nav: 20,
  overlay: 30,
  modal: 40,
  toast: 50,
} as const;

/** CSS custom properties for injection into :root */
export function platformCssVars(): Record<string, string> {
  return {
    '--ink': platformColors.ink,
    '--ink-2': platformColors.ink2,
    '--paper': platformColors.paper,
    '--paper-2': platformColors.paper2,
    '--stone': platformColors.stone,
    '--stone-2': platformColors.stone2,
    '--hairline': platformColors.hairline,
    '--hairline-dark': platformColors.hairlineDark,
    '--accent': platformColors.accent,
    '--accent-soft': platformColors.accentSoft,
    '--good': platformColors.good,
    '--danger': platformColors.danger,
    '--ease': platformMotion.ease,
    '--duration-fast': platformMotion.durationFast,
    '--duration-normal': platformMotion.durationNormal,
    '--duration-slow': platformMotion.durationSlow,
    '--page-width-narrow': platformPageWidths.narrow,
    '--page-width-default': platformPageWidths.default,
    '--page-width-wide': platformPageWidths.wide,
    '--radius-xs': platformRadii.xs,
    '--radius-sm': platformRadii.sm,
    '--radius-md': platformRadii.md,
    '--radius-lg': platformRadii.lg,
    '--shadow-soft': platformShadows.soft,
    '--shadow-lift': platformShadows.lift,
  };
}
