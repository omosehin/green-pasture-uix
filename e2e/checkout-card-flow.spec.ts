import { test, expect, Page } from "@playwright/test";

/**
 * Browser coverage for the animated card payment flow.
 *
 * The load-bearing assertion is the last one: card details must never leave
 * the browser. Everything else guards the interaction contract — the flip, the
 * live preview, validation gating, and the form → processing → success steps.
 */

const VALID = { card: "4111 1111 1111 1111", name: "Ada Obi", expiry: "12/30", cvv: "123" };

const field = (page: Page, placeholder: string) => page.getByPlaceholder(placeholder);

const fillValidCard = async (page: Page) => {
	await field(page, "0000 0000 0000 0000").fill(VALID.card);
	await field(page, "John Doe").fill(VALID.name);
	await field(page, "MM/YY").fill(VALID.expiry);
	await field(page, "123").fill(VALID.cvv);
	// Blur the CVV directly — clicking the card would hit the flipped back face.
	await field(page, "123").blur();
	await expect(page.getByTestId("card-inner")).toHaveAttribute("data-flipped", "false");
};

test.beforeEach(async ({ page }) => {
	await page.goto("/checkout-card");
	await expect(page.getByTestId("step-form")).toBeVisible();
});

test.describe("card preview", () => {
	test("shows placeholder dots before anything is typed", async ({ page }) => {
		await expect(page.getByTestId("card-number-display")).toHaveText("•••• •••• •••• ••••");
		await expect(page.getByTestId("card-holder-display")).toHaveText("YOUR NAME");
		await expect(page.getByTestId("card-expiry-display")).toHaveText("MM/YY");
	});

	test("mirrors the card number live, grouped in fours", async ({ page }) => {
		await field(page, "0000 0000 0000 0000").fill("4111111111111111");

		await expect(page.getByTestId("card-number-display")).toHaveText("4111 1111 1111 1111");
	});

	test("backfills remaining digits so the card does not reflow", async ({ page }) => {
		await field(page, "0000 0000 0000 0000").fill("411111");

		await expect(page.getByTestId("card-number-display")).toHaveText("4111 11•• •••• ••••");
	});

	test("mirrors holder name and expiry", async ({ page }) => {
		await field(page, "John Doe").fill("Ada Obi");
		await field(page, "MM/YY").fill("1230");

		await expect(page.getByTestId("card-holder-display")).toHaveText("Ada Obi");
		await expect(page.getByTestId("card-expiry-display")).toHaveText("12/30");
	});

	test("strips non-digits from the card number", async ({ page }) => {
		await field(page, "0000 0000 0000 0000").fill("4a1b1c1d");

		await expect(page.getByTestId("card-number-display")).toHaveText("4111 •••• •••• ••••");
	});
});

test.describe("card flip", () => {
	test("flips to the back when the CVV is focused and returns on blur", async ({ page }) => {
		const card = page.getByTestId("card-inner");
		await expect(card).toHaveAttribute("data-flipped", "false");

		await field(page, "123").focus();
		await expect(card).toHaveAttribute("data-flipped", "true");

		await field(page, "0000 0000 0000 0000").focus();
		await expect(card).toHaveAttribute("data-flipped", "false");
	});

	test("masks the CVV on the back face", async ({ page }) => {
		await field(page, "123").fill("456");

		await expect(page.getByTestId("cvv-display")).toHaveText("•••");
	});
});

test.describe("validation", () => {
	test("keeps the pay button disabled until every field is valid", async ({ page }) => {
		const pay = page.getByTestId("pay-button");
		await expect(pay).toBeDisabled();

		await field(page, "0000 0000 0000 0000").fill(VALID.card);
		await expect(pay).toBeDisabled();

		await field(page, "John Doe").fill(VALID.name);
		await field(page, "MM/YY").fill(VALID.expiry);
		await expect(pay).toBeDisabled();

		await field(page, "123").fill(VALID.cvv);
		await expect(pay).toBeEnabled();
	});

	test("rejects a card number that fails the Luhn check", async ({ page }) => {
		await field(page, "0000 0000 0000 0000").fill("4111 1111 1111 1112");
		await field(page, "John Doe").fill(VALID.name);
		await field(page, "MM/YY").fill(VALID.expiry);
		await field(page, "123").fill(VALID.cvv);

		await expect(page.getByTestId("pay-button")).toBeDisabled();
	});

	test("rejects an expiry in the past", async ({ page }) => {
		await field(page, "0000 0000 0000 0000").fill(VALID.card);
		await field(page, "John Doe").fill(VALID.name);
		await field(page, "MM/YY").fill("01/20");
		await field(page, "123").fill(VALID.cvv);

		await expect(page.getByTestId("pay-button")).toBeDisabled();
	});

	test("rejects month 13", async ({ page }) => {
		await field(page, "0000 0000 0000 0000").fill(VALID.card);
		await field(page, "John Doe").fill(VALID.name);
		await field(page, "MM/YY").fill("13/30");
		await field(page, "123").fill(VALID.cvv);

		await expect(page.getByTestId("pay-button")).toBeDisabled();
	});
});

test.describe("payment steps", () => {
	test("moves form → processing → success", async ({ page }) => {
		await fillValidCard(page);
		await page.getByTestId("pay-button").click();

		await expect(page.getByTestId("step-processing")).toBeVisible();
		await expect(page.getByText("Processing secure transaction…")).toBeVisible();

		await expect(page.getByTestId("step-success")).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText("Payment Successful")).toBeVisible();
		await expect(page.getByTestId("step-form")).toBeHidden();
	});

	test("announces processing to assistive tech", async ({ page }) => {
		await fillValidCard(page);
		await page.getByTestId("pay-button").click();

		await expect(page.getByRole("status")).toBeVisible();
	});

	test("counts the amount up to its final value on success", async ({ page }) => {
		await fillValidCard(page);
		await page.getByTestId("pay-button").click();
		await expect(page.getByTestId("step-success")).toBeVisible({ timeout: 10_000 });

		// GSAP tweens this from ₦0; it must settle on a real formatted figure.
		await expect(page.getByTestId("success-amount")).toHaveText(/^₦[\d,]+$/, { timeout: 5_000 });
	});
});

test.describe("security", () => {
	test("never transmits card details anywhere", async ({ page }) => {
		const bodies: string[] = [];
		page.on("request", (req) => {
			const body = req.postData();
			if (body) bodies.push(body);
		});

		await fillValidCard(page);
		await page.getByTestId("pay-button").click();
		await expect(page.getByTestId("step-success")).toBeVisible({ timeout: 10_000 });

		const pan = "4111111111111111";
		for (const body of bodies) {
			expect(body.replace(/\s|-/g, "")).not.toContain(pan);
			expect(body).not.toContain(VALID.cvv);
		}
	});

	test("clears the card fields once payment starts", async ({ page }) => {
		await fillValidCard(page);
		await page.getByTestId("pay-button").click();
		await expect(page.getByTestId("step-success")).toBeVisible({ timeout: 10_000 });

		// Returning to the form must not reveal a retained PAN.
		await page.reload();
		await expect(page.getByTestId("card-number-display")).toHaveText("•••• •••• •••• ••••");
	});
});

test.describe("reduced motion", () => {
	test("still completes the flow without animation", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.reload();

		await fillValidCard(page);
		await page.getByTestId("pay-button").click();

		await expect(page.getByTestId("step-success")).toBeVisible({ timeout: 10_000 });
		await expect(page.getByTestId("success-amount")).toHaveText(/^₦[\d,]+$/);
	});
});
