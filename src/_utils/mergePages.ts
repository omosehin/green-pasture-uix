/**
 * Page 1 replaces the list (a refetch must not duplicate); later pages append.
 * De-duplicated by id because autoplay can request the same next page twice
 * before the first response lands.
 */
export function mergePages<T extends { id: string }>(existing: T[], incoming: T[], currentPage: number): T[] {
	const merged = currentPage > 1 ? [...existing, ...incoming] : incoming;
	return merged.filter((r, i, all) => all.findIndex((x) => x.id === r.id) === i);
}
