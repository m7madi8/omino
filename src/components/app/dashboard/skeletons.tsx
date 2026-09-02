import { cn } from '@/lib/utils';

export function ListSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3 motion-reduce:animate-none', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-md border border-hairline bg-white p-4 animate-pulse motion-reduce:animate-none"
        >
          <div className="flex justify-between gap-3">
            <div className="h-4 w-28 bg-hairline/80 rounded" />
            <div className="h-4 w-16 bg-hairline/60 rounded" />
          </div>
          <div className="mt-3 h-3 w-full max-w-xs bg-hairline/50 rounded" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="max-w-6xl space-y-6 animate-pulse motion-reduce:animate-none">
      <div className="space-y-2">
        <div className="h-3 w-20 bg-hairline/70 rounded" />
        <div className="h-8 w-48 sm:w-64 bg-hairline/80 rounded" />
        <div className="h-4 w-36 bg-hairline/50 rounded" />
      </div>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 sm:h-24 rounded-md bg-hairline/60" />
        ))}
      </div>
      <ListSkeleton rows={4} />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-md border border-hairline bg-white overflow-hidden animate-pulse motion-reduce:animate-none">
      <div className="hidden md:block p-4 space-y-3">
        <div className="h-4 w-full bg-hairline/50 rounded" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 w-full bg-hairline/30 rounded" />
        ))}
      </div>
      <div className="md:hidden p-3 space-y-3">
        <ListSkeleton rows={3} />
      </div>
    </div>
  );
}
