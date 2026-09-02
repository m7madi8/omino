import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api/tenant';
import {
  processScheduledJobs,
  retryFailedSteps,
} from '@/server/automation/execution-service';
import { processScheduledCampaigns } from '@/server/services/marketing/campaign-service';

export async function POST(request: Request) {
  try {
    const secret = process.env.AUTOMATION_CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    const isProduction = process.env.NODE_ENV === 'production';

    if (!secret) {
      if (isProduction) {
        return NextResponse.json({ error: 'CRON_NOT_CONFIGURED' }, { status: 503 });
      }
    } else if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const [jobsProcessed, retriesProcessed, campaigns] = await Promise.all([
      processScheduledJobs(50),
      retryFailedSteps(20),
      processScheduledCampaigns(),
    ]);

    return NextResponse.json({
      ok: true,
      jobsProcessed,
      retriesProcessed,
      campaigns,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
