import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StateFeedback } from "@/components/shared/state-feedback";

// Ported from ogaryde-admin-ui/src/components/shared/charts/chart-card.tsx.
// Only change: StateFeedback already existed in this codebase at
// @/components/shared/state-feedback (ported in an earlier phase-2 task)
// with an identical prop shape, so the import resolves as-is.

interface ChartCardProps {
  title: string;
  subtitle?: string;
  /** Right-aligned slot in the header (legend, range selector, trend chip). */
  action?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  /** True when the query succeeded but there's no data to plot. */
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
  children: ReactNode;
}

/** Titled frame around a chart, with built-in loading / error / empty states. */
export function ChartCard({
  title,
  subtitle,
  action,
  isLoading,
  isError,
  onRetry,
  isEmpty,
  emptyMessage = "No data yet.",
  className,
  children,
}: ChartCardProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardContent className="flex flex-1 flex-col gap-3 pt-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{title}</h3>
            {subtitle ? <p className="text-muted-foreground mt-0.5 truncate text-xs">{subtitle}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>

        <div className="min-h-[200px] flex-1">
          {isLoading ? (
            <Skeleton className="size-full min-h-[200px] rounded-lg" />
          ) : isError ? (
            <StateFeedback
              variant="error"
              size="sm"
              title="Couldn't load this chart."
              action={onRetry ? { label: "Retry", onClick: onRetry } : undefined}
            />
          ) : isEmpty ? (
            <StateFeedback variant="empty" size="sm" title={emptyMessage} />
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
  );
}
