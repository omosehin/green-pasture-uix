import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { parseAsString, useQueryState } from "nuqs";
import { Search, Clock, X, TrendingUp } from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/_redux/store";
import { Product } from "@/types";
import {
	addRecentSearch,
	setSuggestions,
} from "@/_redux/reducers/search.reducer";

interface SearchBarProps {
	placeholder?: string;
	onSearch?: (query: string) => void;
	autoFocus?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
	placeholder = "Search for organic products...",
	onSearch,
	autoFocus = false,
}) => {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const products = useAppSelector((state) => state.product.products);
	const { recentSearches, suggestions } = useAppSelector(
		(state) => state.search
	);
	const [query, setQuery] = useQueryState(
		"q",
		parseAsString.withDefault("").withOptions({ history: "replace" })
	);

	const [localQuery, setLocalQuery] = useState(query);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
	const searchRef = useRef<HTMLInputElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setLocalQuery(query);
	}, [query]);

	useEffect(() => {
		if (localQuery?.length > 0) {
			const q = localQuery.toLowerCase();
			const productSuggestions = products
				.filter((product: Product) => {
					const p = product as any;
					const name = p.name || "";
					const category = p.product?.name || p.category || "";
					const description = p.description || "";
					return (
						name.toLowerCase().includes(q) ||
						category.toLowerCase().includes(q) ||
						description.toLowerCase().includes(q)
					);
				})
				.map((product: Product) => product.name)
				.slice(0, 5);

			dispatch(setSuggestions(productSuggestions));
		} else {
			dispatch(setSuggestions([]));
		}
	}, [localQuery, products, dispatch]);

	const handleSearch = (searchQuery: string) => {
		const trimmedQuery = searchQuery?.trim();
		if (trimmedQuery) {
			dispatch(addRecentSearch(trimmedQuery));
			setShowSuggestions(false);

			if (onSearch) {
				onSearch(trimmedQuery);
			} else {
				router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
			}
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		handleSearch(localQuery);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		const allSuggestions = [...suggestions, ...(recentSearches || [])];

		if (e.key === "ArrowDown") {
			e.preventDefault();
			setSelectedSuggestion((prev) =>
				prev < allSuggestions.length - 1 ? prev + 1 : prev
			);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setSelectedSuggestion((prev) => (prev > -1 ? prev - 1 : -1));
		} else if (e.key === "Enter") {
			if (selectedSuggestion >= 0) {
				e.preventDefault();
				handleSearch(allSuggestions[selectedSuggestion]);
				setSelectedSuggestion(-1);
			}
		} else if (e.key === "Escape") {
			setShowSuggestions(false);
			setSelectedSuggestion(-1);
		}
	};

	const handleClickOutside = (e: MouseEvent) => {
		if (
			dropdownRef.current &&
			!dropdownRef.current.contains(e.target as Node) &&
			searchRef.current &&
			!searchRef.current.contains(e.target as Node)
		) {
			setShowSuggestions(false);
			setSelectedSuggestion(-1);
		}
	};

	useEffect(() => {
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleRecentSearchClick = (searchTerm: string) => {
		handleSearch(searchTerm);
	};

	const clearSearch = () => {
		setLocalQuery("");
		setQuery(null);
		setShowSuggestions(false);
		searchRef.current?.focus();
	};

	return (
		<div className="relative">
			<form onSubmit={handleSubmit} className="relative">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
					<input
						ref={searchRef}
						type="text"
						value={localQuery}
						onChange={(e) => setLocalQuery(e.target.value)}
						onFocus={() => setShowSuggestions(true)}
						onKeyDown={handleKeyDown}
						placeholder={placeholder}
						autoFocus={autoFocus}
						className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-white/[0.04] dark:border-white/15 dark:text-white dark:placeholder:text-white/30"
					/>
					{localQuery && (
						<button
							type="button"
							onClick={clearSearch}
							className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
						>
							<X className="h-5 w-5" />
						</button>
					)}
				</div>
			</form>

			{showSuggestions &&
				(suggestions?.length > 0 || recentSearches?.length > 0) && (
					<div
						ref={dropdownRef}
						className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a1a2e] border border-[rgba(22,163,74,0.06)] dark:border-white/8 rounded-xl shadow-lg dark:shadow-none z-50 max-h-96 overflow-y-auto"
					>
						{suggestions?.length > 0 && (
							<div className="p-2">
								<div className="flex items-center text-xs text-gray-500 mb-2 px-2">
									<TrendingUp className="h-3 w-3 mr-1" />
									Products
								</div>
								{suggestions?.map((suggestion, index) => (
									<button
										key={suggestion}
										onClick={() => handleSearch(suggestion)}
										className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/90 ${
											selectedSuggestion === index
												? "bg-gray-100 dark:bg-white/5"
												: ""
										}`}
									>
										<div className="flex items-center">
											<Search className="h-4 w-4 text-gray-400 mr-2" />
											{suggestion}
										</div>
									</button>
								))}
							</div>
						)}

						{recentSearches?.length > 0 && (
							<div className="p-2 border-t border-gray-100">
								<div className="flex items-center text-xs text-gray-500 mb-2 px-2">
									<Clock className="h-3 w-3 mr-1" />
									Recent searches
								</div>
								{recentSearches?.map((recentSearch, index) => (
									<button
										key={recentSearch}
										onClick={() =>
											handleRecentSearchClick(recentSearch)
										}
										className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/90 ${
											selectedSuggestion ===
											suggestions.length + index
												? "bg-gray-100 dark:bg-white/5"
												: ""
										}`}
									>
										<div className="flex items-center">
											<Clock className="h-4 w-4 text-gray-400 mr-2" />
											{recentSearch}
										</div>
									</button>
								))}
							</div>
						)}
					</div>
				)}
		</div>
	);
};

export default SearchBar;
