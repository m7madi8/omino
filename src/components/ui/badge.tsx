import { cn } from '@/lib/utils';

type BadgeProps = {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'good' | 'danger' | 'muted';
  className?: string;
};

const variants = {
  default: 'bg-paper-2 text-ink border-hairline',
  accent: 'bg-accent-soft text-ink border-accent/20',
  good: 'bg-good/15 text-ink border-good/30',
  danger: 'bg-danger/10 text-danger border-danger/20',
  muted: 'bg-transparent text-stone-2 border-hairline',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
