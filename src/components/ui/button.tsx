import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none',
        size === 'sm' && 'h-9 px-3 text-sm',
        size === 'md' && 'h-11 px-5 text-sm',
        size === 'lg' && 'h-12 px-6 text-base',
        variant === 'primary' && 'bg-ink text-paper hover:bg-ink-2 shadow-soft',
        variant === 'secondary' && 'bg-paper-2 text-ink hover:bg-hairline',
        variant === 'ghost' && 'bg-transparent text-ink hover:bg-paper-2 border border-hairline',
        variant === 'danger' && 'bg-danger text-white hover:opacity-90',
        className
      )}
      {...props}
    />
  );
}
