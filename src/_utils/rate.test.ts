// Run: pnpm test          (or: node --test src/_utils/rate.test.ts)
import { test } from "node:test";
import assert from "node:assert/strict";
import { rateToPercent, percentToRate, formatRateAsPercent } from "./rate.ts";

test("rateToPercent converts a stored fraction to a human percentage", () => {
	assert.equal(rateToPercent(0.075), 7.5);
	assert.equal(rateToPercent(0.2), 20);
	assert.equal(rateToPercent(0), 0);
});

test("rateToPercent does not leak binary floating point noise", () => {
	// The naive 0.07 * 100 is 7.000000000000001, which would render in the
	// admin input as a long tail of digits.
	assert.equal(rateToPercent(0.07), 7);
	assert.equal(rateToPercent(0.0725), 7.25);
});

test("percentToRate converts a typed percentage back to a stored fraction", () => {
	assert.equal(percentToRate(7.5), 0.075);
	assert.equal(percentToRate(20), 0.2);
	assert.equal(percentToRate(0), 0);
});

test("the admin round trip is lossless for realistic rates", () => {
	// Loading the form then saving it unchanged must not drift the stored value,
	// or every save would nudge the tax charged on real orders.
	for (const stored of [0, 0.05, 0.07, 0.075, 0.0725, 0.1, 0.125, 0.2, 1]) {
		assert.equal(
			percentToRate(rateToPercent(stored)),
			stored,
			`round trip drifted for stored rate ${stored}`,
		);
	}
});

test("formatRateAsPercent keeps the half point instead of rounding up", () => {
	// The bug this guards: Math.round(0.075 * 100) is 8, so the customer was
	// shown "Tax (8%)" while being charged 7.5%.
	assert.equal(formatRateAsPercent(0.075), "7.5%");
	assert.equal(formatRateAsPercent(0.0725), "7.25%");
});

test("formatRateAsPercent drops the decimal on whole percentages", () => {
	assert.equal(formatRateAsPercent(0.2), "20%");
	assert.equal(formatRateAsPercent(0.07), "7%");
	assert.equal(formatRateAsPercent(0), "0%");
});

test("conversions coerce string input from the form", () => {
	// react-hook-form hands back strings; the callers wrap in Number(), but the
	// helpers must not silently produce NaN if one forgets.
	assert.equal(rateToPercent("0.075" as unknown as number), 7.5);
	assert.equal(percentToRate("7.5" as unknown as number), 0.075);
});
