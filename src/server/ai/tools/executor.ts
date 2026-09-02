import type { PermissionKey } from '@/lib/permissions/constants';
import {
  getToolDefinition,
  TOOL_INPUT_SCHEMAS,
} from '@/server/ai/tools/registry';
import { TOOL_HANDLERS } from '@/server/ai/tools/handlers';
import type { ToolExecutionContext, ToolExecutionResult } from '@/types/ai';
import { createPendingAction } from '@/server/ai/action-service';

export function hasToolPermission(
  permissions: PermissionKey[],
  required: PermissionKey[]
): boolean {
  return required.every((p) => permissions.includes(p));
}

export async function executeTool(
  ctx: ToolExecutionContext,
  toolName: string,
  rawInput: Record<string, unknown>,
  options?: { dryRun?: boolean }
): Promise<ToolExecutionResult> {
  const def = getToolDefinition(toolName);
  if (!def) {
    return { success: false, error: 'UNKNOWN_TOOL' };
  }

  if (!hasToolPermission(ctx.permissions, def.permissions)) {
    return { success: false, error: 'FORBIDDEN' };
  }

  const schema = TOOL_INPUT_SCHEMAS[toolName];
  if (!schema) {
    return { success: false, error: 'INVALID_TOOL_SCHEMA' };
  }

  const parsed = schema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: 'VALIDATION_ERROR' };
  }

  const handler = TOOL_HANDLERS[toolName];
  if (!handler) {
    return { success: false, error: 'TOOL_HANDLER_MISSING' };
  }

  try {
    const result = await handler(ctx, parsed.data as Record<string, unknown>);

    if (def.classification === 'write' && def.requiresConfirmation && !options?.dryRun) {
      const dryRun = result as { dryRun?: boolean };
      if (dryRun.dryRun) {
        const action = await createPendingAction({
          organizationId: ctx.organizationId,
          userId: ctx.userId,
          conversationId: ctx.conversationId,
          toolName,
          input: parsed.data as Record<string, unknown>,
          dryRunResult: result,
        });
        return {
          success: true,
          requiresConfirmation: true,
          actionId: action.id,
          dryRun: result,
          data: result,
        };
      }
    }

    return { success: true, data: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'TOOL_FAILED';
    return { success: false, error: message };
  }
}

export function assertAiUsePermission(user: { permissions: PermissionKey[] }) {
  if (!hasToolPermission(user.permissions, ['ai.use'])) {
    throw new Error('FORBIDDEN');
  }
}
