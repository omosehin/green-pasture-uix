/**
 * Themed tooltip for Recharts. Recharts injects `active`/`payload`/`label` at runtime when
 * passed via `<Tooltip content={<ChartTooltip .../>} />`; we type them permissively to stay
 * decoupled from Recharts' version-specific generic props. Binds to card/border/ink tokens.
 *
 * Ported unmodified from ogaryde-admin-ui/src/components/shared/charts/chart-tooltip.tsx —
 * no framework or import-path changes needed.
 */
interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: { fill?: string };
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  formatValue?: (v: number) => string;
}

export function ChartTooltip({ active, payload, label, formatValue = (v) => String(v) }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-card rounded-lg border px-3 py-2 text-xs shadow-md">
      {label != null && label !== "" ? <p className="text-muted-foreground mb-1 font-medium">{String(label)}</p> : null}
      <div className="space-y-0.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color ?? entry.payload?.fill }}
              aria-hidden
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="text-foreground ml-auto font-semibold tabular-nums">{formatValue(Number(entry.value ?? 0))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
