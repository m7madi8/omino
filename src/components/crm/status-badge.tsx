import { cn } from '@/lib/utils';
import type { CustomerSource, CustomerStatus } from '@/types/prisma-enums';

const STATUS_STYLES: Record<CustomerStatus, string> = {
  ACTIVE: 'bg-good/15 text-good border-good/30',
  INACTIVE: 'bg-paper-2 text-stone-2 border-hairline',
  BLOCKED: 'bg-danger/10 text-danger border-danger/30',
};

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
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

export function CustomerSourceBadge({ source }: { source: CustomerSource }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border bg-paper text-stone-2 border-hairline uppercase tracking-wide">
      {source.replace(/_/g, ' ')}
    </span>
  );
}
