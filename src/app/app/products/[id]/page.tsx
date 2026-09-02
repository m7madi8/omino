import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { getProductDetail } from '@/server/services/product-service';
import { ProductDetailClient } from '@/components/catalog/product-detail';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');

  if (!sessionHasPermission(session.user, 'products.read')) {
    redirect('/app');
  }

  const { id } = await params;

  try {
    const product = await getProductDetail(session.user.organizationId, id);
    return (
      <ProductDetailClient
        product={JSON.parse(JSON.stringify(product))}
        canWrite={sessionHasPermission(session.user, 'products.write')}
      />
    );
  } catch {
    notFound();
  }
}
