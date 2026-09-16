"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
	ShoppingCart,
	ShoppingBag,
	Search,
	User,
	Heart,
	LogOut,
	Menu,
	X,
	Sun,
	Moon,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/_redux/store";
import { useRouter } from "next/router";
import { logout } from "@/_redux/reducers/auth.reducer";
import { clearCart } from "@/_redux/reducers/cart.reducer";
import { logoutAsync } from "@/_redux/actions/auth.action";
import { profileAction } from "@/_redux/actions/profile.action";
import { useTheme } from "@/_hooks/useTheme";
import { appConstants } from "@/_redux/constants";

interface NavLink {
	href: string;
	label: string;
}

const customerNavLinks: NavLink[] = [
	{ href: "/", label: "Home" },
	{ href: "/products", label: "Products" },
	{ href: "/about", label: "About" },
	{ href: "/contact", label: "Contact" },
];

const adminNavLinks: NavLink[] = [
	{ href: "/admin/dashboard", label: "Dashboard" },
	{ href: "/admin/products", label: "Products" },
	{ href: "/admin/orders", label: "Orders" },
	{ href: "/admin/customers", label: "Customers" },
];

const Navbar: React.FC = () => {
	const router = useRouter();
	const pathname = usePathname();
	const dispatch = useAppDispatch();
	const { toggleTheme, isDark } = useTheme();

	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const userMenuRef = useRef<HTMLDivElement>(null);


	const itemCount = useAppSelector((state) => state.cart.itemCount);
	const { isAuthenticated, user } = useAppSelector((state) => state.auth);
	const { profile } = useAppSelector((state) => state.profile);
	const bio = user;
	const isAdmin = appConstants.ADMIN_ROLES.includes(user?.profileType?.toUpperCase() as any || "");
	const wishlistCount = useAppSelector(
		(state) => state.wishlist.wishlistItemCount
	);
	const avatarUrl = profile?.profileImage?.url;

	useEffect(() => {
		// The auth slice doesn't carry the profile picture — only the profile
		// slice does, and nothing else guarantees it's loaded on every page.
		if (isAuthenticated && !profile) {
			dispatch(profileAction.fetchProfileAsync());
		}
	}, [isAuthenticated, profile, dispatch]);

	// Close user menu on outside click
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				userMenuRef.current &&
				!userMenuRef.current.contains(e.target as Node)
			) {
				setIsUserMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleLogout = () => {
		dispatch(logoutAsync())
			.unwrap()
			.catch(() => {})
			.finally(() => {
				dispatch(logout());
				dispatch(clearCart());
				router.push("/login");
			});
	};

	const isActive = (path: string) => pathname === path;

	return (
		<header className="fixed top-0 left-0 right-0 z-50 h-16 md:h-[72px] bg-mint-50/90 dark:bg-[#0e0e1a]/95 backdrop-blur-md shadow-elevation-1 dark:shadow-none border-b border-transparent dark:border-white/8 animate-header-enter">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-full">
				{/* Left: Logo */}
				<Link
					href="/"
					className="flex items-center gap-2.5 press-effect"
				>
					<div className="relative w-9 h-9 flex-shrink-0">
						<Image
							src="/images/GP Organic Logo (Primary).png"
							alt="Green Pastures Logo"
							height={100}
							width={100}
							priority
							sizes="(max-width: 768px) 2rem, (max-width: 1200px) 2.2rem, 3rem"
							className="object-contain"
						/>
					</div>
					<span className="hidden lg:inline-block text-lg font-bold text-on-surface dark:text-white tracking-tight">
						Green Pastures
					</span>
				</Link>

				{/* Center: Nav Links (desktop) */}
				<nav className="hidden md:flex gap-1">
					{(isAdmin ? adminNavLinks : customerNavLinks).map(({ href, label }) => (
						<Link
							key={href}
							href={href}
							className={`relative px-4 py-2 text-sm font-medium rounded-radius-md transition-colors duration-200 ${
								isActive(href)
									? "text-primary-600 dark:text-primary-400 font-semibold"
									: "text-on-surface/70 dark:text-white/70 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-white/5 dark:hover:text-white"
							}`}
						>
							{label}
							{isActive(href) && (
								<span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full" />
							)}
						</Link>
					))}
				</nav>

				{/* Right: Actions */}
				<div className="flex items-center gap-1 sm:gap-2">
					{/* Theme Toggle */}
					<button
						onClick={toggleTheme}
						className="p-2 rounded-radius-md text-on-surface/60 dark:text-white/50 hover:bg-surface-variant/50 dark:hover:bg-white/5 hover:text-on-surface dark:hover:text-white transition-colors duration-200 press-effect cursor-pointer"
						aria-label="Toggle theme"
					>
						{isDark ? (
							<Sun className="h-5 w-5" />
						) : (
							<Moon className="h-5 w-5" />
						)}
					</button>

					{/* Search — customers only */}
					{!isAdmin && (
						<Link
							href="/search"
							className={`p-2 rounded-radius-md transition-colors duration-200 press-effect ${
								isActive("/search")
									? "text-primary-600 dark:text-primary-400"
									: "text-on-surface/60 dark:text-white/50 hover:bg-surface-variant/50 dark:hover:bg-white/5 hover:text-on-surface dark:hover:text-white"
							}`}
						>
							<Search className="h-5 w-5" />
						</Link>
					)}

					{/* Wishlist — customers only */}
					{!isAdmin && (
						<Link
							href="/wishlist"
							className={`relative p-2 rounded-radius-md transition-colors duration-200 press-effect ${
								isActive("/wishlist")
									? "text-primary-600 dark:text-primary-400"
									: "text-on-surface/60 dark:text-white/50 hover:bg-surface-variant/50 dark:hover:bg-white/5 hover:text-on-surface dark:hover:text-white"
							}`}
						>
							<Heart className="h-5 w-5" />
							{wishlistCount > 0 && (
								<span className="bg-primary-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center absolute -top-1.5 -right-1.5">
									{wishlistCount}
								</span>
							)}
						</Link>
					)}

	
					{/* User Menu */}
					{isAuthenticated && bio ? (
						<div className="relative" ref={userMenuRef}>
							<button
								onClick={() =>
									setIsUserMenuOpen(!isUserMenuOpen)
								}
								className="flex items-center gap-2 p-1.5 rounded-radius-md text-on-surface/70 dark:text-white/70 hover:bg-surface-variant/50 dark:hover:bg-white/5 transition-colors duration-200 press-effect cursor-pointer"
							>
								{avatarUrl ? (
									<Image
										src={avatarUrl}
										alt=""
										width={32}
										height={32}
										className="w-8 h-8 rounded-full object-cover"
									/>
								) : (
									<div className="w-8 h-8 rounded-full bg-primary-600 dark:bg-primary-500 text-white text-sm font-semibold flex items-center justify-center">
										{bio.firstName?.charAt(0)?.toUpperCase() ||
											"U"}
									</div>
								)}
								<span className="hidden sm:block text-sm font-medium text-on-surface dark:text-white/90">
									{bio.firstName}
								</span>
							</button>

							{isUserMenuOpen && (
								<div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1a1a2e] rounded-radius-lg shadow-elevation-3 border border-outline-variant dark:border-white/8 py-1 z-50 animate-dropdown-enter overflow-hidden">
									<div className="break-all px-4 py-3 border-b border-outline-variant dark:border-white/8">
										<p className="text-sm font-semibold text-on-surface dark:text-white">
											{bio.firstName} {bio.lastName}
										</p>
										<p className="text-xs text-on-surface/50 dark:text-white/50 mt-0.5">
											{bio.email}
										</p>
									</div>
									<Link
										href="/profile"
										className="flex items-center gap-2 px-4 py-2.5 text-sm text-on-surface/80 dark:text-white/70 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-white/5 dark:hover:text-white transition-colors duration-150"
										onClick={() =>
											setIsUserMenuOpen(false)
										}
									>
										<User className="h-4 w-4" />
										Profile
									</Link>
									{!isAdmin && (
										<Link
											href="/my-orders"
											className="flex items-center gap-2 px-4 py-2.5 text-sm text-on-surface/80 dark:text-white/70 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-white/5 dark:hover:text-white transition-colors duration-150"
											onClick={() =>
												setIsUserMenuOpen(false)
											}
										>
											<ShoppingBag className="h-4 w-4" />
											My Orders
										</Link>
									)}
									{appConstants.ADMIN_ROLES.includes(
										bio?.profileType?.toUpperCase() as any || ""
									) && (
										<Link
											href="/admin/dashboard"
											className="flex items-center gap-2 px-4 py-2.5 text-sm text-on-surface/80 dark:text-white/70 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-white/5 dark:hover:text-white transition-colors duration-150"
											onClick={() =>
												setIsUserMenuOpen(false)
											}
										>
											<ShoppingCart className="h-4 w-4" />
											Admin Dashboard
										</Link>
									)}
									<div className="border-t border-outline-variant dark:border-white/8 my-1" />
									<button
										onClick={() => {
											handleLogout();
											setIsUserMenuOpen(false);
										}}
										className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error/5 dark:hover:bg-error/10 transition-colors duration-150 cursor-pointer"
									>
										<LogOut className="h-4 w-4" />
										Sign out
									</button>
								</div>
							)}
						</div>
					) : (
						<div className="relative" ref={userMenuRef}>
							<button
								onClick={() =>
									setIsUserMenuOpen(!isUserMenuOpen)
								}
								className="p-2 rounded-radius-md text-on-surface/60 dark:text-white/50 hover:bg-surface-variant/50 dark:hover:bg-white/5 hover:text-on-surface dark:hover:text-white transition-colors duration-200 press-effect cursor-pointer"
							>
								<User className="h-5 w-5" />
							</button>

							{isUserMenuOpen && (
								<div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1a1a2e] rounded-radius-lg shadow-elevation-3 border border-outline-variant dark:border-white/8 py-1 z-50 animate-dropdown-enter overflow-hidden">
									<Link
										href="/login"
										className="flex items-center gap-2 px-4 py-2.5 text-sm text-on-surface/80 dark:text-white/70 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-white/5 dark:hover:text-white transition-colors duration-150"
										onClick={() =>
											setIsUserMenuOpen(false)
										}
									>
										<User className="h-4 w-4" />
										Login
									</Link>
								</div>
							)}
						</div>
					)}

					{/* Cart — only for customers */}
					{!isAdmin && (
						<Link
							href="/cart"
							className={`relative p-2 rounded-radius-md transition-colors duration-200 press-effect ${
								isActive("/cart")
									? "text-primary-600 dark:text-primary-400"
									: "text-on-surface/60 dark:text-white/50 hover:bg-surface-variant/50 dark:hover:bg-white/5 hover:text-on-surface dark:hover:text-white"
							}`}
						>
							<ShoppingCart className="h-5 w-5" />
							{itemCount > 0 && (
								<span className="bg-primary-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center absolute -top-1.5 -right-1.5">
									{itemCount}
								</span>
							)}
						</Link>
					)}

					{/* Mobile Hamburger */}
					<button
						onClick={() =>
							setIsMobileMenuOpen(!isMobileMenuOpen)
						}
						className="md:hidden p-2 rounded-radius-md text-on-surface/60 dark:text-white/50 hover:bg-surface-variant/50 dark:hover:bg-white/5 transition-colors duration-200 press-effect cursor-pointer"
						aria-label="Toggle mobile menu"
					>
						{isMobileMenuOpen ? (
							<X className="h-5 w-5" />
						) : (
							<Menu className="h-5 w-5" />
						)}
					</button>
				</div>
			</div>

			{/* Mobile Menu Panel */}
			{isMobileMenuOpen && (
				<div className="md:hidden bg-white dark:bg-[#0e0e1a] border-t border-outline-variant dark:border-white/8 shadow-elevation-2 dark:shadow-none animate-dropdown-enter">
					<div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
						{/* Search Bar */}
						<Link
							href="/search"
							className="flex items-center gap-3 px-3 py-2.5 rounded-radius-md text-on-surface/70 dark:text-white/70 hover:bg-surface-variant/50 dark:hover:bg-white/5 transition-colors duration-150"
							onClick={() => setIsMobileMenuOpen(false)}
						>
							<Search className="h-5 w-5" />
							<span className="text-sm font-medium">Search</span>
						</Link>

						<div className="border-t border-outline-variant dark:border-white/8 my-2" />

						{/* Nav Links */}
						{(isAdmin ? adminNavLinks : customerNavLinks).map(({ href, label }) => (
							<Link
								key={href}
								href={href}
								className={`flex items-center px-3 py-2.5 rounded-radius-md text-sm font-medium transition-colors duration-150 ${
									isActive(href)
										? "text-primary-600 dark:text-primary-400 bg-primary-600/10 dark:bg-primary-400/10 font-semibold"
										: "text-on-surface/70 dark:text-white/70 hover:bg-surface-variant/50 dark:hover:bg-white/5"
								}`}
								onClick={() => setIsMobileMenuOpen(false)}
							>
								{label}
							</Link>
						))}

						<div className="border-t border-outline-variant dark:border-white/8 my-2" />

						{/* User actions */}
						{isAuthenticated && bio ? (
							<>
								<div className="px-3 py-2">
									<p className="text-sm font-semibold text-on-surface dark:text-white">
										{bio.firstName} {bio.lastName}
									</p>
									<p className="text-xs text-on-surface/50 dark:text-white/50">
										{bio.email}
									</p>
								</div>
								<Link
									href="/profile"
									className="flex items-center gap-3 px-3 py-2.5 rounded-radius-md text-sm text-on-surface/70 dark:text-white/70 hover:bg-surface-variant/50 dark:hover:bg-white/5 transition-colors duration-150"
									onClick={() =>
										setIsMobileMenuOpen(false)
									}
								>
									<User className="h-4 w-4" />
									Profile
								</Link>
								<button
									onClick={() => {
										handleLogout();
										setIsMobileMenuOpen(false);
									}}
									className="flex items-center gap-3 w-full px-3 py-2.5 rounded-radius-md text-sm text-error hover:bg-error/5 transition-colors duration-150"
								>
									<LogOut className="h-4 w-4" />
									Sign out
								</button>
							</>
						) : (
							<Link
								href="/login"
								className="flex items-center gap-3 px-3 py-2.5 rounded-radius-md text-sm text-on-surface/70 dark:text-white/70 hover:bg-surface-variant/50 dark:hover:bg-white/5 transition-colors duration-150"
								onClick={() => setIsMobileMenuOpen(false)}
							>
								<User className="h-4 w-4" />
								Login
							</Link>
						)}
					</div>
				</div>
			)}
		</header>
	);
};

export default Navbar;
