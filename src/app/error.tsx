'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app-error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-svh bg-paper flex items-center justify-center p-6 font-body text-ink">
        <div className="max-w-md text-center space-y-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-stone">Error</p>
          <h1 className="text-3xl font-display">Something went wrong</h1>
          <p className="text-stone-2 text-sm leading-relaxed">
            An unexpected error occurred. Try again, or return to a safe page.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={reset}>Try again</Button>
            <Link href="/app">
              <Button variant="ghost">Go to Business OS</Button>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
