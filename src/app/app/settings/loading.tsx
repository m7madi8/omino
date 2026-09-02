import { Skeleton } from '@/components/ui/skeleton';
import { PageChrome } from '@/components/app/dashboard/page-chrome';

export default function SettingsLoading() {
  return (
    <PageChrome width="narrow" title="Settings">
      <div className="space-y-4">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-2/3" />
      </div>
    </PageChrome>
  );
}
