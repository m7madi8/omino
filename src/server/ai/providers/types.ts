import type { ToolDefinition } from '@/types/ai';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  name?: string;
  toolCalls?: ToolCallRequest[];
};

export type ToolCallRequest = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type ProviderGenerateInput = {
  messages: ChatMessage[];
  tools: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
};

export type ProviderGenerateResult = {
  content: string;
  toolCalls?: ToolCallRequest[];
  inputTokens?: number;
  outputTokens?: number;
  finishReason: 'stop' | 'tool_calls' | 'error';
};

export interface AIProvider {
  readonly name: string;
  generate(input: ProviderGenerateInput): Promise<ProviderGenerateResult>;
}

export type StreamChunk =
  | { type: 'content'; delta: string }
  | { type: 'tool_calls'; calls: ToolCallRequest[] }
  | { type: 'done'; result: ProviderGenerateResult };

export interface StreamingAIProvider extends AIProvider {
  generateStream(input: ProviderGenerateInput): AsyncGenerator<StreamChunk>;
}
