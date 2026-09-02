import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { buttonSizes, buttonVariants } from '@/lib/design/cn-variants';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  loading?: boolean;
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none',
        buttonSizes[size],
        buttonVariants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
