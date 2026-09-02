import { formatMoney } from '@/lib/money';
import type { MetricComparison } from '@/types/analytics';

export function KpiCard({
  label,
  value,
  currency,
  comparison,
  format = 'money',
}: {
  label: string;
  value: number;
  currency?: string;
  comparison?: MetricComparison;
  format?: 'money' | 'number' | 'percent';
}) {
  const display =
    format === 'money' && currency
      ? formatMoney(value, currency)
      : format === 'percent'
        ? `${value.toFixed(1)}%`
        : value.toLocaleString();

  return (
    <div className="rounded-md border border-hairline bg-white p-5 shadow-soft">
      <p className="text-xs font-mono uppercase tracking-wider text-stone-2">{label}</p>
      <p className="mt-2 text-2xl font-display tabular-nums">{display}</p>
      {comparison && comparison.changePercent != null && (
        <p
          className={`mt-1 text-sm font-mono ${
            comparison.direction === 'up'
              ? 'text-good'
              : comparison.direction === 'down'
                ? 'text-danger'
                : 'text-stone-2'
          }`}
        >
          {comparison.direction === 'up' ? '↑' : comparison.direction === 'down' ? '↓' : '→'}{' '}
          {Math.abs(comparison.changePercent).toFixed(1)}% vs prior
        </p>
      )}
    </div>
  );
}
