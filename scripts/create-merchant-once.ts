import { createUser } from '@/server/services/auth-service';
import {
  createOrganizationWithDefaults,
  ensurePermissions,
} from '@/server/services/organization-service';
import { prisma } from '@/lib/db';
import { buildSessionUser } from '@/server/repositories/user-repository';

const email = process.argv[2] ?? 'eslamhuhu1@gmail.om';
const password = process.argv[3] ?? '408809937';
const fullName = process.argv[4] ?? 'Eslam';

async function main() {
  let user;
  try {
    user = await createUser({ email, password, fullName });
    console.log('User created:', user.id);
  } catch (e) {
    if (e instanceof Error && e.message === 'EMAIL_EXISTS') {
      user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (!user) throw e;
      console.log('User already exists:', user.id);
    } else {
      throw e;
    }
  }

  const membership = await prisma.membership.findFirst({ where: { userId: user.id } });
  if (membership) {
    const session = await buildSessionUser(user.id);
    console.log(
      JSON.stringify(
        {
          status: 'exists',
          email: session?.email,
          organization: session?.organizationName,
          role: session?.roleSlug,
          onboardingComplete: session?.onboardingComplete,
        },
        null,
        2
      )
    );
    return;
  }

  await ensurePermissions();

  const result = await createOrganizationWithDefaults({
    userId: user.id,
    name: `${fullName} Store`,
    businessType: 'retail',
    country: 'PS',
    currency: 'ILS',
    storeName: `${fullName} Store`,
    branchName: 'Main Branch',
  });

  const session = await buildSessionUser(user.id);
  console.log(
    JSON.stringify(
      {
        status: 'created',
        email: session?.email,
        organization: session?.organizationName,
        store: session?.storeName,
        branch: session?.branchName,
        role: session?.roleSlug,
        onboardingComplete: session?.onboardingComplete,
        organizationId: result.organization.id,
        storeId: result.store.id,
        branchId: result.branch.id,
      },
      null,
      2
    )
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
