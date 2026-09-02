import type { TimeSeriesPoint } from '@/types/analytics';

export function SimpleLineChart({
  data,
  valueKey,
  height = 120,
  className,
}: {
  data: TimeSeriesPoint[];
  valueKey: 'revenueMinor' | 'orderCount';
  height?: number;
  className?: string;
}) {
  if (!data.length) {
    return (
      <div
        className={`flex items-center justify-center text-sm text-stone-2 border border-dashed border-hairline rounded-sm ${className ?? ''}`}
        style={{ height }}
      >
        No data for this period
      </div>
    );
  }

  const values = data.map((d) => (valueKey === 'revenueMinor' ? d.revenueMinor : d.orderCount));
  const max = Math.max(...values, 1);
  const width = 100;
  const points = values
    .map((v, i) => {
      const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width;
      const y = height - (v / max) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`w-full ${className ?? ''}`} preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        points={points}
      />
    </svg>
  );
}
