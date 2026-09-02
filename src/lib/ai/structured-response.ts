/**
 * Structured AI response types — avoid arbitrary text parsing in the UI.
 */

export type AiResponseType =
  | 'answer'
  | 'insight'
  | 'recommendation'
  | 'action_proposal'
  | 'warning'
  | 'error';

export type AiResponseSeverity = 'positive' | 'neutral' | 'negative' | 'critical';

export type AiEvidenceItem = {
  metric: string;
  value: number | string;
  comparison?: number;
  unit?: string;
};

export type AiRecommendationItem = {
  title: string;
  description: string;
  action?: string;
  priority?: 'low' | 'medium' | 'high';
};

export type StructuredAiResponse = {
  type: AiResponseType;
  title?: string;
  summary: string;
  severity?: AiResponseSeverity;
  evidence?: AiEvidenceItem[];
  recommendations?: AiRecommendationItem[];
};

/**
 * Attempt to parse structured JSON from assistant content.
 * Returns null if content is plain text (most responses).
 */
export function parseStructuredResponse(content: string): StructuredAiResponse | null {
  const trimmed = content.trim();
  if (!trimmed.startsWith('{')) return null;

  try {
    const parsed = JSON.parse(trimmed) as Partial<StructuredAiResponse>;
    if (parsed.type && parsed.summary) {
      return parsed as StructuredAiResponse;
    }
  } catch {
    // Plain text response — expected for most messages
  }
  return null;
}
