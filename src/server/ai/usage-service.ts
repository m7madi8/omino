import { prisma } from '@/lib/db';

export async function recordUsage(params: {
  organizationId: string;
  userId: string;
  conversationId?: string;
  provider: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  toolCallCount?: number;
  status: string;
}) {
  return prisma.aiUsage.create({
    data: {
      organizationId: params.organizationId,
      userId: params.userId,
      conversationId: params.conversationId,
      provider: params.provider,
      model: params.model,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      toolCallCount: params.toolCallCount ?? 0,
      status: params.status,
    },
  });
}

export async function getUsageSummary(organizationId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [count, totals] = await Promise.all([
    prisma.aiUsage.count({
      where: { organizationId, createdAt: { gte: since } },
    }),
    prisma.aiUsage.aggregate({
      where: { organizationId, createdAt: { gte: since } },
      _sum: { inputTokens: true, outputTokens: true, toolCallCount: true },
    }),
  ]);

  return {
    requestCount: count,
    inputTokens: totals._sum.inputTokens ?? 0,
    outputTokens: totals._sum.outputTokens ?? 0,
    toolCallCount: totals._sum.toolCallCount ?? 0,
  };
}
