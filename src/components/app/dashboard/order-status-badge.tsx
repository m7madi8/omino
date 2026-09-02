import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-good/15 text-good',
  CANCELLED: 'bg-danger/15 text-danger',
  PENDING: 'bg-paper-2 text-stone-2',
  OPEN: 'bg-paper-2 text-stone-2',
  PAID: 'bg-good/15 text-good',
  REFUNDED: 'bg-danger/15 text-danger',
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex px-2 py-0.5 rounded-sm text-[10px] sm:text-xs font-mono uppercase tracking-wide',
        STATUS_STYLES[status] ?? 'bg-paper-2 text-stone-2'
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
