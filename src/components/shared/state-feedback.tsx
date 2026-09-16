import type { ReactNode } from "react";
import Link from "next/link";
import {
	AlertTriangle,
	CheckCircle2,
	Inbox,
	Loader2,
	Lock,
	SearchX,
	WifiOff,
	type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Ported from ogaryde-admin-ui/src/components/shared/state-feedback.tsx, with
// react-router-dom's <Link to> swapped for next/link's <Link href> (this app
// is Next.js, not a router.tsx SPA).

export type StateVariant = "loading" | "empty" | "error" | "offline" | "notFound" | "forbidden" | "success";

interface VariantConfig {
	Icon: LucideIcon;
	title: string;
	tone: string; // icon colour
	/** Motion applied to the icon. Decorative motion is gated with motion-safe: at the call site. */
	iconMotion: string;
}

const VARIANTS: Record<StateVariant, VariantConfig> = {
	loading: { Icon: Loader2, title: "Loading…", tone: "text-muted-foreground", iconMotion: "animate-spin" },
	empty: { Icon: Inbox, title: "Nothing here yet", tone: "text-muted-foreground", iconMotion: "motion-safe:animate-float" },
	// ponytail: ogaryde's error variant uses a "shake" keyframe this project doesn't define.
	// Left un-animated rather than adding CSS for one icon wobble; add @keyframes shake if wanted later.
	error: { Icon: AlertTriangle, title: "Something went wrong", tone: "text-red-600 dark:text-red-400", iconMotion: "" },
	offline: { Icon: WifiOff, title: "You're offline", tone: "text-amber-600 dark:text-amber-400", iconMotion: "motion-safe:animate-pulse" },
	notFound: { Icon: SearchX, title: "Not found", tone: "text-muted-foreground", iconMotion: "" },
	forbidden: { Icon: Lock, title: "Access denied", tone: "text-red-600 dark:text-red-400", iconMotion: "" },
	success: { Icon: CheckCircle2, title: "Done", tone: "text-emerald-600 dark:text-emerald-400", iconMotion: "" },
};

const SIZE_WRAP: Record<NonNullable<StateFeedbackProps["size"]>, string> = {
	sm: "py-6",
	md: "py-10",
	full: "min-h-[50vh]",
};

export interface StateFeedbackProps {
	variant: StateVariant;
	title?: string;
	message?: string;
	action?: { label: string; onClick?: () => void; href?: string };
	size?: "sm" | "md" | "full";
	icon?: ReactNode;
	className?: string;
	"data-testid"?: string;
}

/**
 * Unified feedback for loading / empty / error / offline / not-found / forbidden / success.
 */
export function StateFeedback({
	variant,
	title,
	message,
	action,
	size = "md",
	icon,
	className,
	"data-testid": testId,
}: StateFeedbackProps) {
	const cfg = VARIANTS[variant];
	const { Icon } = cfg;

	return (
		<div
			role={variant === "error" ? "alert" : "status"}
			aria-live={variant === "loading" ? "polite" : undefined}
			data-testid={testId ?? `state-${variant}`}
			className={cn(
				"flex flex-col items-center justify-center px-4 text-center",
				"motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-300",
				SIZE_WRAP[size],
				className,
			)}
		>
			<div className="bg-muted flex size-12 items-center justify-center rounded-full">
				{icon ?? <Icon className={cn("size-6", cfg.tone, cfg.iconMotion)} aria-hidden />}
			</div>
			<h2 className="mt-4 text-base font-semibold">{title ?? cfg.title}</h2>
			{message ? <p className="text-muted-foreground mt-1 max-w-sm text-sm">{message}</p> : null}
			{action ? (
				<div className="mt-4">
					{action.href ? (
						<Button asChild size="sm" variant="outline">
							<Link href={action.href}>{action.label}</Link>
						</Button>
					) : (
						<Button size="sm" variant="outline" onClick={action.onClick}>
							{action.label}
						</Button>
					)}
				</div>
			) : null}
		</div>
	);
}
