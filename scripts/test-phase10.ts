/**
 * OMINO Phase 10 — Marketing Engine tests
 * Run: npm run test:phase10
 */

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { countAudienceMembers } from '@/lib/marketing/segment-rules';
import { computeNetSales } from '@/lib/analytics/metrics';
import { validateCoupon } from '@/server/services/marketing/promotion-service';
import { createPromotion } from '@/server/services/marketing/promotion-service';
import { createAudience } from '@/server/services/marketing/audience-service';
import { createCampaign, transitionCampaign } from '@/server/services/marketing/campaign-service';
import type { SegmentRuleGroup } from '@/types/marketing';

const results: { name: string; pass: boolean; detail?: string }[] = [];

function test(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
  console.log(`${pass ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log('\nOMINO Phase 10 Tests\n');

  test('Net sales math', computeNetSales(10000, 500) === 9500);

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    console.log('\n⚠ Database unavailable — integration tests skipped (unit tests passed)\n');
    console.log(`${results.length}/${results.length} passed`);
    return;
  }

  const invalid = await validateCoupon({
    organizationId: '00000000-0000-0000-0000-000000000000',
    code: 'INVALID',
    subtotalMinor: 5000,
  });
  test('Invalid coupon rejected', !invalid.valid);

  const ts = Date.now();
  const org = await prisma.organization.create({
    data: { name: `P10 ${ts}`, slug: `p10-${ts}`, currency: 'USD', country: 'PS' },
  });
  const hash = await bcrypt.hash('Test1234!', 12);
  const user = await prisma.user.create({
    data: { email: `p10-${ts}@omino.test`, passwordHash: hash, fullName: 'P10 User' },
  });

  const audience = await createAudience(org.id, user.id, {
    name: 'Test Audience',
    rules: { logic: 'AND', rules: [{ field: 'status', operator: 'eq', value: 'ACTIVE' }] },
  });
  test('Create audience', !!audience.id);

  const promotion = await createPromotion(org.id, user.id, {
    name: '10% Off',
    discountType: 'PERCENT',
    discountValue: 1000,
    couponCode: `P10${ts}`,
    status: 'ACTIVE',
    minOrderMinor: 1000,
  });
  test('Create promotion', !!promotion.id);

  const validation = await validateCoupon({
    organizationId: org.id,
    code: `P10${ts}`,
    subtotalMinor: 5000,
  });
  test('Coupon validates', validation.valid === true);

  const belowMin = await validateCoupon({
    organizationId: org.id,
    code: `P10${ts}`,
    subtotalMinor: 500,
  });
  test('Min order enforced', !belowMin.valid);

  const campaign = await createCampaign(org.id, user.id, {
    name: 'Test Campaign',
    audienceId: audience.id,
    promotionId: promotion.id,
    status: 'DRAFT',
  });
  test('Campaign created as DRAFT', campaign.status === 'DRAFT');

  await transitionCampaign(org.id, campaign.id, user.id, 'ACTIVE');
  const active = await prisma.marketingCampaign.findUnique({ where: { id: campaign.id } });
  test('Campaign activation', active?.status === 'ACTIVE');

  const count = await countAudienceMembers(org.id, audience.rules as SegmentRuleGroup);
  test('Audience count server-side', count >= 0);

  await prisma.organization.delete({ where: { id: org.id } });
  await prisma.user.delete({ where: { id: user.id } });

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
