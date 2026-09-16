import { test, expect } from "@playwright/test";
import {
	PHONE,
	TABLET,
	offendingElements,
	overflowsHorizontally,
	scrollsHorizontally,
	signInAsAdmin,
} from "./_helpers";

/**
 * Mobile responsiveness for the admin area.
 *
 * The public routes are covered by mobile-responsive.spec.ts, but everything
 * behind the admin gate was previously unverified at phone width — which is
 * where the risk actually is, since admin screens are data-dense: wide tables,
 * multi-column forms, and charts.
 *
 * These run without a backend. The API calls fail and the pages fall back to
 * empty/error states, which is fine for layout: the shell, sidebar, header and
 * page chrome all render. `admin shell actually rendered` guards against the
 * failure mode where a redirect or a permanent spinner makes an overflow
 * assertion pass vacuously.
 */

const ADMIN_ROUTES = [
	"/admin/dashboard",
	"/admin/products",
	"/admin/orders",
	"/admin/customers",
	"/admin/categories",
	"/admin/staff",
	"/admin/roles",
	"/admin/users",
	"/admin/settings",
	"/admin/products/new",
];

test.beforeEach(async ({ context, baseURL }) => {
	await signInAsAdmin(context, baseURL!);
});

test.describe("admin shell", () => {
	test("the gate lets a seeded admin session through", async ({ page }) => {
		await page.setViewportSize(PHONE);
		await page.goto("/admin/dashboard");

		// Neither bounced to login nor stuck behind the client-side guard.
		await expect(page).toHaveURL(/\/admin\/dashboard/);
		await expect(page.getByText(/verifying access/i)).toHaveCount(0);
	});

	test("the sidebar does not strand content off-screen on a phone", async ({ page }) => {
		await page.setViewportSize(PHONE);
		await page.goto("/admin/dashboard");
		await page.waitForLoadState("networkidle");

		// The sidebar is fixed + collapsed under lg; the main region must still
		// occupy the viewport rather than being pushed sideways by it.
		const main = page.locator("main").first();
		const box = await main.boundingBox();
		expect(box!.x).toBeLessThanOrEqual(1);
		expect(box!.width).toBeLessThanOrEqual(PHONE.width + 1);
	});

	test("picking a tab dismisses the sidebar instead of covering the page", async ({ page }) => {
		await page.setViewportSize(PHONE);
		await page.goto("/admin/dashboard");

		// Category, not a privileged entry: the seeded session carries no roles,
		// so anything with a `privilege` is filtered out of the nav.
		await page.getByTestId("sidebar-trigger").click();
		const nav = page.getByTestId("nav-category");
		await expect(nav).toBeVisible();

		await nav.click();

		await expect(page).toHaveURL(/\/admin\/categories/);
		await expect(nav).toBeHidden();
	});
});

for (const route of ADMIN_ROUTES) {
	test(`${route} does not scroll sideways on a phone`, async ({ page }) => {
		await page.setViewportSize(PHONE);
		await page.goto(route);
		await page.waitForLoadState("networkidle");

		// Guards against a vacuous pass: if the guard bounced us or left a
		// spinner, there is no admin chrome and the overflow check proves nothing.
		// Assert the URL too: withAdminAuth redirects an unauthorised session to
		// "/", which also renders a <main> — so "main is visible" alone would let
		// these measure the public home page and pass without testing admin.
		await expect(page).toHaveURL(new RegExp(route.replace(/\//g, "\\/")));
		await expect(page.getByText(/verifying access/i)).toHaveCount(0);
		await expect(page.locator("main")).toBeVisible();

		const culprits = await offendingElements(page);
		expect(culprits, `elements wider than the viewport on ${route}`).toEqual([]);
		expect(await overflowsHorizontally(page)).toBe(false);
		// <main> is the real scroll container in the admin shell, so this is the
		// assertion that actually catches an oversized child here.
		expect(await scrollsHorizontally(page, "main"), `main scrolls sideways on ${route}`).toBe(false);
	});
}

for (const route of ADMIN_ROUTES) {
	test(`${route} does not scroll sideways on a tablet`, async ({ page }) => {
		await page.setViewportSize(TABLET);
		await page.goto(route);
		await page.waitForLoadState("networkidle");

		const culprits = await offendingElements(page);
		expect(culprits, `elements wider than the viewport on ${route}`).toEqual([]);
		expect(await overflowsHorizontally(page)).toBe(false);
		expect(await scrollsHorizontally(page, "main")).toBe(false);
	});
}

test.describe("admin data tables on a phone", () => {
	test("wide tables scroll inside their own container, not the page", async ({ page }) => {
		await page.setViewportSize(PHONE);
		await page.goto("/admin/orders");
		await page.waitForLoadState("networkidle");

		// The page must not scroll sideways even though the table is wider than
		// a phone — that is what the overflow-x-auto wrapper is for.
		expect(await overflowsHorizontally(page)).toBe(false);

		const table = page.locator("table").first();
		if (await table.count()) {
			const scroller = page.locator(".overflow-x-auto").first();
			await expect(scroller).toBeAttached();
		}
	});
});
