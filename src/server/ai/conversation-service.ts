import { prisma } from '@/lib/db';
import type { AiAgentType, AiMessageRole } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export async function createConversation(params: {
  organizationId: string;
  userId: string;
  title?: string;
  agentType?: AiAgentType;
}) {
  return prisma.aiConversation.create({
    data: {
      organizationId: params.organizationId,
      userId: params.userId,
      title: params.title ?? 'New conversation',
      agentType: params.agentType,
    },
  });
}

export async function listConversations(organizationId: string, userId: string) {
  return prisma.aiConversation.findMany({
    where: { organizationId, userId },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { messages: true } },
    },
  });
}

export async function getConversation(
  organizationId: string,
  userId: string,
  conversationId: string
) {
  const conv = await prisma.aiConversation.findFirst({
    where: { id: conversationId, organizationId, userId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      toolCalls: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!conv) throw new Error('NOT_FOUND');
  return conv;
}

export async function deleteConversation(
  organizationId: string,
  userId: string,
  conversationId: string
) {
  const conv = await prisma.aiConversation.findFirst({
    where: { id: conversationId, organizationId, userId },
  });
  if (!conv) throw new Error('NOT_FOUND');
  await prisma.aiConversation.delete({ where: { id: conversationId } });
}

export async function addMessage(params: {
  conversationId: string;
  role: AiMessageRole;
  content: string;
  metadata?: Record<string, unknown>;
}) {
  const message = await prisma.aiMessage.create({
    data: {
      conversationId: params.conversationId,
      role: params.role,
      content: params.content,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    },
  });

  await prisma.aiConversation.update({
    where: { id: params.conversationId },
    data: { updatedAt: new Date() },
  });

  return message;
}

export async function recordToolCall(params: {
  conversationId: string;
  messageId?: string;
  toolName: string;
  input: Record<string, unknown>;
  output?: unknown;
  status: string;
  error?: string;
  risk: 'READ' | 'LOW' | 'MEDIUM' | 'HIGH';
}) {
  return prisma.aiToolCall.create({
    data: {
      conversationId: params.conversationId,
      messageId: params.messageId,
      toolName: params.toolName,
      input: params.input as Prisma.InputJsonValue,
      output: params.output as Prisma.InputJsonValue | undefined,
      status: params.status,
      error: params.error,
      risk: params.risk,
    },
  });
}

export async function getRecentMessages(conversationId: string, limit: number) {
  const messages = await prisma.aiMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return messages.reverse();
}

export async function updateConversationTitle(
  conversationId: string,
  title: string
) {
  return prisma.aiConversation.update({
    where: { id: conversationId },
    data: { title },
  });
}

export async function updateConversationAgent(
  conversationId: string,
  agentType: AiAgentType
) {
  return prisma.aiConversation.update({
    where: { id: conversationId },
    data: { agentType },
  });
}

export function generateTitleFromMessage(message: string): string {
  const cleaned = message.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= 48) return cleaned;
  return cleaned.slice(0, 45) + '...';
}
