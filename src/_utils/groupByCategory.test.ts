// Run: pnpm test          (or: node --test src/_utils/groupByCategory.test.ts)
import { test } from "node:test";
import assert from "node:assert/strict";
import { groupByCategory } from "./groupByCategory.ts";

const item = (id: string, category?: string) => ({ id, product: category ? { name: category } : undefined });

test("items land on the shelf named by their parent product", () => {
	const shelves = groupByCategory([item("a", "Beverages"), item("b", "Powders"), item("c", "Beverages")]);
	assert.deepEqual(
		shelves.map(([name, items]) => [name, items.map((i) => i.id)]),
		[
			["Beverages", ["a", "c"]],
			["Powders", ["b"]],
		]
	);
});

test("shelves keep API order — first appearance wins, not alphabetical", () => {
	const shelves = groupByCategory([item("a", "Zest"), item("b", "Apple")]);
	assert.deepEqual(shelves.map(([name]) => name), ["Zest", "Apple"]);
});

test("an item with no parent product still gets a shelf instead of vanishing", () => {
	const shelves = groupByCategory([item("a")]);
	assert.deepEqual(shelves, [["Other", [item("a")]]]);
});

test("no products means no shelves, and undefined does not throw", () => {
	assert.deepEqual(groupByCategory([]), []);
	assert.deepEqual(groupByCategory(undefined), []);
});
