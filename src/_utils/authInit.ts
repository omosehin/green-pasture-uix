// _utils/authInit.ts - Boot-time auth reconciliation
//
// Runs once on app startup. The auth cookies are the single source of truth.
// If the access token is still valid we stay logged in; if it has expired but
// a refresh token is present we refresh silently (so a reload after the 15-min
// access window does NOT log the user out); only when there is no usable token
// do we drop to logged-out. Also performs a one-time migration cleanup of the
// legacy encrypted-localStorage tokens.
import Cookies from "js-cookie";

import type { AppDispatch } from "@/_redux/store";
import { hydrateAuth } from "@/_redux/reducers/auth.reducer";
import { authCookies, AUTH_COOKIES, isJwtExpired } from "./authCookies";
import { refreshAccessToken } from "./tokenRefresh";

export const initAuth = async (dispatch: AppDispatch): Promise<void> => {
	if (typeof window === "undefined") return;

	// One-time migration: drop tokens left behind by the old secureStorage.
	try {
		localStorage.removeItem("secure_auth");
		localStorage.removeItem("secure_auth_hash");
	} catch {
		/* ignore */
	}

	const accessToken = Cookies.get(AUTH_COOKIES.accessToken);
	const refreshToken = Cookies.get(AUTH_COOKIES.refreshToken);

	// Valid access token → already authenticated.
	if (accessToken && !isJwtExpired(accessToken)) {
		dispatch(hydrateAuth({ isAuthenticated: true }));
		return;
	}

	// Access token missing/expired but a refresh token exists → refresh silently.
	if (refreshToken) {
		try {
			await refreshAccessToken();
			dispatch(hydrateAuth({ isAuthenticated: true }));
			return;
		} catch {
			authCookies.clearTokens();
			dispatch(hydrateAuth({ isAuthenticated: false }));
			return;
		}
	}

	dispatch(hydrateAuth({ isAuthenticated: false }));
};
