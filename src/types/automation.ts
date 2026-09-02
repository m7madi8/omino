export type AutomationStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
export type AutomationExecutionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'SKIPPED'
  | 'CANCELLED';
export type AutomationStepStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'SKIPPED'
  | 'CANCELLED';

export type BusinessEventInput = {
  type: string;
  organizationId: string;
  storeId?: string | null;
  branchId?: string | null;
  actorId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  source?: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'exists'
  | 'not_exists'
  | 'is_true'
  | 'is_false'
  | 'in'
  | 'not_in';

export type AutomationCondition = {
  field: string;
  operator: ConditionOperator;
  value?: unknown;
};

export type ConditionGroup = {
  operator: 'AND' | 'OR' | 'NOT';
  conditions?: AutomationCondition[];
  groups?: ConditionGroup[];
};

export type AutomationActionStep = {
  type: 'action';
  actionType: string;
  input: Record<string, unknown>;
  maxAttempts?: number;
};

export type AutomationDelayStep = {
  type: 'delay';
  delay: {
    seconds?: number;
    minutes?: number;
    hours?: number;
    days?: number;
  };
};

export type AutomationStep = AutomationActionStep | AutomationDelayStep;

export type AutomationScheduleConfig = {
  type: 'daily' | 'weekly' | 'monthly';
  hour: number;
  minute: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
};

export type AutomationVersionConfig = {
  trigger: {
    type: string;
    config?: Record<string, unknown>;
  };
  conditions?: ConditionGroup;
  steps: AutomationStep[];
  schedule?: AutomationScheduleConfig;
};

export type AutomationActionDefinition = {
  type: string;
  name: string;
  description: string;
  permissions: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  idempotencySupport: boolean;
  inputSchema: Record<string, unknown>;
};

export type AutomationTriggerDefinition = {
  type: string;
  name: string;
  description: string;
  category: string;
  payloadFields: string[];
};

export type AutomationTemplate = {
  id: string;
  name: string;
  description: string;
  config: AutomationVersionConfig;
};

export type AutomationExecutionContext = {
  organizationId: string;
  storeId: string | null;
  branchId: string | null;
  actorId: string | null;
  event: BusinessEventInput & { id?: string };
  enrichedData: Record<string, unknown>;
};

export type AutomationMetrics = {
  totalAutomations: number;
  activeAutomations: number;
  pausedAutomations: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  skippedExecutions: number;
  successRate: number;
  topAutomations: Array<{ id: string; name: string; executionCount: number }>;
  mostFailedAutomations: Array<{ id: string; name: string; failureCount: number }>;
};
