import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ className, label, error, id, ...props }: InputProps) {
  const inputId = id || props.name;
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
          'w-full h-11 rounded-sm border border-hairline bg-white px-4 text-sm text-ink placeholder:text-stone outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20',
          error && 'border-danger focus:border-danger focus:ring-danger/20',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
