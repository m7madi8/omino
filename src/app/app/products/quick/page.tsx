import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { QuickProductForm } from '@/components/merchant/quick-product-form';

export default async function QuickProductPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');
  if (!sessionHasPermission(session.user, 'products.write')) redirect('/app/products');

  return (
    <QuickProductForm
      currency={session.user.currency}
      storePublicSlug={session.user.storePublicSlug}
      storeName={session.user.storeName}
    />
  );
}
