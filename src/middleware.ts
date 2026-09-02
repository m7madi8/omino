import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

type MiddlewareToken = {
  sub?: string;
  sessionUser?: {
    onboardingComplete?: boolean;
    isPlatformAdmin?: boolean;
  };
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = (await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  })) as MiddlewareToken | null;

  const isAuthed = Boolean(token?.sub);
  const onboardingComplete = token?.sessionUser?.onboardingComplete ?? false;
  const isPlatformAdmin = token?.sessionUser?.isPlatformAdmin ?? false;

  if (pathname.startsWith('/app')) {
    if (!isAuthed) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (!onboardingComplete && !isPlatformAdmin) {
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
    if (onboardingComplete || isPlatformAdmin) {
      return NextResponse.redirect(new URL('/app', request.url));
    }
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/onboarding', '/onboarding/:path*', '/login', '/signup'],
};
