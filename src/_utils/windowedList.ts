// Pure helper for windowing an in-memory array across "pages" as the user
// scrolls, used by src/pages/admin/role/[id].tsx to render the Assigned
// Privileges list without stretching the page unbounded.

/** Number of items visible after `pagesLoaded` pages, clamped to `total`. */
export function visibleCount(total: number, pageSize: number, pagesLoaded: number): number {
	return Math.min(total, pageSize * pagesLoaded);
}

/** Whether there are more items to load beyond what's currently visible. */
export function hasMore(total: number, pageSize: number, pagesLoaded: number): boolean {
	return visibleCount(total, pageSize, pagesLoaded) < total;
}
