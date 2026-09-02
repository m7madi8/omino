import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/app/dashboard/page-header';

type PageChromeProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
  width?: 'narrow' | 'default' | 'wide';
  children: React.ReactNode;
  className?: string;
};

const widthClass = {
  narrow: 'max-w-[var(--page-width-narrow)]',
  default: 'max-w-[var(--page-width-default)]',
  wide: 'max-w-[var(--page-width-wide)]',
};

export function PageChrome({
  eyebrow,
  title,
  description,
  actions,
  tabs,
  width = 'default',
  children,
  className,
}: PageChromeProps) {
  return (
    <div className={cn('mx-auto w-full space-y-6', widthClass[width], className)}>
      <PageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} />
      {tabs}
      {children}
    </div>
  );
}
