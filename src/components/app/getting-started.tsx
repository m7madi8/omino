import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Package, ShoppingCart, Store, Users, Warehouse } from 'lucide-react';

const ACTIONS = [
  {
    href: '/app/products/new',
    label: 'Add your first product',
    description: 'Create products and variants for POS and your store.',
    icon: Package,
  },
  {
    href: '/app/inventory',
    label: 'Set up inventory',
    description: 'Track stock levels and low-stock alerts.',
    icon: Warehouse,
  },
  {
    href: '/app/pos',
    label: 'Open POS',
    description: 'Start selling in person with the point of sale.',
    icon: ShoppingCart,
  },
  {
    href: '/app/store',
    label: 'Customize your store',
    description: 'Configure your online storefront settings.',
    icon: Store,
  },
  {
    href: '/app/customers',
    label: 'Add customers',
    description: 'Build your customer base for repeat business.',
    icon: Users,
  },
] as const;

export function GettingStarted() {
  return (
    <Card title="Get your business running">
      <p className="text-sm text-stone-2 mb-4">
        You&apos;re set up. Complete these steps to start selling and tracking performance.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {ACTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex gap-3 p-4 rounded-md border border-hairline hover:border-accent/30 transition"
            >
              <Icon className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-stone-2 mt-1">{item.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
