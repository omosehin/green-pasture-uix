import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import AnimatedNumber from "@/_UI/AnimatedNumber";

// Ported from ogaryde-admin-ui/src/components/shared/stat-row.tsx. Only
// change: ./animated-number -> the existing @/_UI/AnimatedNumber (see the
// note in MetricCard.tsx — same drop-in reasoning applies here).

type StatColor = "brand" | "success" | "warning" | "danger" | "info";
const BAR: Record<StatColor, string> = {
  brand: "bg-primary",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-sky-500",
};

export function StatRow({
  label,
  value,
  total,
  color = "brand",
  isLoading,
}: {
  label: string;
  value: number | undefined;
  total: number | undefined;
  color?: StatColor;
  isLoading?: boolean;
}) {
  const pct = total && total > 0 && value != null ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1" data-testid="stat-row">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        {isLoading ? (
          <Skeleton className="h-4 w-12" />
        ) : (
          <span className="font-medium">
            <AnimatedNumber value={value ?? 0} /> ({pct}%)
          </span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all duration-700 ease-out", BAR[color])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
