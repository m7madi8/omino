import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { searchCustomers } from '@/server/services/customer-search-service';
import { CustomersListClient } from '@/components/crm/customers-list';
import { prisma } from '@/lib/db';

export default async function CustomersPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');

  if (!sessionHasPermission(session.user, 'customers.read')) {
    redirect('/app');
  }

  const { items, total } = await searchCustomers({
    organizationId: session.user.organizationId,
  });

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { currency: true },
  });

  return (
    <CustomersListClient
      initialItems={items}
      initialTotal={total}
      currency={org?.currency || 'USD'}
      canWrite={sessionHasPermission(session.user, 'customers.write')}
    />
  );
}
