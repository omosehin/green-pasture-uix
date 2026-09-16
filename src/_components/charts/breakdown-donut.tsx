import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartTooltip } from "./chart-tooltip";

// Ported from ogaryde-admin-ui/src/components/shared/charts/breakdown-donut.tsx.
// Only change: inlined the CategoryCount type ogaryde imports from its own
// @/lib/types, which has no equivalent here.

export interface CategoryCount {
  label: string;
  count: number;
}

interface BreakdownDonutProps {
  data: CategoryCount[];
  /** Colour for a slice, given its label and index (e.g. statusColor or categoricalColor). */
  colorFor: (label: string, index: number) => string;
  height?: number;
}

/** Title-case a raw enum-ish label: "AWAITING_ASSIGNMENT" → "Awaiting Assignment". */
function prettyLabel(label: string): string {
  return label
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Donut breakdown for a categorical count. Ships a legend with direct value/percent labels
 * (identity never by colour alone) + a center total, satisfying the CVD secondary-encoding rule.
 */
export function BreakdownDonut({ data, colorFor, height = 200 }: BreakdownDonutProps) {
  const total = data.reduce((sum, d) => sum + Number(d.count), 0);
  const slices = data.map((d, i) => ({
    label: prettyLabel(d.label),
    value: Number(d.count),
    color: colorFor(d.label, i),
    pct: total > 0 ? Math.round((Number(d.count) / total) * 100) : 0,
  }));

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((s) => (
                <Cell key={s.label} fill={s.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip formatValue={(v) => v.toLocaleString()} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold tabular-nums">{total.toLocaleString()}</span>
          <span className="text-muted-foreground text-xs">Total</span>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-1.5">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
            <span className="min-w-0 flex-1 truncate">{s.label}</span>
            <span className="tabular-nums font-medium">{s.value.toLocaleString()}</span>
            <span className="text-muted-foreground w-9 text-right text-xs tabular-nums">{s.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
