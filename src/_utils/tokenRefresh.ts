// _utils/tokenRefresh.ts
//
// Single source of truth for keeping the session alive. The access token lives
// only 15 minutes; the refresh token lives 7 days. This module:
//   - refreshAccessToken(): single-flight refresh (shared by the axios 401
//     interceptor, boot-time reconciliation, and the proactive timer).
//   - a proactive scheduler that refreshes shortly before the access token's
//     `exp`, so requests essentially never 401 and idle sessions stay alive.
//   - forceLogout(): centralized session-end handling that captures the live
//     path and routes to /login?redirect=<path> so the user returns to where
//     they were after re-authenticating.
import axios from "axios";
import Cookies from "js-cookie";
import Router from "next/router";

import { appConstants } from "@/_redux/constants";
import { authCookies, AUTH_COOKIES, getTokenExpiry } from "./authCookies";
import { loginUrlFor } from "./redirect";

// Refresh ~60s before expiry to absorb clock skew / in-flight requests.
const REFRESH_SKEW_MS = 60_000;
const MAX_TIMEOUT_MS = 2_147_483_000; // setTimeout 32-bit ceiling guard

let pending: Promise<string> | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

const clearTimer = () => {
	if (refreshTimer) {
		clearTimeout(refreshTimer);
		refreshTimer = null;
	}
};

/**
 * Refresh the access token using the refresh-token cookie. Single-flight:
 * concurrent callers share one in-flight request. Updates cookies and returns
 * the new access token. Throws if there is no refresh token or the API rejects.
 * Uses raw axios (not axiosInstance) so it never recurses into the interceptor.
 */
export async function refreshAccessToken(): Promise<string> {
	if (pending) return pending;
	pending = (async () => {
		const refreshToken = Cookies.get(AUTH_COOKIES.refreshToken);
		if (!refreshToken) throw new Error("No refresh token available");

		const response = await axios.post(
			`${appConstants.API_BASE_URL}auth/refresh`,
			{},
			{ headers: { Authorization: `Bearer ${refreshToken}` } }
		);

		const { accessToken, refreshToken: newRefreshToken } = response.data.data;
		authCookies.setTokens(accessToken, newRefreshToken || refreshToken);
		scheduleProactiveRefresh(accessToken);
		return accessToken as string;
	})().finally(() => {
		pending = null;
	});
	return pending;
}

/**
 * Schedule a silent refresh shortly before the access token expires, then let
 * each refresh reschedule the next one. Idempotent — clears any prior timer.
 */
export function scheduleProactiveRefresh(accessToken?: string): void {
	if (typeof window === "undefined") return;
	clearTimer();

	const token = accessToken ?? Cookies.get(AUTH_COOKIES.accessToken);
	if (!token) return;

	const exp = getTokenExpiry(token);
	if (!exp) return;

	const remainingMs = exp * 1000 - Date.now();
	if (remainingMs <= REFRESH_SKEW_MS) return; // token already in skew window — let the 401 interceptor handle it reactively

	const delay = Math.min(remainingMs - REFRESH_SKEW_MS, MAX_TIMEOUT_MS);

	refreshTimer = setTimeout(() => {
		// On failure, stay quiet: the next authenticated request (or its 401)
		// funnels through the interceptor, which handles session-end + redirect.
		refreshAccessToken().catch(() => {});
	}, delay);
}

export function stopAuthScheduler(): void {
	clearTimer();
}

/**
 * Genuine session end (refresh failed / revoked). Clears auth state, stops the
 * scheduler, and — unless already on an auth page — sends the user to /login
 * while preserving the page they were on so they return after logging in.
 */
export async function forceLogout(
	{ redirect }: { redirect: boolean } = { redirect: true }
): Promise<void> {
	stopAuthScheduler();
	try {
		const { store } = await import("@/_redux/store");
		const { logout } = await import("@/_redux/reducers/auth.reducer");
		store.dispatch(logout());
	} catch {
		authCookies.clearTokens();
	}

	if (redirect && typeof window !== "undefined") {
		const { pathname, search } = window.location;
		const onAuthPage = /^\/(login|signup)/.test(pathname);
		if (!onAuthPage) {
			Router.replace(loginUrlFor(pathname + search)).catch(() => {});
		}
	}
}
