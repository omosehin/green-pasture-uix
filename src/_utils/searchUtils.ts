import { Product } from "../types";
import { htmlToText } from "./htmlToText";

export interface SearchFilters {
	category: string;
	priceRange: [number, number];
	inStockOnly: boolean;
	organicOnly: boolean;
	rating: number;
	sortBy: "name" | "price-low" | "price-high" | "rating" | "newest";
	/** Tag slug, or "All". Independent of category — a product can carry several. */
	tag?: string;
}

export const filterAndSortProducts = (
	products: Product[],
	query: string,
	filters: SearchFilters
): Product[] => {
	if (!products) return [];

	let filtered = products.filter((product) => {
		const p = product as any;

		// Adapt to both old Product type and backend Item shape
		const name = p.name || "";
		const description = p.description || "";
		const category = p.product?.name || p.category || "";
		const price = Number(p.price || 0);
		const inStock = p.unit !== undefined ? p.unit > 0 : p.inStock;
		const rating = p.ratingStats?.average ?? p.rating ?? 0;
		const tagSlugs: string[] = (p.tags ?? []).map((t: any) => t?.slug).filter(Boolean);

		// Text search. Description is HTML now, so a query would otherwise match
		// tag names and style attributes — search the flattened text instead.
		const matchesQuery =
			!query ||
			query.trim() === "" ||
			name.toLowerCase().includes(query.toLowerCase()) ||
			htmlToText(description).toLowerCase().includes(query.toLowerCase()) ||
			category.toLowerCase().includes(query.toLowerCase());

		// Category filter
		const matchesCategory =
			!filters?.category ||
			filters.category === "All" ||
			category === filters.category;

		// Tag filter — matched on slug, which is what the URL carries
		const matchesTag =
			!filters?.tag || filters.tag === "All" || tagSlugs.includes(filters.tag);

		// Price range filter
		const matchesPrice =
			price >= (filters?.priceRange?.[0] ?? 0) &&
			price <= (filters?.priceRange?.[1] ?? Infinity);

		// Stock filter
		const matchesStock = !filters?.inStockOnly || inStock;

		// Rating filter
		const matchesRating =
			!filters?.rating || filters.rating === 0 || rating >= filters.rating;

		return (
			matchesQuery &&
			matchesCategory &&
			matchesTag &&
			matchesPrice &&
			matchesStock &&
			matchesRating
		);
	});

	// Sort
	switch (filters?.sortBy) {
		case "price-low":
			filtered.sort((a, b) => Number(a.price) - Number(b.price));
			break;
		case "price-high":
			filtered.sort((a, b) => Number(b.price) - Number(a.price));
			break;
		case "rating": {
			filtered.sort((a, b) => {
				const ra = (a as any).ratingStats?.average ?? (a as any).rating ?? 0;
				const rb = (b as any).ratingStats?.average ?? (b as any).rating ?? 0;
				return rb - ra;
			});
			break;
		}
		case "newest":
			filtered.sort((a, b) => {
				const ta = new Date((a as any).createdAt || 0).getTime();
				const tb = new Date((b as any).createdAt || 0).getTime();
				return tb - ta;
			});
			break;
		case "name":
		default:
			break;
	}

	return filtered;
};
