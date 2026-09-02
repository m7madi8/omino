/**
 * Central AI configuration — provider-agnostic.
 * Switch providers via environment variables only.
 */

export type AiProviderName = 'mock' | 'openai' | 'gemini' | 'anthropic';

export type AiModelTier = 'fast' | 'deep';

export type AiConfig = {
  enabled: boolean;
  provider: AiProviderName;
  model: string;
  deepModel: string;
  temperature: number;
  maxTokens: number;
  maxToolIterations: number;
  maxMessagesInContext: number;
  rateLimitPerMinute: number;
};

const DEFAULT_MODELS: Record<AiProviderName, { fast: string; deep: string }> = {
  mock: { fast: 'mock', deep: 'mock' },
  openai: { fast: 'gpt-4o-mini', deep: 'gpt-4o' },
  gemini: { fast: 'gemini-2.5-flash', deep: 'gemini-2.5-pro' },
  anthropic: { fast: 'claude-3-5-haiku-latest', deep: 'claude-3-5-sonnet-latest' },
};

function resolveProvider(): AiProviderName {
  const requested = (process.env.AI_PROVIDER || 'mock') as AiProviderName;

  if (requested === 'openai' && !process.env.OPENAI_API_KEY) return 'mock';
  if (requested === 'gemini' && !process.env.GEMINI_API_KEY) return 'mock';
  if (requested === 'anthropic' && !process.env.ANTHROPIC_API_KEY) return 'mock';

  return requested;
}

export function getAiConfig(): AiConfig {
  const provider = resolveProvider();
  const defaults = DEFAULT_MODELS[provider];

  return {
    enabled: process.env.AI_ENABLED !== 'false',
    provider,
    model: process.env.AI_MODEL || defaults.fast,
    deepModel: process.env.AI_DEEP_MODEL || defaults.deep,
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2048', 10),
    maxToolIterations: parseInt(process.env.AI_MAX_TOOL_ITERATIONS || '6', 10),
    maxMessagesInContext: parseInt(process.env.AI_MAX_MESSAGES_IN_CONTEXT || '20', 10),
    rateLimitPerMinute: parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE || '30', 10),
  };
}

export function getModelForTier(tier: AiModelTier = 'fast'): string {
  const config = getAiConfig();
  return tier === 'deep' ? config.deepModel : config.model;
}

export function isAiConfigured(): boolean {
  const config = getAiConfig();
  if (!config.enabled) return false;
  if (config.provider === 'openai') return Boolean(process.env.OPENAI_API_KEY);
  if (config.provider === 'gemini') return Boolean(process.env.GEMINI_API_KEY);
  if (config.provider === 'anthropic') return Boolean(process.env.ANTHROPIC_API_KEY);
  return true;
}
