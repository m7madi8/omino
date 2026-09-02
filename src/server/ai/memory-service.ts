import { prisma } from '@/lib/db';
import type { AiMemoryCategory } from '@prisma/client';

export async function listMemories(organizationId: string, userId?: string) {
  return prisma.aiMemory.findMany({
    where: {
      organizationId,
      ...(userId !== undefined ? { OR: [{ userId }, { userId: null }] } : {}),
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function upsertMemory(params: {
  organizationId: string;
  userId?: string;
  category: AiMemoryCategory;
  key: string;
  value: string;
}) {
  const existing = await prisma.aiMemory.findFirst({
    where: {
      organizationId: params.organizationId,
      userId: params.userId ?? null,
      category: params.category,
      key: params.key,
    },
  });

  if (existing) {
    return prisma.aiMemory.update({
      where: { id: existing.id },
      data: { value: params.value },
    });
  }

  return prisma.aiMemory.create({ data: params });
}

export async function deleteMemory(
  organizationId: string,
  memoryId: string,
  userId?: string
) {
  const memory = await prisma.aiMemory.findFirst({
    where: { id: memoryId, organizationId },
  });
  if (!memory) throw new Error('NOT_FOUND');
  if (memory.userId && memory.userId !== userId) throw new Error('FORBIDDEN');
  await prisma.aiMemory.delete({ where: { id: memoryId } });
}

export async function getMemoriesForPrompt(
  organizationId: string,
  userId: string
): Promise<string> {
  const memories = await listMemories(organizationId, userId);
  if (!memories.length) return '';
  return memories.map((m) => `[${m.category}] ${m.key}: ${m.value}`).join('\n');
}
