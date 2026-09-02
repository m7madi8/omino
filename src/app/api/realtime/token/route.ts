import { NextResponse } from 'next/server';
import { requireOnboardedSession } from '@/lib/auth';
import { signRealtimeAccessToken } from '@/lib/supabase/jwt';
import { isSupabaseRealtimeConfigured } from '@/lib/supabase/config';

export async function GET() {
  try {
    if (!isSupabaseRealtimeConfigured()) {
      return NextResponse.json({ enabled: false, accessToken: null });
    }

    const session = await requireOnboardedSession();
    const accessToken = await signRealtimeAccessToken(session.user);
    if (!accessToken) {
      return NextResponse.json({ enabled: false, accessToken: null });
    }

    return NextResponse.json({
      enabled: true,
      accessToken,
      expiresIn: 3600,
    });
  } catch {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
}
