import { test, expect } from "@playwright/test";

/**
 * Renders the landing-page catalogue rail against mocked API responses so the
 * section can be looked at without a backend, and screenshots both themes.
 *
 * Kept as a spec rather than a throwaway script because the assertions are
 * worth having: the rail must render one row, and the filter chips must
 * actually narrow it.
 */

const IMAGES = [
	"/images/BrainSuper.png",
	"/images/GUTBrainSuperfood.png",
	"/images/Green_vegggies_1.jpeg",
	"/images/Green_vegetables_2.avif",
];

const CATEGORIES = ["Flour", "Beverages", "Supplements"];

const TAGS = [
	{ id: "t1", name: "Children", slug: "children", description: "Safe for children" },
	{ id: "t2", name: "Adults", slug: "adults", description: "Suitable for adults" },
	{ id: "t3", name: "Autism Support", slug: "autism-support", description: "Commonly used to support autistic children" },
];

const NAMES = [
	"Sweet Potato & Tigernut Flour",
	"Cocoa Date Mix",
	"Tigernut Powder",
	"Granola Healthy Snack",
	"Brain Super Food",
	"Gut Brain Superfood",
	"Moringa Leaf Powder",
	"Baobab Fruit Powder",
];

const items = NAMES.map((name, i) => ({
	id: `item-${i}`,
	name,
	description: "<p>Steady energy and a happy gut with every bite.</p>",
	price: 5000 + i * 2500,
	originalPrice: i % 3 === 0 ? 9000 + i * 2500 : null,
	onSale: i % 3 === 0,
	discountPercent: i % 3 === 0 ? 20 : null,
	unit: i === 5 ? 0 : 20,
	published: true,
	status: "A",
	weightValue: 250,
	weightUnit: "g",
	product: { id: `c${i % 3}`, name: CATEGORIES[i % 3] },
	tags: [TAGS[i % 3]],
	photos: [{ id: `p${i}`, url: IMAGES[i % IMAGES.length], publicId: "x", isThumbnail: true }],
	ratingStats: { average: i % 2 === 0 ? 4.5 : 0, count: i % 2 === 0 ? 12 : 0 },
}));

test.describe("landing catalogue rail", () => {
	test.beforeEach(async ({ page }) => {
		await page.route("**/api/v1/items**", (route) =>
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ message: "ok", data: { items, meta: { totalItems: items.length } } }),
			}),
		);
		await page.route("**/api/v1/tags**", (route) =>
			route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ message: "ok", data: TAGS }) }),
		);
		await page.route("**/api/v1/store/settings**", (route) =>
			route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ message: "ok", data: {} }) }),
		);
	});

	test("renders a single row, and the chips narrow it", async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 1000 });
		await page.goto("/");

		const rail = page.getByRole("region", { name: "Products" });
		await expect(rail).toBeVisible();

		const cards = rail.locator("> div");
		await expect(cards).toHaveCount(items.length);

		// One row: every card shares a top edge.
		const tops = await cards.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
		expect(new Set(tops).size).toBe(1);

		await page.getByRole("button", { name: "Flour", exact: true }).click();
		await expect(cards).toHaveCount(items.filter((i) => i.product.name === "Flour").length);

		await page.getByRole("button", { name: "All", exact: true }).click();
		await rail.scrollIntoViewIfNeeded();
		await page.waitForTimeout(900);
		await page.locator("section").filter({ has: rail }).screenshot({ path: "test-results/shelf-light.png" });
	});

	test("category and tag filters combine", async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 1000 });
		await page.goto("/");

		const rail = page.getByRole("region", { name: "Products" });
		await expect(rail).toBeVisible();
		// Wait for the fetched set to land before filtering it — clicking a chip
		// mid-hydration filters an empty list and the assertion races.
		await expect(rail.locator("> div")).toHaveCount(items.length);

		await page.getByRole("button", { name: "Beverages", exact: true }).click();
		await page.getByRole("button", { name: "Adults", exact: true }).click();

		const expected = items.filter((i) => i.product.name === "Beverages" && i.tags.some((t) => t.slug === "adults"));
		await expect(rail.locator("> div")).toHaveCount(expected.length);
	});

	test("dark theme screenshot", async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 1000 });
		// The inline theme script in _document reads this key and owns the class,
		// so setting the class directly is overwritten on load.
		await page.addInitScript(() => window.localStorage.setItem("gp-theme", "dark"));
		await page.goto("/");
		const rail = page.getByRole("region", { name: "Products" });
		await expect(rail).toBeVisible();
		await rail.scrollIntoViewIfNeeded();
		await page.waitForTimeout(900);
		await page.locator("section").filter({ has: rail }).screenshot({ path: "test-results/shelf-dark.png" });
	});
});
