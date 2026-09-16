/**
 * Sanity guard for a fetched country priceFactor (see _hooks/useCurrency.ts).
 *
 * useCurrency does `priceInNaira * priceFactor`, so a real NGN -> foreign-
 * currency rate is always well below 1 (NGN is a low-value currency; e.g.
 * ~0.00062 for USD). A bad value here — zero, negative, absent, or a
 * base-price multiplier like 1.54 mistakenly stored where a rate belongs —
 * must never be applied silently, or every price on the storefront is wrong.
 *
 * Lives in _utils rather than beside the hook so it stays free of React and
 * redux imports, and can be unit tested with `node --test`.
 */
export function isPlausiblePriceFactor(factor: number): boolean {
	return Number.isFinite(factor) && factor > 0 && factor < 1;
}
