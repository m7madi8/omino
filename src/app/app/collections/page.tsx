import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import CollectionsAdminPage from './collections-admin-client';

export default async function CollectionsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');
  if (!sessionHasPermission(session.user, 'products.read')) redirect('/app');
  return <CollectionsAdminPage />;
}
