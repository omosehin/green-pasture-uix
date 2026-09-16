// Run: pnpm test          (or: node --test src/_utils/format.test.ts)
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatCountdown } from "./format.ts";

test("formatCountdown pads the seconds so the clock never jitters in width", () => {
	assert.equal(formatCountdown(600), "10:00");
	assert.equal(formatCountdown(65), "1:05");
	assert.equal(formatCountdown(9), "0:09");
	assert.equal(formatCountdown(0), "0:00");
});

test("formatCountdown clamps a timer that overshot past zero", () => {
	assert.equal(formatCountdown(-3), "0:00");
});
