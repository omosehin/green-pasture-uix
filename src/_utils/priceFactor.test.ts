// Run: pnpm test          (or: node --test src/_utils/priceFactor.test.ts)
import { test } from "node:test";
import assert from "node:assert/strict";
import { isPlausiblePriceFactor } from "./priceFactor.ts";

test("isPlausiblePriceFactor accepts real NGN -> foreign-currency rates", () => {
	assert.equal(isPlausiblePriceFactor(0.00062), true); // USD
	assert.equal(isPlausiblePriceFactor(0.000496), true); // GBP
	assert.equal(isPlausiblePriceFactor(0.000843), true); // CAD
});

test("isPlausiblePriceFactor rejects the bug this guard exists for", () => {
	// The seeded US priceFactor was 1.54 — a base-price multiplier mistakenly
	// stored where an NGN -> USD rate belongs. That would have shown a
	// customer $15,400 for a NGN 10,000 item instead of ~$6.
	assert.equal(isPlausiblePriceFactor(1.54), false);
});

test("isPlausiblePriceFactor rejects zero, negative, non-finite and >= 1", () => {
	assert.equal(isPlausiblePriceFactor(0), false);
	assert.equal(isPlausiblePriceFactor(-0.0006), false);
	assert.equal(isPlausiblePriceFactor(1), false);
	assert.equal(isPlausiblePriceFactor(NaN), false);
	assert.equal(isPlausiblePriceFactor(Infinity), false);
});
