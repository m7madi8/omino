import { getAiConfig } from '@/server/ai/config';
import { getAIProvider } from '@/server/ai/providers';
import type { ChatMessage } from '@/server/ai/providers/types';
import { routeToAgent } from '@/server/ai/agents/router';
import { getAgent } from '@/server/ai/agents/definitions';
import { getToolsForAgent } from '@/server/ai/tools/registry';
import { executeTool } from '@/server/ai/tools/executor';
import {
  buildBusinessContext,
  contextToSystemPrompt,
  inferContextIntent,
} from '@/server/ai/context/business-context-service';
import {
  addMessage,
  getConversation,
  getRecentMessages,
  recordToolCall,
  updateConversationAgent,
  updateConversationTitle,
  generateTitleFromMessage,
} from '@/server/ai/conversation-service';
import { getMemoriesForPrompt } from '@/server/ai/memory-service';
import { recordUsage } from '@/server/ai/usage-service';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { sanitizeUserMessage } from '@/lib/security/prompt-sanitizer';
import { getToolDefinition } from '@/server/ai/tools/registry';
import type { OrchestratorInput, OrchestratorResult, ToolExecutionContext } from '@/types/ai';

export type OrchestratorProgress =
  | { type: 'status'; message: string }
  | { type: 'content'; delta: string };

