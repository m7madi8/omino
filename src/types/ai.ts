import type { PermissionKey } from '@/lib/permissions/constants';
import type { AiAgentType, AiMessageRole, AiToolRisk } from '@prisma/client';

export type { AiAgentType, AiMessageRole, AiToolRisk };

export type AiToolClassification = 'read' | 'write';

export type ToolDefinition = {
  name: string;
  description: string;
  classification: AiToolClassification;
  risk: AiToolRisk;
  permissions: PermissionKey[];
  parameters: Record<string, unknown>;
  requiresConfirmation: boolean;
  auditRequired: boolean;
};

export type ToolExecutionContext = {
  organizationId: string;
  userId: string;
  storeId: string | null;
  branchId: string | null;
  currency: string;
  permissions: PermissionKey[];
  conversationId: string;
};

export type ToolExecutionResult = {
  success: boolean;
  data?: unknown;
  error?: string;
  requiresConfirmation?: boolean;
  actionId?: string;
  dryRun?: unknown;
};

export type AgentDefinition = {
  type: AiAgentType;
  name: string;
  description: string;
  systemPrompt: string;
  allowedTools: string[];
};

export type BusinessContextSnapshot = {
  organization: {
    id: string;
    name: string;
    currency: string;
    businessType: string | null;
  };
  store: { id: string; name: string } | null;
  branch: { id: string; name: string } | null;
  sales?: {
    revenueMinor: number;
    orderCount: number;
    averageOrderValueMinor: number;
    periodLabel: string;
  };
  signals?: Array<{ type: string; message: string; severity: 'info' | 'warning' | 'opportunity' }>;
};

export type OrchestratorInput = {
  conversationId: string;
  message: string;
  context?: {
    page?: string;
    entityType?: string;
    entityId?: string;
  };
};

export type OrchestratorResult = {
  conversationId: string;
  messageId: string;
  content: string;
  agentType: AiAgentType;
  toolCalls: Array<{
    id: string;
    toolName: string;
    status: string;
    risk: AiToolRisk;
  }>;
  pendingAction?: {
    id: string;
    toolName: string;
    dryRun: unknown;
  };
  statusMessages: string[];
};

export type StreamEvent =
  | { type: 'status'; message: string }
  | { type: 'tool_start'; toolName: string }
  | { type: 'tool_end'; toolName: string; success: boolean }
  | { type: 'content'; delta: string }
  | { type: 'done'; result: OrchestratorResult }
  | { type: 'error'; message: string };
