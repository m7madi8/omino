'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export function Sheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        role="dialog"
        aria-modal
        aria-label={title}
        className={cn(
          'relative z-50 w-full max-h-[90vh] overflow-y-auto bg-white border border-hairline shadow-lift',
          'rounded-t-lg sm:rounded-lg sm:max-w-lg',
          'animate-[sheet-up_0.28s_var(--ease)_both]',
          'pb-[env(safe-area-inset-bottom)]',
          className
        )}
      >
        {title && (
          <div className="sticky top-0 flex items-center justify-between border-b border-hairline bg-white px-4 py-3">
            <h2 className="font-display text-base">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-sm hover:bg-paper-2"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
