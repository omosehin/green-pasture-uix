// _utils/authCookies.ts - Cookie-backed token storage
//
// Replaces the former encrypted-localStorage `secureTokenStorage`. Tokens live
// in cookies so that Next.js middleware (which cannot read localStorage) can
// guard routes server-side. The access token (`gp_at`) is the single source of
// truth for "is the user authenticated"; auth state is always DERIVED from it,
// never persisted as a standalone boolean.
//
// NOTE: these cookies are set by JS and are therefore NOT httpOnly — against
// XSS they are no safer than localStorage. The genuine hardening (httpOnly,
// Secure cookies set via Set-Cookie) requires the API to set them. This module
// is the seam where that swap would happen.
import Cookies from "js-cookie";

export const AUTH_COOKIES = {
	accessToken: "gp_at",
	refreshToken: "gp_rt",
	role: "gp_role",
} as const;

const COOKIE_DAYS = 7;

const baseOptions = (): Cookies.CookieAttributes => ({
	expires: COOKIE_DAYS,
	path: "/",
	sameSite: "lax",
	secure: process.env.NODE_ENV === "production",
});

/**
 * Decode a JWT payload without verifying its signature (verification is the
 * API's job). Returns null for malformed tokens.
 */
const decodeJwtPayload = (token: string): Record<string, any> | null => {
	try {
		const payload = token.split(".")[1];
		if (!payload) return null;
		// base64url -> base64
		const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
		const json =
			typeof window !== "undefined"
				? window.atob(base64)
				: Buffer.from(base64, "base64").toString("binary");
		return JSON.parse(json);
	} catch {
		return null;
	}
};

/**
 * True when the JWT carries an `exp` claim that is already in the past.
 * Tokens without an `exp` are treated as not-expired (let the API reject them).
 */
export const isJwtExpired = (token: string): boolean => {
	const payload = decodeJwtPayload(token);
	if (!payload || typeof payload.exp !== "number") return false;
	return payload.exp * 1000 <= Date.now();
};

/** The JWT `exp` claim in epoch seconds, or null when absent/malformed. */
export const getTokenExpiry = (token: string): number | null => {
	const payload = decodeJwtPayload(token);
	return payload && typeof payload.exp === "number" ? payload.exp : null;
};

/** Extract a normalized (lowercase) role/profileType from a user object. */
const roleOf = (user?: any): string | undefined => {
	const raw = user?.profileType ?? user?.role;
	return typeof raw === "string" ? raw.toLowerCase() : undefined;
};

export const authCookies = {
	/** Persist tokens (+ role for middleware) to cookies. */
	setTokens: (accessToken: string, refreshToken: string, user?: any) => {
		const opts = baseOptions();
		Cookies.set(AUTH_COOKIES.accessToken, accessToken, opts);
		if (refreshToken) Cookies.set(AUTH_COOKIES.refreshToken, refreshToken, opts);

		const role = roleOf(user);
		if (role) Cookies.set(AUTH_COOKIES.role, role, opts);
	},

	/**
	 * Read tokens. Returns null when the access cookie is missing or its JWT has
	 * expired — so callers can treat "no valid token" as logged out.
	 */
	getTokens: (): {
		accessToken: string;
		refreshToken: string;
		role?: string;
	} | null => {
		const accessToken = Cookies.get(AUTH_COOKIES.accessToken);
		if (!accessToken || isJwtExpired(accessToken)) return null;

		return {
			accessToken,
			refreshToken: Cookies.get(AUTH_COOKIES.refreshToken) || "",
			role: Cookies.get(AUTH_COOKIES.role),
		};
	},

	/** Remove all auth cookies. */
	clearTokens: () => {
		Cookies.remove(AUTH_COOKIES.accessToken, { path: "/" });
		Cookies.remove(AUTH_COOKIES.refreshToken, { path: "/" });
		Cookies.remove(AUTH_COOKIES.role, { path: "/" });
	},

	/** Rewrite only the access token (after a refresh). */
	updateAccessToken: (accessToken: string) => {
		Cookies.set(AUTH_COOKIES.accessToken, accessToken, baseOptions());
	},
};
