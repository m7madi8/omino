import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { buildSessionUser } from '@/server/repositories/user-repository';
import { verifyCredentials } from '@/server/services/auth-service';
import type { SessionUser } from '@/types';

declare module 'next-auth' {
  interface Session {
    user: SessionUser;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    sub: string;
    sessionUser?: SessionUser;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await verifyCredentials(parsed.data.email, parsed.data.password);
        if (!user) return null;

        return { id: user.id, email: user.email, name: user.fullName };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      const userId = user?.id || token.sub;
      if (!userId) return token;

      const shouldRefresh =
        Boolean(user) ||
        trigger === 'update' ||
        !token.sessionUser ||
        token.sessionUser.onboardingComplete === false;

      if (shouldRefresh) {
        const sessionUser = await buildSessionUser(userId);
        if (sessionUser) token.sessionUser = sessionUser;
      }

      return token;
    },
    async session({ session, token }) {
      if (token.sessionUser) {
        session.user = token.sessionUser as typeof session.user;
      }
      return session;
    },
  },
});

export async function getServerSession() {
  return auth();
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('UNAUTHORIZED');
  return session;
}

export async function requireOnboardedSession() {
  const session = await requireSession();
  if (!session.user.onboardingComplete) throw new Error('ONBOARDING_REQUIRED');
  return session;
}
