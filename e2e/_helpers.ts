import { Page, BrowserContext } from "@playwright/test";

export const PHONE = { width: 375, height: 812 }; // iPhone X / 11 / 12 mini class
export const TABLET = { width: 768, height: 1024 };

/** True when the document itself scrolls sideways. */
export const overflowsHorizontally = (page: Page) =>
	page.evaluate(
		// +1 absorbs sub-pixel rounding, which is not a real overflow.
		() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
	);

/**
 * True when `selector` scrolls sideways inside itself.
 *
 * Needed because the admin shell's <main> is `overflow-y-auto`, and CSS
 * computes the other axis to `auto` when one axis is non-visible. An oversized
 * child therefore scrolls <main> horizontally instead of widening the document,
 * so a document-level check alone reports nothing — which made an earlier
 * version of the admin spec pass even with a deliberate 900px element on the
 * page. The user still sees a sideways scroll, so it still fails the intent.
 */
export const scrollsHorizontally = (page: Page, selector: string) =>
	page.evaluate((sel) => {
		const el = document.querySelector(sel);
		if (!el) return false;
		return el.scrollWidth > el.clientWidth + 1;
	}, selector);

/**
 * Elements wider than the viewport, reported by selector so a failure names the
 * culprit instead of just saying "something overflows".
 */
export const offendingElements = (page: Page) =>
	page.evaluate(() => {
		const limit = document.documentElement.clientWidth + 1;
		const culprits: string[] = [];

		// An oversized element only widens the page if nothing between it and the
		// root clips or scrolls its overflow. Decorative background blobs are
		// deliberately wider than the viewport and sit inside an overflow-hidden
		// ancestor, and admin tables scroll inside overflow-x-auto — both are
		// correct, so neither must be reported.
		const isClipped = (el: HTMLElement): boolean => {
			for (let a = el.parentElement; a; a = a.parentElement) {
				if (getComputedStyle(a).overflowX !== "visible") return true;
			}
			return false;
		};

		document.querySelectorAll<HTMLElement>("body *").forEach((el) => {
			if (el.getBoundingClientRect().width <= limit) return;
			if (getComputedStyle(el).overflowX !== "visible") return;
			if (isClipped(el)) return;
			culprits.push(
				`${el.tagName.toLowerCase()}${el.className ? `.${String(el.className).split(/\s+/).slice(0, 3).join(".")}` : ""} (${Math.round(el.getBoundingClientRect().width)}px)`,
			);
		});
		return culprits.slice(0, 5);
	});

/**
 * Signs in as an admin without a backend.
 *
 * Two gates have to be satisfied: `src/middleware.ts` reads the gp_at / gp_role
 * cookies server-side before the page is ever sent, and `withAdminAuth` reads
 * the persisted redux auth slice client-side. Setting only one leaves you on a
 * redirect or stuck on "Verifying access…".
 */
export async function signInAsAdmin(context: BrowserContext, baseURL: string) {
	const origin = new URL(baseURL).origin;

	await context.addCookies([
		{ name: "gp_at", value: "e2e-fake-access-token", url: origin },
		{ name: "gp_role", value: "admin", url: origin },
	]);

	// redux-persist stores each slice as a JSON string inside a JSON object.
	const auth = JSON.stringify({
		isAuthenticated: true,
		user: {
			id: 1,
			firstName: "E2e",
			lastName: "Admin",
			email: "e2e.admin@greenpasture.test",
			profileType: "ADMIN",
		},
		token: "e2e-fake-access-token",
	});

	await context.addInitScript(
		([key, authSlice]) => {
			window.localStorage.setItem(
				key,
				JSON.stringify({
					auth: authSlice,
					_persist: JSON.stringify({ version: 1, rehydrated: true }),
				}),
			);
		},
		// redux-persist prefixes its storage key with "persist:" — see the
		// OLD_KEYS cleanup in _app.tsx. Without the prefix the slice is never
		// rehydrated, withAdminAuth sees an anonymous user, and every admin route
		// silently redirects to "/" — where the assertions then measure the public
		// home page instead of failing.
		["persist:Green_Pastures_GlObAl-StAtE_v2", auth] as const,
	);
}
