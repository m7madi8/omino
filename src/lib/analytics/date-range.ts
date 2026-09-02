import type { DateRangePreset, ResolvedDateRange } from '@/types/analytics';

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}

function previousPeriod(from: Date, to: Date) {
  const durationMs = to.getTime() - from.getTime();
  const previousTo = new Date(from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - durationMs);
  return { previousFrom, previousTo };
}

export function resolveDateRange(
  preset: DateRangePreset,
  customFrom?: string,
  customTo?: string,
  now = new Date()
): ResolvedDateRange {
  let from: Date;
  let to: Date;
  let label: string;

  switch (preset) {
    case 'today':
      from = startOfDay(now);
      to = endOfDay(now);
      label = 'Today';
      break;
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      from = startOfDay(y);
      to = endOfDay(y);
      label = 'Yesterday';
      break;
    }
    case 'last_7_days':
      from = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
      to = endOfDay(now);
      label = 'Last 7 days';
      break;
    case 'last_30_days':
      from = startOfDay(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
      to = endOfDay(now);
      label = 'Last 30 days';
      break;
    case 'this_month':
      from = startOfMonth(now);
      to = endOfDay(now);
      label = 'This month';
      break;
    case 'last_month': {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      from = startOfMonth(lm);
      to = endOfMonth(lm);
      label = 'Last month';
      break;
    }
    case 'this_year':
      from = startOfYear(now);
      to = endOfDay(now);
      label = 'This year';
      break;
    case 'custom':
    default:
      from = customFrom ? startOfDay(new Date(customFrom)) : startOfDay(now);
      to = customTo ? endOfDay(new Date(customTo)) : endOfDay(now);
      label = 'Custom range';
      break;
  }

  const { previousFrom, previousTo } = previousPeriod(from, to);
  return { preset, from, to, previousFrom, previousTo, label };
}

export function parseDateRangePreset(value?: string | null): DateRangePreset {
  const valid: DateRangePreset[] = [
    'today',
    'yesterday',
    'last_7_days',
    'last_30_days',
    'this_month',
    'last_month',
    'this_year',
    'custom',
  ];
  if (value && valid.includes(value as DateRangePreset)) {
    return value as DateRangePreset;
  }
  return 'last_30_days';
}

export function seriesGranularity(from: Date, to: Date): 'hour' | 'day' | 'week' | 'month' {
  const days = (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
  if (days <= 2) return 'hour';
  if (days <= 60) return 'day';
  if (days <= 180) return 'week';
  return 'month';
}
