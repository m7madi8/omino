'use client';

import { cn } from '@/lib/utils';

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="sf-skeleton aspect-[4/5] w-full rounded-sm" />
      <div className="sf-skeleton h-3 w-16 rounded-sm" />
      <div className="sf-skeleton h-5 w-3/4 rounded-sm" />
      <div className="sf-skeleton h-4 w-20 rounded-sm" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-12 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            i === 0 ? 'col-span-12 sm:col-span-7' : 'col-span-6 sm:col-span-5'
          )}
        >
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}
