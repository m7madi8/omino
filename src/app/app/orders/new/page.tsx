import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { ManualOrderForm } from '@/components/merchant/manual-order-form';

export default async function NewManualOrderPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');
  if (!sessionHasPermission(session.user, 'orders.write')) redirect('/app/orders');

  return <ManualOrderForm />;
}
