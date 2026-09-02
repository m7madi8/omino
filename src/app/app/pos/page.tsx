import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { PosClient } from '@/components/commerce/pos-terminal';
import { isSimpleMode } from '@/lib/merchant/palestine-mode';

export default async function PosPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');

  if (!sessionHasPermission(session.user, 'pos.sell')) {
    redirect('/app');
  }

  const params = await searchParams;
  const simpleMode =
    params.mode === 'simple' || isSimpleMode(session.user.merchantExperienceMode);

  return <PosClient currency={session.user.currency} simpleMode={simpleMode} />;
}
