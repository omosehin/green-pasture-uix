/**
 * Period-over-period comparison for the admin dashboards.
 *
 * The analytics endpoint returns flat daily series (revenueTrend,
 * orderVolumeTrend) and a monthly one (customerGrowth). It has no notion of a
 * "previous period", so the comparison is derived here: split a series into the
 * last N points and the N before them.
 *
 * Deliberately React- and redux-free so it runs under `node --test`.
 */

export interface Point {
	/** ISO date or YYYY-MM. Only used for ordering. */
	date: string;
	value: number;
}

export interface Comparison {
	current: number;
	prior: number;
	/** Percent change, or null when there's no prior baseline to divide by. */
	deltaPercent: number | null;
	/** False when the series is too short for a prior window — callers hide the delta. */
	hasPrior: boolean;
}

/** Chronological sort, so callers can hand us the API's order without trusting it. */
function sorted(series: Point[]): Point[] {
	return [...series].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function sum(points: Point[]): number {
	return points.reduce((total, p) => total + (Number(p.value) || 0), 0);
}

/**
 * Compare the last `window` points against the `window` points before them.
 *
 * A prior window that is entirely absent (short series) yields hasPrior: false.
 * A prior window that exists but sums to zero yields deltaPercent: null — going
 * from nothing to something has no meaningful percentage, and rendering "+∞%"
 * or a fake "+100%" would misrepresent it.
 */
export function comparePeriods(series: Point[], window: number): Comparison {
	const points = sorted(series);
	const currentPoints = points.slice(-window);
	const priorPoints = points.slice(-window * 2, -window);

	const current = sum(currentPoints);
	const prior = sum(priorPoints);
	const hasPrior = priorPoints.length > 0;

	return {
		current,
		prior,
		hasPrior,
		deltaPercent: hasPrior && prior > 0 ? ((current - prior) / prior) * 100 : null,
	};
}

/** Rolls a daily series up to calendar months, for the 12-month view. */
export function bucketByMonth(series: Point[]): Point[] {
	const months = new Map<string, number>();
	for (const p of sorted(series)) {
		const month = p.date.slice(0, 7);
		months.set(month, (months.get(month) ?? 0) + (Number(p.value) || 0));
	}
	return [...months.entries()].map(([date, value]) => ({ date, value }));
}

/** Last `days` points of a daily series. */
export function lastDays(series: Point[], days: number): Point[] {
	return sorted(series).slice(-days);
}

/**
 * Each row's share of the column total, 0-100. Used for the inline proportion
 * bars in the performance tables. A zero total gives every row 0 rather than NaN.
 */
export function shareOfTotal(values: number[]): number[] {
	const total = values.reduce((a, b) => a + (Number(b) || 0), 0);
	if (total <= 0) return values.map(() => 0);
	return values.map((v) => ((Number(v) || 0) / total) * 100);
}
