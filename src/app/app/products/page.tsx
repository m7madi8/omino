import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { listProducts } from '@/server/services/product-service';
import { ProductsListClient } from '@/components/catalog/products-list';

export default async function ProductsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');

  if (!sessionHasPermission(session.user, 'products.read')) {
    redirect('/app');
  }

  const { items, total } = await listProducts({
    organizationId: session.user.organizationId,
    storeId: session.user.storeId || undefined,
  });

  return (
    <ProductsListClient
      initialItems={items}
      initialTotal={total}
      canWrite={sessionHasPermission(session.user, 'products.write')}
    />
  );
}
