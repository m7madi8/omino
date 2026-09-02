import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { getVariantInventoryDetail } from '@/server/services/inventory-service';
import { InventoryDetailClient } from '@/components/catalog/inventory-detail';

export default async function InventoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');

  if (!sessionHasPermission(session.user, 'inventory.read')) {
    redirect('/app');
  }

  const { id } = await params;

  try {
    const variant = await getVariantInventoryDetail(session.user.organizationId, id);
    const serialized = JSON.parse(JSON.stringify(variant));
    return <InventoryDetailClient variant={serialized} />;
  } catch {
    notFound();
  }
}
