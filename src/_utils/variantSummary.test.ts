// Run: pnpm test          (or: node --test src/_utils/variantSummary.test.ts)
import { test } from "node:test";
import assert from "node:assert/strict";
import { variantSummary } from "./variantSummary.ts";

test("a lone item (no variants) reports its own pack size and no price range", () => {
	const summary = variantSummary({ weightValue: 250, weightUnit: "g", price: 5000 });
	assert.equal(summary.packSize, "250g");
	assert.equal(summary.priceVaries, false);
	assert.equal(summary.lowestPrice, 0);
	assert.deepEqual(summary.variants, []);
});

test("a group of two different prices sets priceVaries and the cheapest price", () => {
	const summary = variantSummary({
		variants: [
			{ weightValue: 100, weightUnit: "g", price: 8000 },
			{ weightValue: 250, weightUnit: "g", price: 15000 },
		],
	});
	assert.equal(summary.packSize, "100g · 250g");
	assert.equal(summary.priceVaries, true);
	assert.equal(summary.lowestPrice, 8000);
});

test("a group whose sizes all cost the same leaves priceVaries false", () => {
	const summary = variantSummary({
		variants: [
			{ weightValue: 100, weightUnit: "g", price: 8000 },
			{ weightValue: 250, weightUnit: "g", price: 8000 },
		],
	});
	assert.equal(summary.priceVaries, false);
	assert.equal(summary.lowestPrice, 8000);
});

test("four sized variants render three then an overflow count", () => {
	const summary = variantSummary({
		variants: [
			{ weightValue: 100, weightUnit: "g", price: 1000 },
			{ weightValue: 200, weightUnit: "g", price: 2000 },
			{ weightValue: 300, weightUnit: "g", price: 3000 },
			{ weightValue: 400, weightUnit: "g", price: 4000 },
		],
	});
	assert.equal(summary.packSize, "100g · 200g · 300g +1");
});

test("a variant with no weightValue is dropped from the label list and does not inflate the overflow count", () => {
	const summary = variantSummary({
		variants: [
			{ weightValue: undefined, weightUnit: "g", price: 500 },
			{ weightValue: 200, weightUnit: "g", price: 2000 },
			{ weightValue: 300, weightUnit: "g", price: 3000 },
			{ weightValue: 400, weightUnit: "g", price: 4000 },
		],
	});
	// Only 3 real labels exist, so all 3 show with no "+N" overflow, even
	// though the raw variants array has 4 entries.
	assert.equal(summary.packSize, "200g · 300g · 400g");
});

test("a group of exactly one takes the lone-item path", () => {
	const summary = variantSummary({
		variants: [{ weightValue: 250, weightUnit: "g", price: 5000 }],
		weightValue: 250,
		weightUnit: "g",
	});
	assert.equal(summary.packSize, "250g");
	assert.equal(summary.priceVaries, false);
	assert.equal(summary.lowestPrice, 0);
	assert.deepEqual(summary.variants, []);
});
