import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function Card({
  children,
  className,
  title,
  description,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}) {
  return (
    <div className={cn('rounded-md border border-hairline bg-white p-6 shadow-soft', className)}>
      {(title || description) && (
        <div className="mb-5">
          {title && <h2 className="text-lg font-display">{title}</h2>}
          {description && <p className="mt-1 text-sm text-stone-2">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
