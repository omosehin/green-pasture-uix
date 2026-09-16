import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import AnimatedNumber from "@/_UI/AnimatedNumber";

// Ported from ogaryde-admin-ui/src/components/shared/metric-card.tsx. Adapted:
// - react-router-dom's <Link to> -> next/link's <Link href> (this is Next.js).
// - Its own ./animated-number was dropped in favour of the AnimatedNumber that
//   already exists at @/_UI/AnimatedNumber (task 7 brief: reconcile with what
//   green-pasture already has, prefer ogaryde's structure but don't duplicate
//   what's already here). Both call sites below only pass `value`, and
//   @/_UI/AnimatedNumber's signature is a superset of what ogaryde's exposes
//   (value/duration/delay/className/prefix/suffix, plus a `locale` flag), so
//   the swap is drop-in.
// - StatMetricCard (ogaryde's react-query-bound wrapper) was NOT ported: this
//   app has no @tanstack/react-query dependency, and nothing in this task
//   binds these components to data yet. Add it later if a page wants that
//   convenience.

export type MetricColor = "brand" | "success" | "warning" | "danger" | "info";

const COLOR: Record<MetricColor, { chip: string; border: string; glow: string }> = {
  brand: { chip: "bg-primary/15 text-primary", border: "hover:border-primary/30", glow: "bg-primary/10" },
  success: { chip: "bg-emerald-500/15 text-emerald-500", border: "hover:border-emerald-500/30", glow: "bg-emerald-500/10" },
  warning: { chip: "bg-amber-500/15 text-amber-500", border: "hover:border-amber-500/30", glow: "bg-amber-500/10" },
  danger: { chip: "bg-red-500/15 text-red-500", border: "hover:border-red-500/30", glow: "bg-red-500/10" },
  info: { chip: "bg-sky-500/15 text-sky-500", border: "hover:border-sky-500/30", glow: "bg-sky-500/10" },
};

export type MetricCardProps = {
  label: string;
  value: number | string | undefined;
  icon: LucideIcon;
  color: MetricColor;
  isLoading?: boolean;
  isError?: boolean;
  to?: string;
  subtitle?: string;
  trend?: { direction: "up" | "down"; text: string };
  testId?: string;
};

export function MetricCard({ label, value, icon: Icon, color, isLoading, isError, to, subtitle, trend, testId }: MetricCardProps) {
  const c = COLOR[color];
  const body = (
    <Card className={cn("group relative overflow-hidden transition-colors", to && "cursor-pointer", c.border)}>
      <span
        className={cn(
          "pointer-events-none absolute -right-6 -top-6 size-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100",
          c.glow,
        )}
        aria-hidden
      />
      <CardContent className="relative flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : isError || value == null ? (
            <p className="mt-1 text-2xl font-semibold" data-testid={testId ? `${testId}-error` : undefined}>
              —
            </p>
          ) : (
            <p className="mt-1 text-2xl font-semibold" data-testid={testId ? `${testId}-value` : undefined}>
              {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
            </p>
          )}
          {subtitle ? <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p> : null}
          {trend ? (
            <p className={cn("mt-1 flex items-center gap-0.5 text-xs", trend.direction === "up" ? "text-emerald-500" : "text-red-500")}>
              {trend.direction === "up" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
              {trend.text}
            </p>
          ) : null}
        </div>
        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", c.chip)}>
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
  return to ? (
    <Link href={to} data-testid="metric-card-link" className="block">
      {body}
    </Link>
  ) : (
    body
  );
}
