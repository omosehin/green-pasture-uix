"use client";

// Ported from ogaryde-admin-ui's components/shared/app-sidebar.tsx. Framework
// adaptations: react-router Link/useLocation/useNavigate -> next/link and
// next/router; NavItem -> ModuleDef from @/_navigations/modules; privilege
// filtering via useHasPrivilege() (backed by profileInfo.roles[].permissions[]).

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { LogOut } from "lucide-react";

import { NAV_GROUPS, findOwningModule, type ModuleDef } from "@/_navigations/modules";
import { useHasPrivilege } from "@/_hooks/usePrivilege";
import { useAppDispatch, useAppSelector } from "@/_redux/store";
import { logoutAsync } from "@/_redux/actions/auth.action";
import { logout } from "@/_redux/reducers/auth.reducer";
import { clearCart } from "@/_redux/reducers/cart.reducer";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	useSidebar,
} from "@/components/ui/sidebar";

function NavMenuButton({ item }: { item: ModuleDef }) {
	const router = useRouter();
	const { setOpenMobile } = useSidebar();
	const pathname = router.asPath.split("?")[0];
	// findOwningModule (not a plain prefix match) so a detail route like
	// /admin/product/<uuid> highlights the Products entry, matching TabBar.
	const isActive = findOwningModule(pathname)?.path === item.path;
	const testid = `nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`;

	return (
		<SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
			{/* On mobile the sidebar is an overlay sheet, so picking a tab has to
			    dismiss it — otherwise it sits on top of the page it just opened.
			    setOpenMobile is inert on desktop, where the rail is persistent. */}
			<Link href={item.path} data-testid={testid} onClick={() => setOpenMobile(false)}>
				<item.icon className="size-4" />
				<span>{item.title}</span>
			</Link>
		</SidebarMenuButton>
	);
}

function initialsOf(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "AD";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AppSidebar() {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const hasPrivilege = useHasPrivilege();
	const { setOpenMobile } = useSidebar();
	const { user } = useAppSelector((state) => state.auth);

	const displayName =
		[user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Admin";
	const initials = initialsOf(displayName);

	function handleSignOut() {
		dispatch(logoutAsync())
			.unwrap()
			.catch(() => {})
			.finally(() => {
				dispatch(logout());
				dispatch(clearCart());
				router.push("/login");
			});
	}

	return (
		<Sidebar collapsible="icon" data-testid="app-sidebar">
			<SidebarHeader>
				{/* Navigates too, so it dismisses the mobile sheet like any tab does. */}
				<Link
					href="/admin/dashboard"
					onClick={() => setOpenMobile(false)}
					className="flex h-12 items-center gap-2.5 px-2"
				>
					<div className="relative size-8 shrink-0">
						<Image
							src="/images/GP Organic Logo (Primary).png"
							alt="Green Pastures Logo"
							fill
							sizes="32px"
							priority
							className="object-contain"
						/>
					</div>
					<span className="text-base font-bold tracking-tight group-data-[collapsible=icon]:hidden">
						Admin Panel
					</span>
				</Link>
			</SidebarHeader>

			<SidebarContent>
				{NAV_GROUPS.map((group) => {
					const items = group.items.filter((item) => hasPrivilege(item.privilege));
					if (items.length === 0) return null;
					return (
						<SidebarGroup key={group.label}>
							<SidebarGroupLabel>{group.label}</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									{items.map((item) => (
										<SidebarMenuItem key={item.path}>
											<NavMenuButton item={item} />
										</SidebarMenuItem>
									))}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					);
				})}
			</SidebarContent>

			{/*
			  Static block, as the current Sidebar.tsx footer renders it — no
			  dropdown. Sign-out (previously in Header.tsx's user menu, which
			  TopBar does not carry over) lives here as a plain icon button: a
			  DropdownMenu trigger wrapping SidebarMenuButton would need Radix to
			  attach a ref to it, and this SidebarMenuButton primitive isn't
			  forwardRef'd, which throws a console warning on React 18.
			*/}
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<div className="flex items-center gap-2 rounded-md px-2 py-1.5 group-data-[collapsible=icon]:justify-center">
							<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-600 dark:bg-primary-500 text-xs font-semibold text-white">
								{initials}
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
								<span className="truncate font-medium">{displayName}</span>
								<span className="truncate text-xs text-sidebar-foreground/60 capitalize">
									{user?.profileType?.toLowerCase() ?? "Administrator"}
								</span>
							</div>
							<button
								type="button"
								onClick={handleSignOut}
								aria-label="Sign out"
								data-testid="sign-out"
								className="shrink-0 rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden"
							>
								<LogOut className="size-4" />
							</button>
						</div>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
