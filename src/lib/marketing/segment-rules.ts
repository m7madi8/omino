import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import type { Prisma as PrismaTypes } from '@prisma/client';
import type { SegmentRule, SegmentRuleGroup } from '@/types/marketing';

export function isRuleGroup(rule: SegmentRule | SegmentRuleGroup): rule is SegmentRuleGroup {
  return 'logic' in rule && 'rules' in rule;
}

function applyCustomerFieldRule(
  where: PrismaTypes.CustomerWhereInput,
  rule: SegmentRule
): PrismaTypes.CustomerWhereInput {
  const v = rule.value;
  switch (rule.field) {
    case 'status':
      if (rule.operator === 'eq') return { ...where, status: String(v) as never };
      break;
    case 'source':
      if (rule.operator === 'eq') return { ...where, source: String(v) as never };
      break;
    case 'tag':
    case 'tagId':
      if (rule.operator === 'eq' || rule.operator === 'contains') {
        return { ...where, tagLinks: { some: { tagId: String(v) } } };
      }
      if (rule.operator === 'in' && Array.isArray(v)) {
        return { ...where, tagLinks: { some: { tagId: { in: v } } } };
      }
      break;
    case 'createdDaysAgo':
      if (typeof v === 'number') {
        const since = new Date();
        since.setDate(since.getDate() - v);
        if (rule.operator === 'gte') return { ...where, createdAt: { lte: since } };
        if (rule.operator === 'lte') return { ...where, createdAt: { gte: since } };
      }
      break;
    case 'country':
      if (rule.operator === 'eq') {
        return { ...where, addresses: { some: { country: String(v) } } };
      }
      break;
  }
  return where;
}

async function getBehavioralCustomerIds(
  organizationId: string,
  rule: SegmentRule
): Promise<Set<string>> {
  const num = typeof rule.value === 'number' ? rule.value : Number(rule.value);
  if (Number.isNaN(num)) return new Set();

  if (rule.field === 'completedOrders') {
    const opSql =
      rule.operator === 'gte'
        ? Prisma.sql`>=`
        : rule.operator === 'gt'
          ? Prisma.sql`>`
          : rule.operator === 'lte'
            ? Prisma.sql`<=`
            : Prisma.sql`=`;
    const rows = await prisma.$queryRaw<{ customer_id: string }[]>`
      SELECT customer_id FROM orders
      WHERE organization_id = ${organizationId}::uuid
        AND status = 'COMPLETED'
        AND customer_id IS NOT NULL
      GROUP BY customer_id
      HAVING COUNT(*) ${opSql} ${num}
    `;
    return new Set(rows.map((r) => r.customer_id));
  }

  if (rule.field === 'totalSpendMinor') {
    const op =
      rule.operator === 'gte' ? '>=' : rule.operator === 'gt' ? '>' : rule.operator === 'lte' ? '<=' : '=';
    const rows = await prisma.$queryRaw<{ customer_id: string }[]>`
      SELECT customer_id FROM orders
      WHERE organization_id = ${organizationId}::uuid
        AND status = 'COMPLETED'
        AND customer_id IS NOT NULL
      GROUP BY customer_id
      HAVING SUM(total_minor) ${Prisma.raw(op)} ${num}
    `;
    return new Set(rows.map((r) => r.customer_id));
  }

  if (rule.field === 'daysSinceLastOrder') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - num);
    const cmp = rule.operator === 'gte' ? Prisma.sql`<=` : Prisma.sql`<`;
    const rows = await prisma.$queryRaw<{ customer_id: string }[]>`
      SELECT customer_id FROM orders
      WHERE organization_id = ${organizationId}::uuid
        AND status = 'COMPLETED'
        AND customer_id IS NOT NULL
      GROUP BY customer_id
      HAVING MAX(COALESCE(completed_at, created_at)) ${cmp} ${cutoff}
    `;
    return new Set(rows.map((r) => r.customer_id));
  }

  if (rule.field === 'orderSource') {
    const rows = await prisma.order.findMany({
      where: {
        organizationId,
        status: 'COMPLETED',
        source: String(rule.value) as never,
        customerId: { not: null },
      },
      select: { customerId: true },
      distinct: ['customerId'],
    });
    return new Set(rows.map((r) => r.customerId!).filter(Boolean));
  }

  if (rule.field === 'purchasedProductId') {
    const rows = await prisma.orderItem.findMany({
      where: {
        productId: String(rule.value),
        order: { organizationId, status: 'COMPLETED' },
      },
      select: { order: { select: { customerId: true } } },
    });
    return new Set(rows.map((r) => r.order.customerId).filter((id): id is string => !!id));
  }

  if (rule.field === 'purchasedCategoryId') {
    const rows = await prisma.orderItem.findMany({
      where: {
        product: { categoryId: String(rule.value) },
        order: { organizationId, status: 'COMPLETED' },
      },
      select: { order: { select: { customerId: true } } },
    });
    return new Set(rows.map((r) => r.order.customerId).filter((id): id is string => !!id));
  }

  return new Set();
}

async function evaluateRuleGroup(
  organizationId: string,
  group: SegmentRuleGroup,
  storeId?: string
): Promise<Set<string>> {
  const results: Set<string>[] = [];

  for (const rule of group.rules) {
    if (isRuleGroup(rule)) {
      results.push(await evaluateRuleGroup(organizationId, rule, storeId));
      continue;
    }

    const behavioral = [
      'completedOrders',
      'totalSpendMinor',
      'daysSinceLastOrder',
      'orderSource',
      'purchasedProductId',
      'purchasedCategoryId',
    ];
    if (behavioral.includes(rule.field)) {
      results.push(await getBehavioralCustomerIds(organizationId, rule));
      continue;
    }

    let where: PrismaTypes.CustomerWhereInput = {
      organizationId,
      deletedAt: null,
      isWalkIn: false,
      ...(storeId && { orders: { some: { storeId } } }),
    };
    where = applyCustomerFieldRule(where, rule);
    const customers = await prisma.customer.findMany({ where, select: { id: true } });
    results.push(new Set(customers.map((c) => c.id)));
  }

  if (!results.length) return new Set();

  if (group.logic === 'OR') {
    const union = new Set<string>();
    for (const s of results) for (const id of s) union.add(id);
    return union;
  }

  let intersection = results[0];
  for (let i = 1; i < results.length; i++) {
    intersection = new Set([...intersection].filter((id) => results[i].has(id)));
  }
  return intersection;
}

export async function countAudienceMembers(
  organizationId: string,
  rules: SegmentRuleGroup,
  storeId?: string
): Promise<number> {
  const ids = await evaluateRuleGroup(organizationId, rules, storeId);
  return ids.size;
}

export async function listAudienceMemberIds(
  organizationId: string,
  rules: SegmentRuleGroup,
  storeId?: string,
  limit = 100
): Promise<string[]> {
  const ids = await evaluateRuleGroup(organizationId, rules, storeId);
  return [...ids].slice(0, limit);
}

export async function customerMatchesAudience(
  organizationId: string,
  customerId: string,
  rules: SegmentRuleGroup,
  storeId?: string
): Promise<boolean> {
  const ids = await evaluateRuleGroup(organizationId, rules, storeId);
  return ids.has(customerId);
}
