// Run: pnpm test          (or: node --test src/_utils/groupVariants.test.ts)
import { test } from "node:test";
import assert from "node:assert/strict";
import { groupVariants, variantGroupKey } from "./groupVariants.ts";

const item = (over: Record<string, any>) => ({
	id: "x",
	variantGroupId: null,
	weightValue: null,
	unit: 5,
	published: true,
	...over,
});

test("an ungrouped item is its own group of one", () => {
	const groups = groupVariants([item({ id: "a" })]);

	assert.equal(groups.length, 1);
	assert.equal(groups[0].id, "a");
	assert.equal(groups[0].variants.length, 1);
});

test("siblings collapse into one entry carrying all of them", () => {
	const groups = groupVariants([
		item({ id: "a", variantGroupId: "g", weightValue: 250 }),
		item({ id: "b", variantGroupId: "g", weightValue: 100 }),
	]);

	assert.equal(groups.length, 1);
	assert.equal(groups[0].variants.length, 2);
});

test("the smallest in-stock size represents the group, so the card leads with the cheapest entry point", () => {
	const groups = groupVariants([
		item({ id: "a", variantGroupId: "g", weightValue: 250 }),
		item({ id: "b", variantGroupId: "g", weightValue: 100 }),
	]);

	assert.equal(groups[0].id, "b");
});

test("a sold-out smallest size does not represent the group", () => {
	const groups = groupVariants([
		item({ id: "a", variantGroupId: "g", weightValue: 250 }),
		item({ id: "b", variantGroupId: "g", weightValue: 100, unit: 0 }),
	]);

	assert.equal(groups[0].id, "a");
});

test("an unpublished smallest size does not represent the group", () => {
	const groups = groupVariants([
		item({ id: "a", variantGroupId: "g", weightValue: 250 }),
		item({ id: "b", variantGroupId: "g", weightValue: 100, published: false }),
	]);

	assert.equal(groups[0].id, "a");
	// It is still a member — the chip list shows every size the group has.
	assert.equal(groups[0].variants.length, 2);
});

test("an all-sold-out group still renders, using its first member", () => {
	const groups = groupVariants([
		item({ id: "a", variantGroupId: "g", weightValue: 250, unit: 0 }),
		item({ id: "b", variantGroupId: "g", weightValue: 100, unit: 0 }),
	]);

	assert.equal(groups.length, 1);
	assert.equal(groups[0].id, "a");
});

test("the merchant-set default represents the group even when it is not the cheapest", () => {
	const groups = groupVariants([
		item({ id: "a", variantGroupId: "g", weightValue: 100 }),
		item({ id: "b", variantGroupId: "g", weightValue: 250, isDefault: true }),
	]);

	assert.equal(groups[0].id, "b");
});

test("a default that is sold out still falls back to the automatic pick", () => {
	const groups = groupVariants([
		item({ id: "a", variantGroupId: "g", weightValue: 100 }),
		item({ id: "b", variantGroupId: "g", weightValue: 250, isDefault: true, unit: 0 }),
	]);

	assert.equal(groups[0].id, "a");
});

test("with no default set, the automatic cheapest-in-stock pick is unchanged", () => {
	const groups = groupVariants([
		item({ id: "a", variantGroupId: "g", weightValue: 250 }),
		item({ id: "b", variantGroupId: "g", weightValue: 100 }),
	]);

	assert.equal(groups[0].id, "b");
});

test("group order follows first appearance, so the grid does not reshuffle between loads", () => {
	const groups = groupVariants([
		item({ id: "a", variantGroupId: "g1" }),
		item({ id: "b", variantGroupId: "g2" }),
		item({ id: "c", variantGroupId: "g1" }),
	]);

	assert.deepEqual(groups.map((g) => g.variantGroupId), ["g1", "g2"]);
});

test("variants within a group are ordered by size ascending, which is the chip order", () => {
	const groups = groupVariants([
		item({ id: "a", variantGroupId: "g", weightValue: 250 }),
		item({ id: "b", variantGroupId: "g", weightValue: 100 }),
		item({ id: "c", variantGroupId: "g", weightValue: 500 }),
	]);

	assert.deepEqual(groups[0].variants.map((v) => v.id), ["b", "a", "c"]);
});

test("undefined input yields an empty list rather than throwing on first render", () => {
	assert.deepEqual(groupVariants(undefined), []);
});

test("the group key falls back to the item id", () => {
	assert.equal(variantGroupKey({ id: "a", variantGroupId: null }), "a");
	assert.equal(variantGroupKey({ id: "a", variantGroupId: "g" }), "g");
});
