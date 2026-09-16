// Run: pnpm test          (or: node --test src/_utils/siblingAnchorId.test.ts)
import { test } from "node:test";
import assert from "node:assert/strict";
import { siblingAnchorId } from "./siblingAnchorId.ts";

const GROUP = "99999999-9999-9999-9999-999999999999";

test("an ungrouped item has no anchor to send", () => {
	assert.equal(siblingAnchorId({ id: "a", variantGroupId: null }, [{ id: "b", variantGroupId: GROUP }]), "");
});

test("a bulk-created group resolves to a sibling ITEM id, never the group id", () => {
	const item = { id: "a", variantGroupId: GROUP };
	const candidates = [item, { id: "b", variantGroupId: GROUP }];

	const anchor = siblingAnchorId(item, candidates);

	assert.equal(anchor, "b");
	assert.notEqual(anchor, GROUP);
});

test("the item itself is excluded, so a group of one resolves to nothing", () => {
	const item = { id: "a", variantGroupId: GROUP };

	assert.equal(siblingAnchorId(item, [item]), "");
});

test("an empty candidate list resolves to nothing — callers must not read this as detach", () => {
	assert.equal(siblingAnchorId({ id: "a", variantGroupId: GROUP }, []), "");
});

test("a picker-created group whose id IS the anchor's id still resolves to a real item", () => {
	// The anchor owns the group id here, so the group id happens to be a valid
	// item id — but it is the OTHER member that must be sent when editing it.
	const anchor = { id: "anchor", variantGroupId: "anchor" };
	const joiner = { id: "joiner", variantGroupId: "anchor" };

	assert.equal(siblingAnchorId(joiner, [anchor, joiner]), "anchor");
	assert.equal(siblingAnchorId(anchor, [anchor, joiner]), "joiner");
});
