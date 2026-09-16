// Run: pnpm test          (or: node --test src/_components/charts/chart-colors.test.ts)
import { test } from "node:test";
import assert from "node:assert/strict";
import { CATEGORICAL, OTHER_GREY, categoricalColor, statusColor } from "./chart-colors.ts";

test("categoricalColor: returns the fixed-order hue for in-range indexes", () => {
  assert.equal(categoricalColor(0), CATEGORICAL[0]);
  assert.equal(categoricalColor(CATEGORICAL.length - 1), CATEGORICAL[CATEGORICAL.length - 1]);
});

test("categoricalColor: folds anything past the palette length into Other grey", () => {
  assert.equal(categoricalColor(CATEGORICAL.length), OTHER_GREY);
  assert.equal(categoricalColor(CATEGORICAL.length + 5), OTHER_GREY);
});

test("statusColor: known order statuses map to their semantic colour, case-insensitively", () => {
  assert.equal(statusColor("COMPLETED", 0), "#0e9f6e");
  assert.equal(statusColor("cancelled", 0), "#dc2626");
});

test("statusColor: unknown status falls back to the stable-by-index categorical colour", () => {
  assert.equal(statusColor("SOME_UNKNOWN_STATUS", 1), categoricalColor(1));
});
