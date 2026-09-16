/**
 * Collapse the catalogue so one product is one card, however many pack sizes
 * it sells in.
 *
 * The key is `variantGroupId ?? id`, so an ungrouped item is its own group of
 * one and callers never branch on "does this have variants".
 *
 * Call this AFTER filtering, never before: grouping first would let a size
 * excluded by a price or tag filter drag its siblings back into the results.
 *
 * ponytail: grouping is client-side because the storefront loads the whole
 * catalogue in one page (`items?page=1&limit=100`). Once real pagination
 * lands, a group can straddle a page boundary and the same product will appear
 * twice — the fix then is a server-side listing using
 * `DISTINCT ON (variant_group_id)`.
 */
export type WithVariants<T> = T & { variants: T[] };

export function variantGroupKey(item: any): string {
	return item?.variantGroupId ?? item?.id;
}

// Published AND in stock, per the spec's representative rule. Both current
// feeders fetch `?published=true`, so the published half never fires today —
// it is here so handing this an unfiltered list can never elect a draft
// sibling as the public face of the card.
const canRepresent = (item: any): boolean => item?.published !== false && Number(item?.unit) > 0;

const bySizeAscending = (a: any, b: any): number => Number(a?.weightValue ?? 0) - Number(b?.weightValue ?? 0);

export function groupVariants<T extends Record<string, any>>(items: T[] | undefined): WithVariants<T>[] {
	const groups = new Map<string, T[]>();
	for (const item of items ?? []) {
		const key = variantGroupKey(item);
		const group = groups.get(key);
		if (group) group.push(item);
		else groups.set(key, [item]);
	}

	return [...groups.values()].map((members) => {
		const variants = [...members].sort(bySizeAscending);
		// Merchant-set default wins first, but only if it is actually
		// purchasable — an out-of-stock or unpublished default must not hide a
		// buyable size behind it. Falls back to the existing cheapest-in-stock
		// rule when no member is marked default, or the default itself cannot
		// represent the group.
		const representative =
			variants.find((v) => v.isDefault && canRepresent(v)) ??
			variants.find(canRepresent) ??
			members[0];
		return { ...representative, variants };
	});
}
