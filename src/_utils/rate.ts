/**
 * Tax-rate conversions.
 *
 * taxRate is stored as a fraction (0.075) because every consumer — cart,
 * checkout, and the backend order total — multiplies by it directly. Humans
 * think in percent, so the admin form and the customer's order summary convert
 * at their own edges. Storage format never changes.
 *
 * This lives in _utils rather than beside the hook so it stays free of React
 * and redux imports, and can be unit tested with `node --test`.
 *
 * Why this matters: the admin input used to render the raw fraction next to a
 * "%" suffix, so it read "0.075 %". Correcting that to 7.5 saved a rate of 7.5,
 * and subtotal × 7.5 charges 750% tax.
 */

/** 0.075 -> 7.5, for display in a field labelled "%". */
export function rateToPercent(rate: number): number {
	// 0.07 * 100 is 7.000000000000001 in binary floating point; round it off so
	// the admin input does not show a tail of nines.
	return Math.round(Number(rate) * 100 * 1e6) / 1e6;
}

/** 7.5 -> 0.075, for persistence. */
export function percentToRate(percent: number): number {
	return Number((Number(percent) / 100).toFixed(6));
}

/** 0.075 -> "7.5%" — keeps the half point instead of rounding it up to 8%. */
export function formatRateAsPercent(rate: number): string {
	const pct = rateToPercent(rate);
	return `${Number.isInteger(pct) ? pct : Number(pct.toFixed(2))}%`;
}
