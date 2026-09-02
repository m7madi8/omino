import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { getAnalyticsOverview } from '@/server/services/analytics/analytics-service';
import { AnalyticsWorkspace } from '@/components/analytics/analytics-workspace';

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');
  if (!sessionHasPermission(session.user, 'analytics.read')) redirect('/app');

  const { prisma } = await import('@/lib/db');
  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { currency: true },
  });

  const overview = await getAnalyticsOverview({
    organizationId: session.user.organizationId,
    storeId: session.user.storeId ?? undefined,
    branchId: session.user.branchId ?? undefined,
    preset: 'last_30_days',
    currency: org?.currency || 'USD',
  });

  return <AnalyticsWorkspace initialData={overview} />;
}
