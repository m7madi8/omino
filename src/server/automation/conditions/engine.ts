import type { AutomationCondition, ConditionGroup } from '@/types/automation';

function getFieldValue(data: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = data;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function compareValues(
  operator: AutomationCondition['operator'],
  actual: unknown,
  expected: unknown
): boolean {
  switch (operator) {
    case 'exists':
      return actual !== undefined && actual !== null;
    case 'not_exists':
      return actual === undefined || actual === null;
    case 'is_true':
      return actual === true;
    case 'is_false':
      return actual === false;
    case 'equals':
      return actual === expected || String(actual) === String(expected);
    case 'not_equals':
      return actual !== expected && String(actual) !== String(expected);
    case 'greater_than':
      return Number(actual) > Number(expected);
    case 'less_than':
      return Number(actual) < Number(expected);
    case 'greater_than_or_equal':
      return Number(actual) >= Number(expected);
    case 'less_than_or_equal':
      return Number(actual) <= Number(expected);
    case 'contains':
      return String(actual ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase());
    case 'starts_with':
      return String(actual ?? '').toLowerCase().startsWith(String(expected ?? '').toLowerCase());
    case 'ends_with':
      return String(actual ?? '').toLowerCase().endsWith(String(expected ?? '').toLowerCase());
    case 'in':
      return Array.isArray(expected) && expected.includes(actual);
    case 'not_in':
      return Array.isArray(expected) && !expected.includes(actual);
    default:
      return false;
  }
}

function evaluateCondition(
  condition: AutomationCondition,
  data: Record<string, unknown>
): boolean {
  const actual = getFieldValue(data, condition.field);
  return compareValues(condition.operator, actual, condition.value);
}

export function evaluateConditionGroup(
  group: ConditionGroup | undefined,
  data: Record<string, unknown>
): { passed: boolean; results: Array<{ field: string; passed: boolean }> } {
  if (!group) return { passed: true, results: [] };

  const results: Array<{ field: string; passed: boolean }> = [];

  if (group.operator === 'NOT') {
    const inner = group.groups?.[0] ?? { operator: 'AND' as const, conditions: group.conditions };
    const innerResult = evaluateConditionGroup(inner, data);
    return { passed: !innerResult.passed, results: innerResult.results };
  }

  const conditionResults = (group.conditions ?? []).map((c) => {
    const passed = evaluateCondition(c, data);
    results.push({ field: c.field, passed });
    return passed;
  });

  const groupResults = (group.groups ?? []).map((g) => evaluateConditionGroup(g, data));

  const allResults = [...conditionResults, ...groupResults.map((r) => r.passed)];
  for (const gr of groupResults) results.push(...gr.results);

  if (allResults.length === 0) return { passed: true, results };

  const passed =
    group.operator === 'OR'
      ? allResults.some(Boolean)
      : allResults.every(Boolean);

  return { passed, results };
}
