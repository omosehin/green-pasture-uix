// Run: pnpm test          (or: node --test src/_utils/mergePages.test.ts)
import { test } from "node:test";
import assert from "node:assert/strict";
import { mergePages } from "./mergePages.ts";

const page1 = [{ id: "a" }, { id: "b" }];
const page2 = [{ id: "c" }, { id: "d" }];

test("page 1 replaces, so a refetch doesn't double the list", () => {
	assert.deepEqual(mergePages(page1, page1, 1), page1);
});

test("later pages append onto what's already loaded", () => {
	assert.deepEqual(mergePages(page1, page2, 2), [...page1, ...page2]);
});

test("a page delivered twice is de-duplicated by id", () => {
	const once = mergePages(page1, page2, 2);
	assert.deepEqual(mergePages(once, page2, 2), once);
});
