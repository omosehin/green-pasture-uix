// Pure pagination-display helpers for _components/DataTable.tsx, pulled out so the
// S/N and footer-total math can be pinned with a plain node:test instead of a
// component test.
//
// Root cause of the old S/N-0 / "Showing 0-0 of 0" bug (src/_UI/DataTable.tsx:278-280):
// the row number and footer total were both derived from `pagination.totalItems`
// (`totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1`). Any response — or
// any stale/pending state — where totalItems reads 0 while rows are still on
// screen collapsed straight to a literal "0". The fix removes totalItems from the
// S/N formula entirely and clamps the footer total instead of trusting it blindly.

/** First S/N shown on the current page, derived purely from the page offset. */
export function firstSerialNumber(pageIndex: number, pageSize: number): number {
	return pageIndex * pageSize + 1;
}

/** Footer row-count, clamped so it can never read lower than what's actually on screen. */
export function displayTotal(totalItems: number | undefined, rowCount: number): number {
	return Math.max(totalItems ?? rowCount, rowCount);
}
