import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import StoreAdminPage from './store-admin-client';

export default async function StorePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!sessionHasPermission(session.user, 'store.read')) redirect('/app');
  return <StoreAdminPage />;
}
