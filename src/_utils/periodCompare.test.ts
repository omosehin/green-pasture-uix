// Run: pnpm test          (or: node --test src/_utils/periodCompare.test.ts)
import { test } from "node:test";
import assert from "node:assert/strict";
import { comparePeriods, bucketByMonth, lastDays, shareOfTotal } from "./periodCompare.ts";

const day = (d: number, value: number) => ({ date: `2026-08-${String(d).padStart(2, "0")}`, value });

test("comparePeriods splits the tail into current and prior windows", () => {
	// prior = days 1-3 (sum 30), current = days 4-6 (sum 60)
	const series = [day(1, 10), day(2, 10), day(3, 10), day(4, 20), day(5, 20), day(6, 20)];
	const c = comparePeriods(series, 3);
	assert.equal(c.current, 60);
	assert.equal(c.prior, 30);
	assert.equal(c.deltaPercent, 100);
	assert.equal(c.hasPrior, true);
});

test("comparePeriods sorts before slicing, so API order doesn't matter", () => {
	const shuffled = [day(5, 20), day(1, 10), day(4, 20), day(2, 10), day(6, 20), day(3, 10)];
	assert.deepEqual(comparePeriods(shuffled, 3), comparePeriods([day(1, 10), day(2, 10), day(3, 10), day(4, 20), day(5, 20), day(6, 20)], 3));
});

test("comparePeriods reports a negative delta on a decline", () => {
	const c = comparePeriods([day(1, 100), day(2, 25)], 1);
	assert.equal(c.deltaPercent, -75);
});

test("comparePeriods gives no delta when there is no prior window", () => {
	const c = comparePeriods([day(1, 10), day(2, 10)], 5);
	assert.equal(c.hasPrior, false);
	assert.equal(c.deltaPercent, null);
	assert.equal(c.current, 20);
});

test("comparePeriods gives no delta when the prior window is zero", () => {
	// 0 -> 50 is not "+100%" and is not infinity; callers must show nothing.
	const c = comparePeriods([day(1, 0), day(2, 50)], 1);
	assert.equal(c.hasPrior, true);
	assert.equal(c.prior, 0);
	assert.equal(c.deltaPercent, null);
});

test("bucketByMonth rolls daily points into calendar months", () => {
	const series = [
		{ date: "2026-07-30", value: 5 },
		{ date: "2026-08-01", value: 10 },
		{ date: "2026-08-15", value: 15 },
	];
	assert.deepEqual(bucketByMonth(series), [
		{ date: "2026-07", value: 5 },
		{ date: "2026-08", value: 25 },
	]);
});

test("lastDays keeps the most recent points, chronologically", () => {
	assert.deepEqual(lastDays([day(1, 1), day(2, 2), day(3, 3)], 2), [day(2, 2), day(3, 3)]);
});

test("shareOfTotal converts a column into percentages", () => {
	assert.deepEqual(shareOfTotal([25, 75]), [25, 75]);
});

test("shareOfTotal returns zeros rather than NaN when everything is zero", () => {
	assert.deepEqual(shareOfTotal([0, 0]), [0, 0]);
});
