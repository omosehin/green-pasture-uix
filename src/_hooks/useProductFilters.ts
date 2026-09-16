"use client";

import {
	parseAsBoolean,
	parseAsInteger,
	parseAsString,
	parseAsStringLiteral,
	useQueryStates,
} from "nuqs";

import type { SearchFilters } from "@/_utils/searchUtils";

export const PRICE_MAX_DEFAULT = 40000;

const SORT_OPTIONS = [
	"name",
	"price-low",
	"price-high",
	"rating",
	"newest",
] as const;

/**
 * URL-backed product browsing state (/products and /search). Both the filter
 * sidebar and the results grid read the same URL, so filtered views are
 * shareable and survive refresh. Defaults are stripped from the URL.
 */
export function useProductFilters() {
	const [params, setParams] = useQueryStates(
		{
			q: parseAsString.withDefault(""),
			category: parseAsString.withDefault("All"),
			tag: parseAsString.withDefault("All"),
			sort: parseAsStringLiteral(SORT_OPTIONS).withDefault("name"),
			minPrice: parseAsInteger.withDefault(0),
			maxPrice: parseAsInteger.withDefault(PRICE_MAX_DEFAULT),
			inStock: parseAsBoolean.withDefault(false),
			rating: parseAsInteger.withDefault(0),
		},
		{ history: "replace" }
	);

	const filters: SearchFilters = {
		category: params.category,
		tag: params.tag,
		priceRange: [params.minPrice, params.maxPrice],
		inStockOnly: params.inStock,
		organicOnly: false,
		rating: params.rating,
		sortBy: params.sort,
	};

	const setFilters = (partial: Partial<SearchFilters>) => {
		setParams({
			...(partial.category !== undefined && { category: partial.category }),
			...(partial.tag !== undefined && { tag: partial.tag }),
			...(partial.sortBy !== undefined && { sort: partial.sortBy }),
			...(partial.priceRange !== undefined && {
				minPrice: partial.priceRange[0],
				maxPrice: partial.priceRange[1],
			}),
			...(partial.inStockOnly !== undefined && { inStock: partial.inStockOnly }),
			...(partial.rating !== undefined && { rating: partial.rating }),
		});
	};

	const resetFilters = () =>
		setParams({
			category: null,
			tag: null,
			sort: null,
			minPrice: null,
			maxPrice: null,
			inStock: null,
			rating: null,
		});

	const hasActiveFilters =
		params.category !== "All" ||
		params.tag !== "All" ||
		params.inStock ||
		params.rating > 0 ||
		params.minPrice > 0 ||
		params.maxPrice < PRICE_MAX_DEFAULT;

	return {
		query: params.q,
		filters,
		setFilters,
		resetFilters,
		hasActiveFilters,
	};
}
