import { useId } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip } from "./chart-tooltip";

// Ported from ogaryde-admin-ui/src/components/shared/charts/trend-area-chart.tsx.
// Adapted: ogaryde pulls eachDayOfInterval/format/parseISO/subDays from date-fns,
// a dependency this app doesn't have. Rather than add one for four small date
// operations, this file does the same day-bucket math with plain Date + Intl
// (see pad/toISODate/fillDays/shortLabel below). Also inlined the TimeSeriesPoint
// type ogaryde imports from its own @/lib/types, which has no equivalent here.

export interface TimeSeriesPoint {
  bucket: string;
  value: number;
}

interface TrendAreaChartProps {
  data: TimeSeriesPoint[];
  /** Series colour (single series → no legend; the card title names it). */
  color: string;
  /** Series name shown in the tooltip row. */
  name: string;
  /** Days spanned, used to fill gaps so the axis is continuous. */
  days: number;
  height?: number;
  formatValue?: (n: number) => string;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Backend returns only days with data; fill the rest with 0 for a continuous axis. */
function fillDays(data: TimeSeriesPoint[], days: number): { bucket: string; value: number }[] {
  const byDay = new Map(data.map((d) => [d.bucket, Number(d.value)]));
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1));
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = toISODate(d);
    return { bucket: key, value: byDay.get(key) ?? 0 };
  });
}

function shortLabel(bucket: string): string {
  const [y, m, d] = bucket.split("-").map(Number);
  if (!y || !m || !d) return bucket;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(y, m - 1, d));
}

export function TrendAreaChart({
  data,
  color,
  name,
  days,
  height = 220,
  formatValue = (n) => n.toLocaleString(),
}: TrendAreaChartProps) {
  const gradientId = useId();
  const filled = fillDays(data, days);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={filled} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.28} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="bucket"
          tickFormatter={shortLabel}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={44}
          tickFormatter={(v) => formatValue(Number(v))}
        />
        <Tooltip
          cursor={{ stroke: "var(--border)" }}
          content={<ChartTooltip formatValue={formatValue} />}
          labelFormatter={(v) => shortLabel(String(v))}
        />
        <Area
          type="monotone"
          dataKey="value"
          name={name}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          activeDot={{ r: 4 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
