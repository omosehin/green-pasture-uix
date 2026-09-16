// _utils/redirect.ts
//
// Pure helpers (edge-runtime safe — string ops only, no `window`) for building
// and consuming the post-login `?redirect=` param. Their job is to prevent the
// `/login?redirect=/login?redirect=/login?redirect=…` nesting that happens when
// the "current path" used to build a redirect already contains a redirect param.

const AUTH_PATHS = ["/login", "/signup"];

const isAuthPath = (p: string): boolean =>
	AUTH_PATHS.some((a) => p === a || p.startsWith(a + "?") || p.startsWith(a + "/"));

/**
 * Resolve a raw redirect/path into a safe app-internal destination:
 *  - unwraps any nested `/login?redirect=…` chains down to the real target,
 *  - never returns an auth page (returns "/" instead),
 *  - rejects non-internal (non-"/") values.
 */
export function safeRedirectTarget(raw: string | null | undefined): string {
	if (!raw) return "/";
	let path = raw;
	// Peel nested auth redirects (cap iterations to avoid pathological input).
	for (let i = 0; i < 20 && isAuthPath(path); i++) {
		const marker = "redirect=";
		const idx = path.indexOf(marker);
		if (idx === -1) return "/";
		try {
			path = decodeURIComponent(path.slice(idx + marker.length));
		} catch {
			return "/";
		}
	}
	return path.startsWith("/") && !isAuthPath(path) ? path : "/";
}

/**
 * Build a `/login` URL that returns the user to `currentPath` after login,
 * collapsing any existing nesting. Omits the param entirely for "/".
 */
export function loginUrlFor(currentPath: string | null | undefined): string {
	const target = safeRedirectTarget(currentPath);
	return target === "/" ? "/login" : `/login?redirect=${encodeURIComponent(target)}`;
}
