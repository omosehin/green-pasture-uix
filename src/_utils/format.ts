/** Shared number/currency formatting for the dashboard and analytics pages. */

/** Abbreviated Naira amount for chart axes/cards where space is tight: ₦1.2M, ₦450K, ₦123. */
export function formatCurrency(value: number): string {
	if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `₦${(value / 1_000).toFixed(1)}K`;
	return `₦${value.toLocaleString()}`;
}

/** Full Naira amount for tooltips/detail rows where precision matters. */
export function formatCurrencyFull(value: number): string {
	return `₦${Number(value).toLocaleString()}`;
}

export function formatNumber(value: number): string {
	return Number(value).toLocaleString();
}

/**
 * The analytics endpoint's day-bucketed datasets (revenueTrend, orderVolumeTrend,
 * stockMovementTrend) come back as full ISO datetime strings from a Postgres
 * `DATE(...)` cast (e.g. "2026-07-30T23:00:00.000Z"), not plain "YYYY-MM-DD".
 * TrendAreaChart's own day-fill keys are built from *local* Date getters
 * (see trend-area-chart.tsx's toISODate), so this must match that — parsing
 * with local getters, not UTC ones — or every bucket silently fails to line
 * up and every chart renders as a flat zero line despite having real data.
 */
export function toDayBucket(iso: string): string {
	const d = new Date(iso);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Seconds as m:ss for OTP/session countdowns. Clamped at zero so a timer that
 * overshoots shows "0:00" rather than a negative time.
 */
export function formatCountdown(seconds: number): string {
	const total = Math.max(0, Math.floor(seconds));
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
