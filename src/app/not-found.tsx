import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-svh bg-paper flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-stone">404</p>
        <h1 className="text-3xl font-display">Page not found</h1>
        <p className="text-stone-2 text-sm leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/app">
            <Button>Go to Business OS</Button>
          </Link>
          <Link href="/main">
            <Button variant="ghost">Back to website</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
