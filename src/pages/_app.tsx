import { ErrorBoundary } from "@/_errorBoundaries/ErrorBoundary";
import { persistor, store, useAppDispatch, useAppSelector } from "@/_redux/store";
import { ThemeProvider } from "@/_hooks/useTheme";
import { CurrencyProvider } from "@/_hooks/useCurrency";
import PageTransition from "@/_UI/PageTransition";
import { AppShell } from "@/_components/AppShell";
import { OutcomeProvider } from "@/_UI/Outcome";
import { initAuth } from "@/_utils/authInit";
import { hydrateAuth } from "@/_redux/reducers/auth.reducer";
import { profileAction } from "@/_redux/actions/profile.action";
import { cartAction } from "@/_redux/actions/cart.action";
import { wishlistAction } from "@/_redux/actions/wishlist.action";
import { appConstants } from "@/_redux/constants";
import { fetchStoreSettings } from "@/_redux/reducers/settings.reducer";
import { scheduleProactiveRefresh, stopAuthScheduler } from "@/_utils/tokenRefresh";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { NuqsAdapter } from "nuqs/adapters/next/pages";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

// Reconciles auth state against the cookie once persist has rehydrated, and
// owns the proactive-refresh timer for the lifetime of the session.
function AuthBootstrap({ children }: { children: React.ReactNode }) {
	const dispatch = useAppDispatch();
	const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
	const user = useAppSelector((state) => state.auth.user);
	const isAdmin = appConstants.ADMIN_ROLES.includes(
		(user?.profileType?.toUpperCase() as any) || ""
	);

	useEffect(() => {
		initAuth(dispatch);
		// Admin-owned storefront settings (free-shipping threshold, tax, discount
		// kill-switch). Public endpoint, so this runs regardless of auth state.
		dispatch(fetchStoreSettings());
		return () => stopAuthScheduler();
	}, [dispatch]);

	// Synchronize cart and wishlist from backend on app boot / authentication,
	// so the header notification badge is always accurate across all devices immediately.
	useEffect(() => {
		if (isAuthenticated && !isAdmin) {
			dispatch(cartAction.syncCartOnLoginAsync(false) as any);
			dispatch(wishlistAction.syncWishlistOnLoginAsync(false) as any);
		}
	}, [isAuthenticated, isAdmin, dispatch]);

	// Re-synchronize when the user returns to the tab or app (e.g. switching back from web/mobile)
	useEffect(() => {
		if (!isAuthenticated || isAdmin) return;

		let lastSync = Date.now();
		const handleActiveSync = () => {
			if (
				(document.visibilityState === "visible" || document.hasFocus()) &&
				Date.now() - lastSync > 6000
			) {
				lastSync = Date.now();
				dispatch(cartAction.syncCartOnLoginAsync(false) as any);
				dispatch(wishlistAction.syncWishlistOnLoginAsync(false) as any);
			}
		};

		window.addEventListener("focus", handleActiveSync);
		document.addEventListener("visibilitychange", handleActiveSync);

		return () => {
			window.removeEventListener("focus", handleActiveSync);
			document.removeEventListener("visibilitychange", handleActiveSync);
		};
	}, [isAuthenticated, isAdmin, dispatch]);

	// (Re)arm the silent-refresh timer whenever the user becomes authenticated
	// (login or boot success); cancel it on logout. Refreshes reschedule
	// themselves, so this only needs to react to auth state transitions.
	useEffect(() => {
		if (isAuthenticated) {
			scheduleProactiveRefresh();
		} else {
			stopAuthScheduler();
		}
	}, [isAuthenticated]);

	// Self-heal: the cookie says authenticated but the persisted profile is
	// missing (state persisted before the uuid-id migration wiped it, or any
	// other way `user` and the cookie fell out of sync). Refetch it once so
	// role guards like withAdminAuth aren't stuck deciding access from a null
	// user. Deps only flip once user actually becomes non-null (or auth
	// becomes false), so a failed fetch is not retried — one attempt per
	// boot, ponytail: no backoff/retry framework for a rare edge case.
	useEffect(() => {
		if (!isAuthenticated || user) return;
		dispatch(profileAction.fetchProfileAsync())
			.unwrap()
			.then((res: any) => {
				if (res?.data) {
					dispatch(hydrateAuth({ isAuthenticated: true, user: res.data }));
				}
			})
			.catch(() => {
				// Network blip / genuinely invalid session. A real auth failure
				// (401) is already handled globally by the axios interceptor,
				// which force-logs-out and redirects; nothing further to do here.
			});
	}, [isAuthenticated, user, dispatch]);

	return <>{children}</>;
}

// Clean up old localStorage keys from previous persist versions
if (typeof window !== "undefined") {
	const OLD_KEYS = ["persist:Green_Pastures_GlObAl-StAtE"];
	OLD_KEYS.forEach((key) => {
		if (localStorage.getItem(key)) {
			localStorage.removeItem(key);
		}
	});
}

export default function App({ Component, pageProps }: AppProps) {
	const router = useRouter();
	// Dev-only: Next's dev-mode hydration leaves nuqs hooks stuck on their
	// defaults for deep-linked URLs (works fine in production builds).
	// Remounting the page once the router exposes the real query fixes the
	// initial read. Keep the key stable in production.
	const nuqsDevKey =
		process.env.NODE_ENV === "development"
			? String(router.isReady)
			: undefined;
	// AdminLayout is admin-only, so the shell can be selected by route here.
	const isAdminRoute = router.pathname.startsWith("/admin");
	return (
		<ErrorBoundary>
			<Provider store={store}>
				<PersistGate loading={null} persistor={persistor}>
					<AuthBootstrap>
						<ThemeProvider>
							<CurrencyProvider>
								<OutcomeProvider>
										<NuqsAdapter>
											{/*
											 * The admin shell (sidebar, top bar, tab strip) is mounted HERE,
											 * outside PageTransition, not inside AdminLayout. PageTransition
											 * keys its motion.div on router.pathname, so anything below it is
											 * unmounted and rebuilt on every navigation — which tore down the
											 * whole shell each time a tab was opened, switched, or closed.
											 * Only the page content should animate.
											 */}
											{isAdminRoute ? (
												<AppShell>
													<PageTransition>
														<Component key={nuqsDevKey} {...pageProps} />
													</PageTransition>
												</AppShell>
											) : (
												<PageTransition>
													<Component key={nuqsDevKey} {...pageProps} />
												</PageTransition>
											)}
										</NuqsAdapter>
									</OutcomeProvider>
							</CurrencyProvider>
						</ThemeProvider>
					</AuthBootstrap>

					<Toaster
						position="top-right"
						toastOptions={{
							duration: 4000,
							style: {
								borderRadius: "12px",
								padding: "12px 16px",
								fontSize: "14px",
								fontWeight: "500",
								fontFamily: '"DM Sans", sans-serif',
								boxShadow:
									"0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.05)",
							},
							success: {
								style: {
									background: "#f0fdf4",
									color: "#15803d",
									border: "1px solid #bbf7d0",
								},
								iconTheme: {
									primary: "#16a34a",
									secondary: "#f0fdf4",
								},
							},
							error: {
								style: {
									background: "#fef2f2",
									color: "#b91c1c",
									border: "1px solid #fee2e2",
								},
								iconTheme: {
									primary: "#dc2626",
									secondary: "#fef2f2",
								},
							},
						}}
					/>
				</PersistGate>
			</Provider>
		</ErrorBoundary>
	);
}
