import { test, expect } from "@playwright/test";
import { PHONE, TABLET, offendingElements, overflowsHorizontally } from "./_helpers";

/**
 * Enforces mobile responsiveness as a test rather than by eyeball.
 *
 * The failure this catches is always the same shape: a fixed width or an
 * unprefixed multi-column grid pushes the page wider than the viewport, and the
 * whole document scrolls sideways. That is invisible on a desktop monitor and
 * obvious on a phone, so it keeps shipping — hence a check that runs at phone
 * width on every public route.
 *
 * `/checkout` and the account pages are omitted on purpose: they redirect to
 * login without a session, so they'd assert against the login page instead.
 */

const PUBLIC_ROUTES = [
	"/",
	"/about",
	"/contact",
	"/products",
	"/cart",
	"/login",
	"/signup",
	"/terms",
	"/privacy",
	"/refund-policy",
	"/checkout-card",
];

for (const route of PUBLIC_ROUTES) {
	test(`${route} does not scroll sideways on a phone`, async ({ page }) => {
		await page.setViewportSize(PHONE);
		await page.goto(route);
		await page.waitForLoadState("networkidle");

		const culprits = await offendingElements(page);
		expect(culprits, `elements wider than the viewport on ${route}`).toEqual([]);
		expect(await overflowsHorizontally(page)).toBe(false);
	});
}

for (const route of PUBLIC_ROUTES) {
	test(`${route} does not scroll sideways on a tablet`, async ({ page }) => {
		await page.setViewportSize(TABLET);
		await page.goto(route);
		await page.waitForLoadState("networkidle");

		expect(await overflowsHorizontally(page)).toBe(false);
	});
}

test.describe("mobile interaction targets", () => {
	test("the primary nav is reachable on a phone", async ({ page }) => {
		await page.setViewportSize(PHONE);
		await page.goto("/");

		// Whatever the trigger is called, a phone must expose some way into the
		// nav rather than hiding the links entirely.
		const trigger = page
			.getByRole("button", { name: /menu|navigation|open menu/i })
			.or(page.locator("[aria-label*='menu' i]"))
			.first();

		await expect(trigger).toBeVisible();
	});

	test("form controls are tall enough to tap on the signup form", async ({ page }) => {
		await page.setViewportSize(PHONE);
		await page.goto("/signup");

		// Wait for the form to hydrate. Without this the locator resolves to zero
		// inputs on a cold dev server and the test fails for the wrong reason.
		const inputs = page.locator("form input:visible");
		await expect(inputs.first()).toBeVisible();

		// 36px is below the 44px ideal but catches genuinely untappable controls
		// without failing on this design system's 40-44px inputs.
		const count = await inputs.count();
		expect(count).toBeGreaterThan(0);

		for (let i = 0; i < count; i++) {
			const box = await inputs.nth(i).boundingBox();
			expect(box!.height, `input ${i} is too short to tap reliably`).toBeGreaterThanOrEqual(36);
		}
	});
});
