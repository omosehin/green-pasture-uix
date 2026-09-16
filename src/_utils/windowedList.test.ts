// Run: pnpm test          (or: node --test src/_utils/windowedList.test.ts)
import { test } from "node:test";
import assert from "node:assert/strict";
import { visibleCount, hasMore } from "./windowedList.ts";

test("visibleCount: one page loaded shows pageSize items when total exceeds it", () => {
	assert.equal(visibleCount(30, 25, 1), 25);
});

test("visibleCount: second page loaded clamps to total instead of overshooting", () => {
	assert.equal(visibleCount(30, 25, 2), 30);
});

test("visibleCount: total smaller than pageSize shows everything on page 1", () => {
	assert.equal(visibleCount(10, 25, 1), 10);
});

test("hasMore: true while visible count is below total", () => {
	assert.equal(hasMore(30, 25, 1), true);
});

test("hasMore: false once every item is visible, guarding against loading past the end", () => {
	assert.equal(hasMore(30, 25, 2), false);
	assert.equal(hasMore(10, 25, 1), false);
});
