/**
 * "2500g", "50 tabs", "1 paint" — the pack size as a shopper reads it.
 *
 * Mass and volume units sit tight against the number the way a label prints
 * them (250g, 500ml); counted units read as words and need the space (50 tabs).
 * Returns "" when either half is missing, so callers can render the whole
 * element conditionally on a falsy result.
 */
const TIGHT_UNITS = new Set(["g", "kg", "mg", "ml", "l", "cl", "oz", "lb"]);

export function formatWeight(value?: number | string | null, unit?: string | null): string {
	if (value === null || value === undefined || value === "") return "";
	const numeric = Number(value);
	if (!Number.isFinite(numeric) || numeric <= 0) return "";

	// Trailing zeros are noise on a pack size: 250.00 -> 250, 1.50 -> 1.5.
	const amount = String(Number(numeric.toFixed(2)));
	const cleanUnit = (unit ?? "").trim();
	if (!cleanUnit) return amount;

	return TIGHT_UNITS.has(cleanUnit.toLowerCase()) ? `${amount}${cleanUnit}` : `${amount} ${cleanUnit}`;
}

/** Units offered in the admin form. Free text is still accepted for the rest. */
export const WEIGHT_UNITS = ["g", "kg", "mg", "ml", "l", "tabs", "caps", "sachets", "pcs", "paint"] as const;
