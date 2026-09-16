"use client";

import { useMemo } from "react";
import {
	parseAsInteger,
	parseAsString,
	useQueryStates,
	type SingleParserBuilder,
} from "nuqs";

interface UseListParamsOptions {
	defaultPageSize?: number;
	/** Extra URL-backed filter keys, e.g. { status: parseAsString.withDefault("") } */
	extraFilters?: Record<string, SingleParserBuilder<string> & { defaultValue: string }>;
}

interface SetFilterOptions {
	resetPage?: boolean;
}

/**
 * URL-backed list state (page, pageSize, search + optional filters) for
 * paginated tables. Defaults are stripped from the URL (clearOnDefault), and
 * updates use history "replace" so typing/paging doesn't spam the back stack.
 */
export function useListParams(options?: UseListParamsOptions) {
	const defaultPageSize = options?.defaultPageSize ?? 50;
	const extraFilters = options?.extraFilters;

	const parsers = useMemo(
		() => ({
			page: parseAsInteger.withDefault(1),
			pageSize: parseAsInteger.withDefault(defaultPageSize),
			search: parseAsString.withDefault(""),
			...extraFilters,
		}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[defaultPageSize]
	);

	const [params, setParams] = useQueryStates(parsers, { history: "replace" });

	const { page, pageSize, search, ...rest } = params;
	const filterValues = rest as Record<string, string>;

	const setPage = (p: number) => setParams({ page: p });

	// No-op when unchanged: DataTable's debounce fires once on mount with the
	// seeded value, and an unconditional update would reset a deep-linked page.
	const setSearch = (s: string) => {
		if (s === search) return;
		setParams({ search: s || null, page: 1 } as Partial<typeof params>);
	};

	const setPageSize = (n: number) => {
		if (n === pageSize) return;
		setParams({ pageSize: n, page: 1 } as Partial<typeof params>);
	};

	const setFilter = (
		key: string,
		value: string,
		{ resetPage = true }: SetFilterOptions = {}
	) => {
		setParams({
			[key]: value || null,
			...(resetPage ? { page: 1 } : {}),
		} as Partial<typeof params>);
	};

	return {
		page: page as number,
		pageSize: pageSize as number,
		search: search as string,
		filterValues,
		setPage,
		setSearch,
		setPageSize,
		setFilter,
	};
}
