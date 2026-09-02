import { TableSkeleton } from '@/components/app/dashboard/skeletons';

export default function ProductsLoading() {
  return (
    <div className="max-w-6xl space-y-4 sm:space-y-6">
      <div className="space-y-2 animate-pulse motion-reduce:animate-none">
        <div className="h-3 w-20 bg-hairline/70 rounded" />
        <div className="h-8 w-36 bg-hairline/80 rounded" />
      </div>
      <TableSkeleton rows={6} />
    </div>
  );
}
