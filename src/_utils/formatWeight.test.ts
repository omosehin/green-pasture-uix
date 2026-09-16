// Run: pnpm test          (or: node --test src/_utils/formatWeight.test.ts)
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatWeight } from "./formatWeight.ts";

test("mass and volume units sit tight against the number, as labels print them", () => {
	assert.equal(formatWeight(2500, "g"), "2500g");
	assert.equal(formatWeight(250, "ml"), "250ml");
	assert.equal(formatWeight(1, "kg"), "1kg");
});

test("counted units read as words and keep the space", () => {
	assert.equal(formatWeight(50, "tabs"), "50 tabs");
	assert.equal(formatWeight(1, "paint"), "1 paint");
});

test("trailing zeros from the decimal column are dropped", () => {
	assert.equal(formatWeight("250.00", "g"), "250g");
	assert.equal(formatWeight(1.5, "kg"), "1.5kg");
});

test("unit casing does not change the spacing rule", () => {
	assert.equal(formatWeight(500, "G"), "500G");
});

test("a missing or unusable value yields empty, so callers can skip the element", () => {
	assert.equal(formatWeight(null, "g"), "");
	assert.equal(formatWeight(undefined, "g"), "");
	assert.equal(formatWeight("", "g"), "");
	assert.equal(formatWeight(0, "g"), "");
	assert.equal(formatWeight(-5, "g"), "");
	assert.equal(formatWeight("abc", "g"), "");
});

test("a value with no unit still renders the amount", () => {
	assert.equal(formatWeight(12, null), "12");
	assert.equal(formatWeight(12, "  "), "12");
});