export async function runOrchestrator(params: {
  ctx: ToolExecutionContext;
  input: OrchestratorInput;
  onProgress?: (event: OrchestratorProgress) => void;
}): Promise<OrchestratorResult> {
  const config = getAiConfig();
  if (!config.enabled) {
    throw new Error('AI_DISABLED');
  }

  const rateKey = `ai:${params.ctx.organizationId}:${params.ctx.userId}`;
  const rate = checkRateLimit(rateKey, config.rateLimitPerMinute);
  if (!rate.allowed) {
    throw new Error('RATE_LIMITED');
  }

  const conversation = await getConversation(
    params.ctx.organizationId,
    params.ctx.userId,
    params.input.conversationId
  );

  const sanitizedMessage = sanitizeUserMessage(params.input.message);

  const userMessage = await addMessage({
    conversationId: params.input.conversationId,
    role: 'USER',
    content: params.input.message,
    metadata: params.input.context,
  });

  if (conversation.messages.length === 0) {
    await updateConversationTitle(
      params.input.conversationId,
      generateTitleFromMessage(params.input.message)
    );
  }

  const agentType = routeToAgent(
    params.input.message,
    conversation.agentType ?? undefined
  );
  if (!conversation.agentType) {
    await updateConversationAgent(params.input.conversationId, agentType);
  }

  const agent = getAgent(agentType);
  const tools = getToolsForAgent(agent.allowedTools);
  const intent = inferContextIntent(params.input.message);
  const businessContext = await buildBusinessContext({
    organizationId: params.ctx.organizationId,
    storeId: params.ctx.storeId,
    branchId: params.ctx.branchId,
    intent,
  });

  const memories = await getMemoriesForPrompt(
    params.ctx.organizationId,
    params.ctx.userId
  );

  const statusMessages: string[] = [];
  const toolCallRecords: OrchestratorResult['toolCalls'] = [];
  let pendingAction: OrchestratorResult['pendingAction'];

  const recentMessages = await getRecentMessages(
    params.input.conversationId,
    config.maxMessagesInContext
  );

  const provider = getAIProvider();
  const chatMessages: ChatMessage[] = [
    {
      role: 'system',
      content: [
        agent.systemPrompt,
        '\n\nBusiness context:\n',
        contextToSystemPrompt(businessContext),
        memories ? `\n\nMemories:\n${memories}` : '',
        params.input.context?.entityType
          ? `\n\nPage context: ${params.input.context.entityType} ${params.input.context.entityId ?? ''}`
          : '',
      ].join(''),
    },
    ...recentMessages.map((m) => ({
      role: m.role.toLowerCase() as ChatMessage['role'],
      content:
        m.role === 'USER' ? sanitizeUserMessage(m.content) : m.content,
    })),
  ];

  let iterations = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let finalContent = '';

  while (iterations < config.maxToolIterations) {
    iterations += 1;
    statusMessages.push(
      iterations === 1 ? 'Analyzing your question…' : 'Processing tool results…'
    );
    params.onProgress?.({
      type: 'status',
      message: statusMessages[statusMessages.length - 1]!,
    });

    const result = await provider.generate({
      messages: chatMessages,
      tools,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });

    totalInputTokens += result.inputTokens ?? 0;
    totalOutputTokens += result.outputTokens ?? 0;

    if (result.toolCalls?.length) {
      const toolResults = new Map<string, Awaited<ReturnType<typeof executeTool>>>();

      for (const call of result.toolCalls) {
        const def = getToolDefinition(call.name);
        statusMessages.push(`Checking ${call.name.replace(/_/g, ' ')}…`);
        params.onProgress?.({
          type: 'status',
          message: statusMessages[statusMessages.length - 1]!,
        });

        const toolResult = await executeTool(params.ctx, call.name, call.arguments);
        toolResults.set(call.id, toolResult);

        await recordToolCall({
          conversationId: params.input.conversationId,
          messageId: userMessage.id,
          toolName: call.name,
          input: call.arguments,
          output: toolResult.data ?? { error: toolResult.error },
          status: toolResult.success ? 'completed' : 'failed',
          error: toolResult.error,
          risk: def?.risk ?? 'READ',
        });

        toolCallRecords.push({
          id: call.id,
          toolName: call.name,
          status: toolResult.success ? 'completed' : 'failed',
          risk: def?.risk ?? 'READ',
        });

        if (toolResult.requiresConfirmation && toolResult.actionId) {
          pendingAction = {
            id: toolResult.actionId,
            toolName: call.name,
            dryRun: toolResult.dryRun,
          };
        }
      }

      chatMessages.push({
        role: 'assistant',
        content: result.content || '',
        toolCalls: result.toolCalls,
      });

      for (const call of result.toolCalls) {
        const toolResult = toolResults.get(call.id);
        chatMessages.push({
          role: 'tool',
          content: JSON.stringify(toolResult?.data ?? { error: toolResult?.error }),
          name: call.name,
          toolCallId: call.id,
        });
      }
      continue;
    }

    finalContent = result.content;
    break;
  }

  if (!finalContent && pendingAction) {
    const dry = pendingAction.dryRun as Record<string, unknown>;
    finalContent =
      `I prepared the following action for your review:\n\n` +
      `**${pendingAction.toolName.replace(/_/g, ' ')}**\n` +
      Object.entries(dry)
        .filter(([k]) => k !== 'dryRun' && k !== 'action')
        .map(([k, v]) => `- ${k}: ${v}`)
        .join('\n') +
      `\n\nPlease confirm to proceed.`;
  }

  if (!finalContent) {
    finalContent =
      'I was unable to generate a complete response. Please try rephrasing your question.';
  }

  statusMessages.push('Preparing answer…');
  params.onProgress?.({ type: 'status', message: 'Preparing answer…' });

  if (params.onProgress && finalContent) {
    const chunks = finalContent.match(/\S+\s*|\s+/g) ?? [finalContent];
    for (const chunk of chunks) {
      params.onProgress({ type: 'content', delta: chunk });
    }
  }

  const assistantMessage = await addMessage({
    conversationId: params.input.conversationId,
    role: 'ASSISTANT',
    content: finalContent,
    metadata: { agentType, toolCalls: toolCallRecords },
  });

  await recordUsage({
    organizationId: params.ctx.organizationId,
    userId: params.ctx.userId,
    conversationId: params.input.conversationId,
    provider: provider.name,
    model: config.model,
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    toolCallCount: toolCallRecords.length,
    status: 'success',
  });

  return {
    conversationId: params.input.conversationId,
    messageId: assistantMessage.id,
    content: finalContent,
    agentType,
    toolCalls: toolCallRecords,
    pendingAction,
    statusMessages,
  };
}
