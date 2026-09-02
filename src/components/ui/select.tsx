import { cn } from '@/lib/utils';
import type { SelectHTMLAttributes } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
};

export function Select({ className, label, error, id, options, ...props }: SelectProps) {
  const selectId = id || props.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-stone-2">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full h-11 rounded-sm border border-hairline bg-white px-4 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20',
          error && 'border-danger',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
