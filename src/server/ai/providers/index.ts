import { getAiConfig } from '@/server/ai/config';
import type { AIProvider } from '@/server/ai/providers/types';
import { MockProvider } from '@/server/ai/providers/mock-provider';
import { OpenAIProvider } from '@/server/ai/providers/openai-provider';
import { GeminiProvider } from '@/server/ai/providers/gemini-provider';

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;

  const config = getAiConfig();
  switch (config.provider) {
    case 'openai':
      cached = new OpenAIProvider();
      break;
    case 'gemini':
      cached = new GeminiProvider();
      break;
    case 'mock':
    default:
      cached = new MockProvider();
      break;
  }
  return cached;
}

export function resetAIProviderCache() {
  cached = null;
}
