import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { PosClient } from '@/components/commerce/pos-terminal';
import { prisma } from '@/lib/db';

export default async function PosPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');

  if (!sessionHasPermission(session.user, 'pos.sell')) {
    redirect('/app');
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { currency: true },
  });

  return <PosClient currency={org?.currency || 'USD'} />;
}
