import { NextResponse } from 'next/server';
import { signIn } from '@/lib/auth';

const DEV_DEMO_EMAIL = 'demo@omino.test';

/**
 * Development-only: sign in and redirect to the dashboard without the login form.
 * Disabled in production.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  const url = new URL(request.url);
  const email = (url.searchParams.get('email') || DEV_DEMO_EMAIL).toLowerCase().trim();
  const password = process.env.DEV_DEMO_PASSWORD || 'OminoDemo2026!';
  const redirectTo = url.searchParams.get('redirect') || '/app';

  return signIn('credentials', {
    email,
    password,
    redirectTo,
  });
}
