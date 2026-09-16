import { formatWeight } from "./formatWeight.ts";

export type VariantSummary = {
	/** The group's sizes, empty when this item is not a multi-size group. */
	variants: any[];
	/** "100g · 250g +2", or the item's own pack size when it stands alone. */
	packSize: string;
	/** True only when the group's sizes are not all the same price. */
	priceVaries: boolean;
	/** Cheapest size in the group; 0 when there is no group. */
	lowestPrice: number;
};

/**
 * The facts every catalogue surface needs about a product that may sell in
 * several pack sizes.
 *
 * Lives here rather than inside ProductCard because the listing renders rows
 * two ways — grid through ProductCard, list inline — and the two disagreeing
 * about whether a product costs "₦8,000" or "from ₦8,000" is exactly the bug
 * this prevents.
 */
export function variantSummary(item: any): VariantSummary {
	const variants: any[] = item?.variants?.length > 1 ? item.variants : [];
	// Label first, then slice. formatWeight returns "" for a size with no
	// weightValue, and groupVariants sorts those to the front — counting the
	// overflow off the raw list would hide two sizes while claiming one.
	const sizeLabels = variants.map((v) => formatWeight(v.weightValue, v.weightUnit)).filter(Boolean);
	return {
		variants,
		packSize: variants.length
			? sizeLabels.slice(0, 3).join(" · ") + (sizeLabels.length > 3 ? ` +${sizeLabels.length - 3}` : "")
			: formatWeight(item?.weightValue, item?.weightUnit),
		priceVaries: variants.length > 0 && new Set(variants.map((v) => Number(v.price))).size > 1,
		lowestPrice: variants.length ? Math.min(...variants.map((v) => Number(v.price || 0))) : 0,
	};
}
