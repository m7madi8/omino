'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AppSectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app-section-error]', error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto py-16 text-center space-y-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-stone">Error</p>
      <h1 className="text-2xl font-display">Could not load this section</h1>
      <p className="text-stone-2 text-sm leading-relaxed">
        {process.env.NODE_ENV === 'development'
          ? error.message
          : 'An unexpected error occurred. Try again or pick another section from the sidebar.'}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/app">
          <Button variant="ghost">Back to Overview</Button>
        </Link>
      </div>
    </div>
  );
}
