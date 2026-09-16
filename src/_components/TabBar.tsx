"use client";

// Ported from ogaryde-admin-ui's components/shared/tab-bar.tsx, as close to
// verbatim as the framework swap allows: useLocation -> useRouter().asPath
// (query stripped, never router.pathname — that's the file pattern and would
// break detail routes), navigate(path) -> router.push(path).

import { useRouter } from "next/router";
import { X } from "lucide-react";

import { findModule, findOwningModule } from "@/_navigations/modules";
import { useTabsStore, HOME_PATH } from "@/_store/tabs.store";
import { cn } from "@/lib/utils";

/** Stable per-tab slug for test ids: "/admin/dashboard" -> "admin/dashboard". */
function slugOf(path: string): string {
	return path.replace(/^\//, "");
}

export function TabBar() {
	const router = useRouter();
	const pathname = router.asPath.split("?")[0];
	const openPaths = useTabsStore((s) => s.openPaths);
	const closeTab = useTabsStore((s) => s.closeTab);

	function handleClose(path: string) {
		if (path === pathname) {
			const idx = openPaths.indexOf(path);
			const next = openPaths[idx - 1] ?? openPaths[idx + 1] ?? HOME_PATH;
			router.push(next);
		}
		closeTab(path);
	}

	// The "active" tab is the one whose path owns the current pathname (handles detail routes).
	const activeTabPath = findOwningModule(pathname)?.path ?? pathname;

	return (
		<div
			role="tablist"
			data-testid="tab-bar"
			className="bg-background sticky top-14 z-10 flex h-10 shrink-0 items-center gap-1 overflow-x-auto border-b px-2"
		>
			{openPaths.map((path) => {
				const mod = findModule(path);
				if (!mod) return null;

				const isActive = activeTabPath === path;
				const slug = slugOf(path);
				const Icon = mod.icon;
				const closable = mod.closable !== false;

				return (
					<div
						key={path}
						role="tab"
						aria-selected={isActive}
						data-testid={`tab-${slug}`}
						data-active={isActive ? "true" : undefined}
						onClick={() => router.push(path)}
						className={cn(
							"group flex h-8 cursor-pointer items-center gap-2 rounded-md px-3 text-sm whitespace-nowrap",
							isActive
								? "bg-accent text-accent-foreground font-medium"
								: "text-muted-foreground hover:bg-accent/50",
						)}
					>
						<Icon className="size-4" />
						<span>{mod.title}</span>
						{closable && (
							<button
								type="button"
								aria-label={`Close ${mod.title}`}
								data-testid={`tab-close-${slug}`}
								onClick={(e) => {
									e.stopPropagation();
									handleClose(path);
								}}
								className="hover:bg-muted-foreground/20 -mr-1 ml-1 rounded p-0.5"
							>
								<X className="size-3.5" />
							</button>
						)}
					</div>
				);
			})}
		</div>
	);
}
