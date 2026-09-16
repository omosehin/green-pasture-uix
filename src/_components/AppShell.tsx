"use client";

// Ported from ogaryde-admin-ui's components/shared/app-shell.tsx. `<Outlet />`
// is replaced by `{children}` since this is Next's Pages Router, not
// react-router. ogaryde's <OfflineBanner /> is skipped — green-pasture has no
// equivalent component; this is a deliberate omission, not an oversight.

import type { ReactNode } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { TabBar } from "./TabBar";
import { useTabSync } from "@/_hooks/useTabSync";

/**
 * Protected application shell: collapsible sidebar + top bar + tab strip
 * wrapping the routed page content. `useTabSync` keeps the open-tab set
 * aligned with the URL.
 *
 * `TooltipProvider` wraps the tree here rather than in `_app.tsx`: the
 * collapsed sidebar's icon tooltips (via shadcn's `SidebarMenuButton
 * tooltip=`) are the only tooltip consumer in the app, and ogaryde provides
 * this at its app root — scoping it to the admin shell is the equivalent,
 * smaller-footprint fix.
 */
export function AppShell({ children }: { children: ReactNode }) {
	useTabSync();

	return (
		<TooltipProvider delayDuration={300}>
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset>
					<TopBar />
					<TabBar />
					<div className="flex-1 overflow-auto p-4 md:p-6 min-w-0 max-w-full">{children}</div>
				</SidebarInset>
			</SidebarProvider>
		</TooltipProvider>
	);
}
