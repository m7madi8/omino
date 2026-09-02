import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AppShell } from '@/components/app/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (!session.user.onboardingComplete && !session.user.isPlatformAdmin) {
    redirect('/onboarding');
  }

  return <AppShell user={session.user}>{children}</AppShell>;
}
