import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <Card title={title}>
      <p className="text-sm text-stone-2 leading-relaxed">{description}</p>
      {action && (
        <Link href={action.href} className="inline-block mt-4">
          <Button size="sm">{action.label}</Button>
        </Link>
      )}
    </Card>
  );
}
