import { getAiConfig } from '@/server/ai/config';
import type {
  AIProvider,
  ProviderGenerateInput,
  ProviderGenerateResult,
  ToolCallRequest,
} from '@/server/ai/providers/types';
import type { ToolDefinition } from '@/types/ai';

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';

  async generate(input: ProviderGenerateInput): Promise<ProviderGenerateResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const config = getAiConfig();
    const body = {
      model: config.model,
      temperature: input.temperature ?? config.temperature,
      max_tokens: input.maxTokens ?? config.maxTokens,
      messages: input.messages.map((m) => {
        if (m.role === 'assistant' && m.toolCalls?.length) {
          return {
            role: 'assistant' as const,
            content: m.content || null,
            tool_calls: m.toolCalls.map((tc) => ({
              id: tc.id,
              type: 'function' as const,
              function: {
                name: tc.name,
                arguments: JSON.stringify(tc.arguments),
              },
            })),
          };
        }
        return {
          role: m.role,
          content: m.content,
          ...(m.toolCallId && { tool_call_id: m.toolCallId }),
          ...(m.name && { name: m.name }),
        };
      }),
      tools: input.tools.length
        ? input.tools.map((t) => ({
            type: 'function',
            function: {
              name: t.name,
              description: t.description,
              parameters: t.parameters,
            },
          }))
        : undefined,
      tool_choice: input.tools.length ? 'auto' : undefined,
    };

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error: ${res.status} ${err.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      choices: Array<{
        finish_reason: string;
        message: {
          content: string | null;
          tool_calls?: Array<{
            id: string;
            function: { name: string; arguments: string };
          }>;
        };
      }>;
      usage?: { prompt_tokens: number; completion_tokens: number };
    };

    const choice = data.choices[0];
    const toolCalls: ToolCallRequest[] =
      choice.message.tool_calls?.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments || '{}') as Record<string, unknown>,
      })) ?? [];

    return {
      content: choice.message.content ?? '',
      toolCalls: toolCalls.length ? toolCalls : undefined,
      inputTokens: data.usage?.prompt_tokens,
      outputTokens: data.usage?.completion_tokens,
      finishReason: toolCalls.length ? 'tool_calls' : 'stop',
    };
  }
}

export function toolsToOpenAISchema(tools: ToolDefinition[]) {
  return tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}
