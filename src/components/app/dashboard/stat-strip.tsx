import Link from 'next/link';
import { cn } from '@/lib/utils';

export function StatStrip({
  items,
  className,
}: {
  items: { label: string; value: string; href?: string; sublabel?: string }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex gap-px overflow-x-auto scrollbar-thin rounded-sm border border-hairline bg-hairline',
        className
      )}
    >
      {items.map((item, i) => {
        const inner = (
          <>
            <p className="text-lg sm:text-xl font-display font-medium tracking-tight truncate">
              {item.value}
            </p>
            <p className="text-xs text-stone-2 mt-0.5 truncate">{item.label}</p>
            {item.sublabel && (
              <p className="text-[10px] text-stone mt-0.5 truncate">{item.sublabel}</p>
            )}
          </>
        );
        const cellClass =
          'flex-1 min-w-[120px] bg-white px-4 py-3 hover:bg-paper transition-colors';

        if (item.href) {
          return (
            <Link key={i} href={item.href} className={cellClass}>
              {inner}
            </Link>
          );
        }
        return (
          <div key={i} className={cellClass}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
