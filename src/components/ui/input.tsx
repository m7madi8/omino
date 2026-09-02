import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string | boolean;
  success?: boolean;
};

export function Input({ className, label, error, success, id, ...props }: InputProps) {
  const inputId = id || props.name;
  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : undefined;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-stone-2">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'flex h-11 w-full rounded-sm border bg-white px-4 text-sm text-ink transition-colors duration-200',
          'placeholder:text-stone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          hasError && 'border-danger focus-visible:ring-danger',
          success && 'border-good focus-visible:ring-good',
          !hasError && !success && 'border-hairline',
          className
        )}
        {...props}
      />
      {errorMessage && <p className="text-xs text-danger">{errorMessage}</p>}
    </div>
  );
}
