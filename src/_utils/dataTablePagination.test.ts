// Run: pnpm test          (or: node --test src/_utils/dataTablePagination.test.ts)
import { test } from "node:test";
import assert from "node:assert/strict";
import { displayTotal, firstSerialNumber } from "./dataTablePagination.ts";

test("S/N: page 1 (index 0) always starts at 1, independent of any totalItems value", () => {
	assert.equal(firstSerialNumber(0, 10), 1);
});

test("S/N: page 2 (index 1) with pageSize 10 starts at 11", () => {
	assert.equal(firstSerialNumber(1, 10), 11);
});

test("displayTotal: totalItems 0 with one row on screen clamps to 1, never '0 of 0'", () => {
	assert.equal(displayTotal(0, 1), 1);
});

test("displayTotal: a real total larger than the current page is left untouched", () => {
	assert.equal(displayTotal(47, 10), 47);
});

test("root-cause regression: one row with totalItems 0 gets S/N 1 and a non-zero footer total", () => {
	// Mirrors the exact scenario from the bug report: a single row rendered
	// while the API's pagination meta reads totalItems: 0.
	const pagination = { currentPage: 1, itemsPerPage: 10, totalItems: 0 };
	const rowCount = 1;
	const pageIndex = pagination.currentPage - 1;

	assert.equal(firstSerialNumber(pageIndex, pagination.itemsPerPage), 1);
	assert.equal(displayTotal(pagination.totalItems, rowCount), 1);
});

// Sanity: proves this isn't a tautology. The old formula
// (src/_UI/DataTable.tsx:280) really did produce S/N 0 for this exact input —
// this test fails if you swap firstSerialNumber for the old inline logic.
test("sanity: the old totalItems-driven formula really did produce S/N 0 for this input", () => {
	const page = 1;
	const itemsPerPage = 10;
	const totalItems = 0;
	const oldStartItem = totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1;
	assert.equal(oldStartItem, 0);
	assert.notEqual(oldStartItem, firstSerialNumber(page - 1, itemsPerPage));
});
