import { prisma } from '@/lib/db';
import {
  getBusinessSignals,
  getSalesSummary,
  resolveDateRange,
} from '@/server/services/analytics-service';
import type { BusinessContextSnapshot } from '@/types/ai';

export async function buildBusinessContext(params: {
  organizationId: string;
  storeId: string | null;
  branchId: string | null;
  intent?: 'sales' | 'inventory' | 'customers' | 'general';
}): Promise<BusinessContextSnapshot> {
  const org = await prisma.organization.findUnique({
    where: { id: params.organizationId },
    select: {
      id: true,
      name: true,
      currency: true,
      businessType: true,
    },
  });

  if (!org) throw new Error('NOT_FOUND');

  let store: { id: string; name: string } | null = null;
  let branch: { id: string; name: string } | null = null;

  if (params.storeId) {
    const s = await prisma.store.findFirst({
      where: { id: params.storeId, organizationId: params.organizationId },
      select: { id: true, name: true },
    });
    if (s) store = s;
  }

  if (params.branchId) {
    const b = await prisma.branch.findFirst({
      where: {
        id: params.branchId,
        store: { organizationId: params.organizationId },
      },
      select: { id: true, name: true },
    });
    if (b) branch = b;
  }

  const snapshot: BusinessContextSnapshot = {
    organization: {
      id: org.id,
      name: org.name,
      currency: org.currency,
      businessType: org.businessType,
    },
    store,
    branch,
  };

  const intent = params.intent ?? 'general';

  if (intent === 'sales' || intent === 'general') {
    const range = resolveDateRange('this_month');
    const sales = await getSalesSummary(
      params.organizationId,
      range,
      params.storeId ?? undefined
    );
    snapshot.sales = {
      revenueMinor: sales.revenueMinor,
      orderCount: sales.orderCount,
      averageOrderValueMinor: sales.averageOrderValueMinor,
      periodLabel: sales.period,
    };
  }

  if (intent === 'general') {
    snapshot.signals = await getBusinessSignals(
      params.organizationId,
      params.storeId ?? undefined
    );
  }

  return snapshot;
}

export function contextToSystemPrompt(ctx: BusinessContextSnapshot): string {
  const lines = [
    `Organization: ${ctx.organization.name} (${ctx.organization.currency})`,
  ];
  if (ctx.store) lines.push(`Store: ${ctx.store.name}`);
  if (ctx.branch) lines.push(`Branch: ${ctx.branch.name}`);
  if (ctx.sales) {
    lines.push(
      `Sales (${ctx.sales.periodLabel}): ${ctx.sales.orderCount} orders, revenue ${ctx.sales.revenueMinor / 100} ${ctx.organization.currency}`
    );
  }
  if (ctx.signals?.length) {
    lines.push('Signals: ' + ctx.signals.map((s) => s.message).join('; '));
  }
  return lines.join('\n');
}

export function inferContextIntent(message: string): 'sales' | 'inventory' | 'customers' | 'general' {
  if (/stock|inventory|low|مخزون|نفد/i.test(message)) return 'inventory';
  if (/customer|who|عميل|زبون|عملاء/i.test(message)) return 'customers';
  if (/sales|revenue|order|مبيعات|إيراد|طلب/i.test(message)) return 'sales';
  return 'general';
}
