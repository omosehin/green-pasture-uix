"use client";

// Ported from ogaryde-admin-ui's components/shared/top-bar.tsx. Framework
// adaptation: useLocation().pathname -> useRouter().asPath (query stripped).
// Title now comes from findOwningModule (@/_navigations/modules) instead of
// walking NAV_GROUPS by hand, so detail routes resolve to their parent's title
// exactly like the tab bar does. The bell and its unread badge are wired to
// the existing useNotifications hook + NotificationDrawer; the theme toggle to
// the existing useTheme hook (green-pasture has no standalone ThemeToggle
// component, so it's inlined here as ogaryde's <ThemeToggle /> would render).

import { useState } from "react";
import { useRouter } from "next/router";
import { Bell, Moon, Search, Sun } from "lucide-react";

import { findOwningModule } from "@/_navigations/modules";
import { useNotifications } from "@/_hooks/useNotifications";
import { useTheme } from "@/_hooks/useTheme";
import NotificationDrawer from "@/_UI/NotificationDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

function usePageTitle(): string {
	const router = useRouter();
	const pathname = router.asPath.split("?")[0];
	return findOwningModule(pathname)?.title ?? "Green Pastures Admin";
}

export function TopBar() {
	const title = usePageTitle();
	const { isDark, toggleTheme } = useTheme();
	const [notifOpen, setNotifOpen] = useState(false);
	const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

	return (
		<>
			<header className="bg-background sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger data-testid="sidebar-trigger" className="-ml-1" />
				<Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-5" />
				<h1 className="text-sm font-semibold" data-testid="page-title">
					{title}
				</h1>

				<div className="ml-auto flex items-center gap-2">
					<div className="relative hidden md:block">
						<Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
						<Input
							type="search"
							placeholder="Search…"
							aria-label="Search"
							className="h-9 w-56 pl-8"
						/>
					</div>
					<Button
						variant="ghost"
						size="icon"
						aria-label="Notifications"
						className="relative"
						onClick={() => setNotifOpen(true)}
					>
						<Bell className="size-4" />
						{unreadCount > 0 && (
							<span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 text-[0.6rem] font-bold text-white">
								{unreadCount > 99 ? "99+" : unreadCount}
							</span>
						)}
					</Button>
					<Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggleTheme}>
						{isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
					</Button>
				</div>
			</header>

			<NotificationDrawer
				isOpen={notifOpen}
				onClose={() => setNotifOpen(false)}
				notifications={notifications}
				unreadCount={unreadCount}
				onMarkAsRead={markAsRead}
				onMarkAllAsRead={markAllAsRead}
				loading={loading}
			/>
		</>
	);
}
