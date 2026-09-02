import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { cardVariants } from '@/lib/design/cn-variants';

export function Card({
  children,
  className,
  title,
  description,
  variant = 'plain',
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  variant?: keyof typeof cardVariants;
}) {
  return (
    <div className={cn('rounded-sm p-6', cardVariants[variant], className)}>
      {(title || description) && (
        <div className="mb-5">
          {title && <h2 className="text-lg font-display tracking-tight">{title}</h2>}
          {description && <p className="mt-1 text-sm text-stone-2 leading-relaxed">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
