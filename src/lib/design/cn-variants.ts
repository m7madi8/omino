import { cn } from '@/lib/utils';

type VariantMap = Record<string, string>;

export function variantClass(
  base: string,
  variants: VariantMap,
  key: string | undefined,
  fallback: string
): string {
  return cn(base, variants[key ?? ''] ?? variants[fallback] ?? '');
}

export const buttonVariants = {
  primary:
    'bg-ink text-paper hover:bg-ink-2 active:scale-[0.98] shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
  secondary:
    'bg-paper-2 text-ink hover:bg-hairline active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
  ghost:
    'bg-transparent text-ink hover:bg-paper-2 border border-hairline active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
  danger:
    'bg-danger text-white hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2',
} as const;

export const buttonSizes = {
  sm: 'h-9 px-3 text-sm min-h-[36px]',
  md: 'h-11 px-5 text-sm min-h-[44px]',
  lg: 'h-12 px-6 text-base min-h-[48px]',
  icon: 'h-11 w-11 min-h-[44px] min-w-[44px] p-0',
} as const;

export const cardVariants = {
  plain: 'bg-white border border-hairline',
  inset: 'bg-paper border-0',
  interactive:
    'bg-white border border-hairline hover:border-stone/40 hover:shadow-soft transition-all duration-200 cursor-pointer',
} as const;
