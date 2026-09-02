import Link from 'next/link';
import { cn } from '@/lib/utils';

export function DataListRow({
  title,
  subtitle,
  meta,
  badge,
  actions,
  href,
  className,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  href?: string;
  className?: string;
}) {
  const content = (
    <div
      className={cn(
        'flex items-start justify-between gap-3 py-3.5 px-4 border-b border-hairline last:border-0',
        href && 'hover:bg-paper transition-colors',
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm truncate">{title}</p>
          {badge}
        </div>
        {subtitle && <p className="text-xs text-stone-2 mt-0.5 truncate">{subtitle}</p>}
        {meta && <p className="text-[11px] text-stone mt-1 font-mono">{meta}</p>}
      </div>
      {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export function DataList({
  children,
  className,
  empty,
}: {
  children: React.ReactNode;
  className?: string;
  empty?: React.ReactNode;
}) {
  const isEmpty = !children;
  return (
    <div className={cn('rounded-sm border border-hairline bg-white overflow-hidden', className)}>
      {isEmpty && empty ? empty : children}
    </div>
  );
}
