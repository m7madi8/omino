import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { listInventory, listStockLocations } from '@/server/services/inventory-service';
import { InventoryListClient } from '@/components/catalog/inventory-list';

export default async function InventoryPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');

  if (!sessionHasPermission(session.user, 'inventory.read')) {
    redirect('/app');
  }

  const [inventory, locations] = await Promise.all([
    listInventory({ organizationId: session.user.organizationId }),
    listStockLocations(session.user.organizationId),
  ]);

  return (
    <InventoryListClient
      initialItems={inventory.items}
      locations={locations.map((l) => ({ id: l.id, name: l.name }))}
      canWrite={sessionHasPermission(session.user, 'inventory.write')}
    />
  );
}
