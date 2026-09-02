import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { getCustomerDetail } from '@/server/services/customer-timeline-service';
import { CustomerDetailClient } from '@/components/crm/customer-detail';
import { prisma } from '@/lib/db';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');

  if (!sessionHasPermission(session.user, 'customers.read')) {
    redirect('/app');
  }

  const { id } = await params;

  try {
    const customer = await getCustomerDetail(session.user.organizationId, id);
    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { currency: true },
    });

    return (
      <CustomerDetailClient
        customer={customer}
        currency={org?.currency || 'USD'}
        canWrite={sessionHasPermission(session.user, 'customers.write')}
        canManageNotes={sessionHasPermission(session.user, 'customers.manage_notes')}
        canManageTags={sessionHasPermission(session.user, 'customers.manage_tags')}
      />
    );
  } catch {
    notFound();
  }
}
