import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/signup', '/api/auth', '/store', '/api/storefront'];
const MARKETING_PREFIX = '/main';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/storefront') ||
    pathname.startsWith('/store') ||
    pathname.startsWith(MARKETING_PREFIX) ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  const session = await auth();
  const isAuthed = Boolean(session?.user?.id);
  const onboardingComplete = session?.user?.onboardingComplete ?? false;

  if (pathname.startsWith('/app')) {
    if (!isAuthed) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (!onboardingComplete) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/onboarding')) {
    if (!isAuthed) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (onboardingComplete) {
      return NextResponse.redirect(new URL('/app', request.url));
    }
    return NextResponse.next();
  }

  if ((pathname === '/login' || pathname === '/signup') && isAuthed) {
    if (onboardingComplete) {
      return NextResponse.redirect(new URL('/app', request.url));
    }
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
