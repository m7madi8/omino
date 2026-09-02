import { cn } from '@/lib/utils';
import type { ProductStatus } from '@/types/prisma-enums';

const STATUS_STYLES: Record<ProductStatus, string> = {
  ACTIVE: 'bg-good/15 text-good border-good/30',
  DRAFT: 'bg-paper-2 text-stone-2 border-hairline',
  ARCHIVED: 'bg-stone/10 text-stone border-hairline',
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border capitalize',
        STATUS_STYLES[status]
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}

export function StockBadge({
  available,
  isLowStock,
}: {
  available: number;
  isLowStock: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm font-mono',
        isLowStock ? 'text-danger' : 'text-ink'
      )}
    >
      {available}
      {isLowStock && (
        <span className="text-[10px] uppercase tracking-wide text-danger font-sans">Low</span>
      )}
    </span>
  );
}
