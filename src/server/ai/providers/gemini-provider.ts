import { getAiConfig } from '@/lib/ai/config';
import { getGeminiClient } from '@/server/ai/providers/gemini-client';
import type {
  AIProvider,
  ChatMessage,
  ProviderGenerateInput,
  ProviderGenerateResult,
  StreamChunk,
  StreamingAIProvider,
  ToolCallRequest,
} from '@/server/ai/providers/types';
import type { ToolDefinition } from '@/types/ai';
import type { Content, FunctionDeclaration, Part } from '@google/genai';

const REQUEST_TIMEOUT_MS = 60_000;

export class GeminiProvider implements StreamingAIProvider {
  readonly name = 'gemini';

  async generate(input: ProviderGenerateInput): Promise<ProviderGenerateResult> {
    try {
      const config = getAiConfig();
      const ai = getGeminiClient();

      const { systemInstruction, contents } = convertMessages(input.messages);
      const tools = input.tools.length ? [{ functionDeclarations: toolsToGeminiDeclarations(input.tools) }] : undefined;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await ai.models.generateContent({
          model: config.model,
          contents,
          config: {
            systemInstruction,
            temperature: input.temperature ?? config.temperature,
            maxOutputTokens: input.maxTokens ?? config.maxTokens,
            tools,
            abortSignal: controller.signal,
          },
        });

        return mapResponse(response);
      } finally {
        clearTimeout(timeout);
      }
    } catch (err) {
      throw mapGeminiError(err);
    }
  }

  async *generateStream(input: ProviderGenerateInput): AsyncGenerator<StreamChunk> {
    try {
      const config = getAiConfig();
      const ai = getGeminiClient();

      const { systemInstruction, contents } = convertMessages(input.messages);
      const tools = input.tools.length ? [{ functionDeclarations: toolsToGeminiDeclarations(input.tools) }] : undefined;

      const stream = await ai.models.generateContentStream({
        model: config.model,
        contents,
        config: {
          systemInstruction,
          temperature: input.temperature ?? config.temperature,
          maxOutputTokens: input.maxTokens ?? config.maxTokens,
          tools,
        },
      });

      let accumulated = '';
      const toolCalls: ToolCallRequest[] = [];

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          accumulated += text;
          yield { type: 'content', delta: text };
        }

        const calls = chunk.functionCalls;
        if (calls?.length) {
          for (const call of calls) {
            if (!call.name) continue;
            toolCalls.push({
              id: call.id ?? `gemini-${call.name}-${toolCalls.length}`,
              name: call.name,
              arguments: (call.args ?? {}) as Record<string, unknown>,
            });
          }
        }
      }

      const result: ProviderGenerateResult = {
        content: accumulated,
        toolCalls: toolCalls.length ? toolCalls : undefined,
        finishReason: toolCalls.length ? 'tool_calls' : 'stop',
      };

      yield { type: 'done', result };
    } catch (err) {
      throw mapGeminiError(err);
    }
  }
}

function toolsToGeminiDeclarations(tools: ToolDefinition[]): FunctionDeclaration[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    parametersJsonSchema: t.parameters,
  }));
}

function convertMessages(messages: ChatMessage[]): {
  systemInstruction?: string;
  contents: Content[];
} {
  const systemParts = messages.filter((m) => m.role === 'system').map((m) => m.content);
  const systemInstruction = systemParts.length ? systemParts.join('\n\n') : undefined;

  const contents: Content[] = [];
  const nonSystem = messages.filter((m) => m.role !== 'system');

  for (let i = 0; i < nonSystem.length; i++) {
    const msg = nonSystem[i];

    if (msg.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: msg.content }] });
      continue;
    }

    if (msg.role === 'assistant') {
      if (msg.toolCalls?.length) {
        const modelParts: Part[] = msg.toolCalls.map((call) => ({
          functionCall: {
            id: call.id,
            name: call.name,
            args: call.arguments,
          },
        }));
        if (msg.content) {
          modelParts.unshift({ text: msg.content });
        }
        contents.push({ role: 'model', parts: modelParts });
        continue;
      }

      if (msg.content) {
        contents.push({ role: 'model', parts: [{ text: msg.content }] });
      }
      continue;
    }

    if (msg.role === 'tool') {
      const responseParts: Part[] = [];
      let j = i;
      while (j < nonSystem.length && nonSystem[j].role === 'tool') {
        const toolMsg = nonSystem[j];
        let response: Record<string, unknown>;
        try {
          response = JSON.parse(toolMsg.content) as Record<string, unknown>;
        } catch {
          response = { output: toolMsg.content };
        }
        responseParts.push({
          functionResponse: {
            id: toolMsg.toolCallId,
            name: toolMsg.name,
            response,
          },
        });
        j++;
      }
      contents.push({ role: 'user', parts: responseParts });
      i = j - 1;
    }
  }

  return { systemInstruction, contents };
}

function safeParseJson(content: string): Record<string, unknown> {
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function mapResponse(response: {
  text?: string;
  functionCalls?: Array<{ id?: string; name?: string; args?: Record<string, unknown> }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}): ProviderGenerateResult {
  const toolCalls: ToolCallRequest[] =
    response.functionCalls
      ?.filter((c) => c.name)
      .map((call, idx) => ({
        id: call.id ?? `gemini-${call.name}-${idx}`,
        name: call.name!,
        arguments: (call.args ?? {}) as Record<string, unknown>,
      })) ?? [];

  return {
    content: response.text ?? '',
    toolCalls: toolCalls.length ? toolCalls : undefined,
    inputTokens: response.usageMetadata?.promptTokenCount,
    outputTokens: response.usageMetadata?.candidatesTokenCount,
    finishReason: toolCalls.length ? 'tool_calls' : 'stop',
  };
}

function mapGeminiError(err: unknown): Error {
  if (err instanceof Error) {
    if (err.name === 'AbortError' || err.message.includes('aborted')) {
      return new Error('AI_TIMEOUT');
    }
    if (err.message === 'GEMINI_NOT_CONFIGURED') {
      return new Error('AI_NOT_CONFIGURED');
    }
    const lower = err.message.toLowerCase();
    if (lower.includes('api key') || lower.includes('401') || lower.includes('unauthorized')) {
      return new Error('AI_AUTH_ERROR');
    }
    if (lower.includes('429') || lower.includes('rate') || lower.includes('quota')) {
      return new Error('AI_RATE_LIMITED');
    }
    if (lower.includes('503') || lower.includes('unavailable')) {
      return new Error('AI_UNAVAILABLE');
    }
  }
  return new Error('AI_PROVIDER_ERROR');
}
