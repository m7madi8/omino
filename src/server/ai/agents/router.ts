import type { AiAgentType } from '@prisma/client';

const ROUTING_RULES: Array<{ agent: AiAgentType; patterns: RegExp[] }> = [
  {
    agent: 'ANALYST',
    patterns: [
      /sales|revenue|how (am i|are we)|metric|trend|compare|refund|channel|doing/i,
      /this month|last month|week|period/i,
    ],
  },
  {
    agent: 'OPERATIONS',
    patterns: [
      /inventory|stock|low|product|order|sku|restock|price|adjust/i,
    ],
  },
  {
    agent: 'CUSTOMER',
    patterns: [/customer|who are|best customer|crm|client/i],
  },
  {
    agent: 'GROWTH',
    patterns: [/grow|opportunit|increase|focus|should i|recommend|promote/i],
  },
];

export function routeToAgent(message: string, hint?: AiAgentType): AiAgentType {
  if (hint) return hint;

  const lower = message.toLowerCase();
  for (const rule of ROUTING_RULES) {
    if (rule.patterns.some((p) => p.test(lower))) {
      return rule.agent;
    }
  }
  return 'ANALYST';
}
