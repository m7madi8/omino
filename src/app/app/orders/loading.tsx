import { TableSkeleton } from '@/components/app/dashboard/skeletons';

export default function OrdersLoading() {
  return (
    <div className="max-w-[var(--page-width-narrow)] mx-auto space-y-4 sm:space-y-6">
      <div className="space-y-2 animate-pulse motion-reduce:animate-none">
        <div className="h-3 w-16 bg-hairline/70 rounded" />
        <div className="h-8 w-40 bg-hairline/80 rounded" />
      </div>
      <div className="h-11 w-full bg-hairline/50 rounded-sm animate-pulse" />
      <TableSkeleton rows={5} />
    </div>
  );
}
