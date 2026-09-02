import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { allowedCountrySchema } from '@/lib/geo/allowed-countries';
import { buildSessionUser } from '@/server/repositories/user-repository';
import { createOrganizationWithDefaults } from '@/server/services/organization-service';

const onboardingSchema = z.object({
  businessName: z.string().min(2).max(120),
  businessType: z.string().min(2).max(40),
  country: allowedCountrySchema,
  currency: z.string().length(3),
  storeName: z.string().min(2).max(120).optional(),
  branchName: z.string().min(2).max(120).optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const sessionUser = await buildSessionUser(session.user.id);
    return NextResponse.json({
      onboardingComplete: sessionUser?.onboardingComplete ?? false,
    });
  } catch (err) {
    console.error('[onboarding/status]', err);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    if (session.user.onboardingComplete) {
      return NextResponse.json({ error: 'ALREADY_ONBOARDED' }, { status: 400 });
    }

    const body = await request.json();
    const data = onboardingSchema.parse(body);

    const result = await createOrganizationWithDefaults({
      userId: session.user.id,
      name: data.businessName,
      businessType: data.businessType,
      country: data.country,
      currency: data.currency,
      storeName: data.storeName,
      branchName: data.branchName,
    });

    const sessionUser = await buildSessionUser(session.user.id);

    return NextResponse.json({
      ok: true,
      onboardingComplete: sessionUser?.onboardingComplete ?? false,
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'VALIDATION', details: err.flatten() }, { status: 400 });
    }
    console.error('[onboarding]', err);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}
