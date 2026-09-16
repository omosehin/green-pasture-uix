// Run: pnpm test          (or: node --test src/_utils/staffForm.test.ts)
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveRoleIdsForPatch } from "./staffForm.ts";

test("roles untouched: roleIds is omitted from the patch body", () => {
	// Admin only edited the phone number — the roles field was never
	// touched, so it must stay out of the PATCH body entirely, or the
	// backend's full-replace branch fires needlessly.
	assert.equal(resolveRoleIdsForPatch(["role-1"], ["role-1"]), undefined);
});

test("roles untouched, multi-role: order does not count as a change", () => {
	assert.equal(resolveRoleIdsForPatch(["role-2", "role-1"], ["role-1", "role-2"]), undefined);
});

test("role added: roleIds is included in the patch body", () => {
	const result = resolveRoleIdsForPatch(["role-1", "role-2"], ["role-1"]);
	assert.deepEqual(result, ["role-1", "role-2"]);
});

test("role removed: roleIds is included in the patch body", () => {
	const result = resolveRoleIdsForPatch(["role-1"], ["role-1", "role-2"]);
	assert.deepEqual(result, ["role-1"]);
});

test("role swapped for a different one of the same count: still a change", () => {
	const result = resolveRoleIdsForPatch(["role-3"], ["role-1"]);
	assert.deepEqual(result, ["role-3"]);
});

test("roles cleared to empty: still reported as a change (UI must block submitting this)", () => {
	const result = resolveRoleIdsForPatch([], ["role-1"]);
	assert.deepEqual(result, []);
});
