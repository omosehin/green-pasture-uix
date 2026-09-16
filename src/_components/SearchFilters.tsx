import React, { useEffect, useState } from "react";
import { Filter, Star } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/_redux/store";
import { SearchFilters } from "@/_utils/searchUtils";
import { useProductFilters } from "@/_hooks/useProductFilters";
import { categoryAction } from "@/_redux/actions/category.action";
import { tagAction } from "@/_redux/actions/tag.action";

// ── Formatted Number Input ──
const NumberInput: React.FC<{
	value: number;
	onChange: (val: number) => void;
	max?: number;
}> = ({ value, onChange, max = 1000000 }) => {
	const [display, setDisplay] = useState(value.toLocaleString());

	useEffect(() => {
		setDisplay(value.toLocaleString());
	}, [value]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const raw = e.target.value.replace(/[^0-9]/g, "");
		const num = parseInt(raw || "0", 10);
		const clamped = Math.min(num, max);
		setDisplay(clamped.toLocaleString());
		onChange(clamped);
	};

	return (
		<input
			type="text"
			inputMode="numeric"
			value={display}
			onChange={handleChange}
			className="w-24 px-2.5 py-1.5 rounded-lg text-sm outline-none transition-all text-center tabular-nums"
			style={{
				background: "transparent",
				border: "1px solid var(--border-light)",
				color: "var(--text-primary)",
			}}
			onFocus={(e) => {
				e.currentTarget.style.borderColor = "var(--color-primary)";
				e.currentTarget.style.boxShadow = "0 0 0 2px rgba(22,163,74,0.15)";
			}}
			onBlur={(e) => {
				e.currentTarget.style.borderColor = "var(--border-light)";
				e.currentTarget.style.boxShadow = "none";
			}}
		/>
	);
};

const SearchFiltersComponent: React.FC = () => {
	const dispatch = useAppDispatch();
	const { filters, setFilters, resetFilters, hasActiveFilters } =
		useProductFilters();
	const { categories } = useAppSelector((state) => state.product);
	const isFetchingCategories = useAppSelector(
		(state) => state.category.isFetchingAllCategories
	);
	// Only skeleton the very first load — during background refreshes the
	// previously fetched options stay visible and usable.
	const showCategorySkeleton = isFetchingCategories && categories.length <= 1;
	const tags = useAppSelector((state) => state.tag.tags);

	useEffect(() => {
		if (categories.length <= 1) {
			dispatch(categoryAction.fetchAllCategories());
		}
	}, [categories.length, dispatch]);

	useEffect(() => {
		if (!tags.length) dispatch(tagAction.fetchTags());
	}, [tags.length, dispatch]);

	const handleFilterChange = (newFilters: Partial<SearchFilters>) =>
		setFilters(newFilters);

	const handleResetFilters = () => resetFilters();

	return (
		<div>
			{/* Header */}
			<div className="flex items-center justify-between mb-5">
				<h3
					className="text-sm font-semibold flex items-center gap-2"
					style={{ color: "var(--text-primary)" }}
				>
					<Filter className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
					Filters
				</h3>
				{hasActiveFilters && (
					<button
						onClick={handleResetFilters}
						className="text-[0.65rem] font-medium px-2 py-1 rounded-md transition-colors cursor-pointer"
						style={{ color: "#ef4444" }}
						onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}
						onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
					>
						Clear All
					</button>
				)}
			</div>

			<div className="space-y-6">
				{/* Category */}
				<div>
					<h4
						className="text-xs font-semibold uppercase tracking-wider mb-3"
						style={{ color: "var(--text-hint)" }}
					>
						Category
					</h4>
					{showCategorySkeleton ? (
						<div className="space-y-1">
							{[...Array(5)].map((_, i) => (
								<div
									key={i}
									className="flex items-center px-2.5 py-2 animate-pulse"
								>
									<span
										className="w-3.5 h-3.5 rounded-full mr-2.5 shrink-0"
										style={{ background: "var(--surface-medium)" }}
									/>
									<span
										className="h-3.5 rounded-full"
										style={{
											background: "var(--surface-medium)",
											width: `${55 + (i % 3) * 15}%`,
										}}
									/>
								</div>
							))}
						</div>
					) : (
					<div className="space-y-1">
						{categories?.map((category) => (
							<label
								key={category}
								className="flex items-center px-2.5 py-2 rounded-lg cursor-pointer transition-all"
								style={{
									background:
										filters?.category === category
											? "rgba(22,163,74,0.08)"
											: "transparent",
									color:
										filters?.category === category
											? "var(--color-primary)"
											: "var(--text-secondary)",
								}}
								onMouseEnter={(e) => {
									if (filters?.category !== category)
										e.currentTarget.style.background = "var(--surface-low)";
								}}
								onMouseLeave={(e) => {
									if (filters?.category !== category)
										e.currentTarget.style.background = "transparent";
								}}
							>
								<input
									type="radio"
									name="category"
									value={category}
									checked={filters?.category === category}
									onChange={(e) =>
										handleFilterChange({ category: e.target.value })
									}
									className="sr-only"
								/>
								<span
									className="w-3.5 h-3.5 rounded-full border-2 mr-2.5 flex items-center justify-center shrink-0"
									style={{
										borderColor:
											filters?.category === category
												? "var(--color-primary)"
												: "var(--border-medium)",
									}}
								>
									{filters?.category === category && (
										<span
											className="w-1.5 h-1.5 rounded-full"
											style={{ background: "var(--color-primary)" }}
										/>
									)}
								</span>
								<span className="text-sm font-medium">{category}</span>
							</label>
						))}
					</div>
					)}
				</div>

				{/* Tags — who the product suits. Independent of category, so a
				    product can carry several and still live on one shelf. */}
				{tags.length > 0 && (
					<div>
						<h4
							className="text-xs font-semibold uppercase tracking-wider mb-3"
							style={{ color: "var(--text-hint)" }}
						>
							Suitable for
						</h4>
						<div className="flex flex-wrap gap-2">
							{[{ id: "all", name: "All", slug: "All" }, ...tags].map((tag) => {
								const active = (filters?.tag ?? "All") === tag.slug;
								return (
									<button
										key={tag.id}
										type="button"
										onClick={() => handleFilterChange({ tag: tag.slug })}
										aria-pressed={active}
										className="rounded-full px-3 py-1.5 text-xs font-medium transition-all cursor-pointer"
										style={{
											background: active ? "rgba(154,202,60,0.16)" : "var(--surface-medium)",
											color: active ? "var(--color-primary)" : "var(--text-secondary)",
											border: `1px solid ${active ? "var(--color-primary)" : "transparent"}`,
										}}
									>
										{tag.name}
									</button>
								);
							})}
						</div>
					</div>
				)}

				{/* Price Range */}
				<div>
					<h4
						className="text-xs font-semibold uppercase tracking-wider mb-3"
						style={{ color: "var(--text-hint)" }}
					>
						Price Range (₦)
					</h4>
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<NumberInput
								value={filters?.priceRange[0] ?? 0}
								onChange={(val) =>
									handleFilterChange({
										priceRange: [val, filters?.priceRange[1]],
									})
								}
							/>
							<span className="text-xs" style={{ color: "var(--text-hint)" }}>to</span>
							<NumberInput
								value={filters?.priceRange[1] ?? 40000}
								onChange={(val) =>
									handleFilterChange({
										priceRange: [filters?.priceRange[0], val],
									})
								}
							/>
						</div>
						<input
							type="range"
							min="0"
							max="100000"
							step="1000"
							value={filters?.priceRange[1]}
							onChange={(e) =>
								handleFilterChange({
									priceRange: [
										filters?.priceRange[0],
										Number(e.target.value),
									],
								})
							}
							className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-green-600"
							style={{ background: "var(--surface-medium)" }}
						/>
					</div>
				</div>

				{/* Rating */}
				<div>
					<h4
						className="text-xs font-semibold uppercase tracking-wider mb-3"
						style={{ color: "var(--text-hint)" }}
					>
						Minimum Rating
					</h4>
					<div className="space-y-1">
						{[4, 3, 2, 1].map((rating) => (
							<label
								key={rating}
								className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all"
								style={{
									background:
										filters?.rating === rating
											? "rgba(22,163,74,0.08)"
											: "transparent",
								}}
								onMouseEnter={(e) => {
									if (filters?.rating !== rating)
										e.currentTarget.style.background = "var(--surface-low)";
								}}
								onMouseLeave={(e) => {
									if (filters?.rating !== rating)
										e.currentTarget.style.background =
											filters?.rating === rating
												? "rgba(22,163,74,0.08)"
												: "transparent";
								}}
							>
								<input
									type="radio"
									name="rating"
									value={rating}
									checked={filters?.rating === rating}
									onChange={(e) =>
										handleFilterChange({ rating: Number(e.target.value) })
									}
									className="sr-only"
								/>
								<div className="flex items-center gap-px">
									{[...Array(5)].map((_, i) => (
										<Star
											key={i}
											className={`h-3.5 w-3.5 ${
												i < rating
													? "text-amber-400 fill-amber-400"
													: ""
											}`}
											style={
												i >= rating
													? { color: "var(--text-disabled)" }
													: undefined
											}
										/>
									))}
								</div>
								<span className="text-xs" style={{ color: "var(--text-secondary)" }}>
									& up
								</span>
							</label>
						))}
						<label
							className="flex items-center px-2.5 py-2 rounded-lg cursor-pointer transition-all"
							style={{
								background:
									filters?.rating === 0
										? "rgba(22,163,74,0.08)"
										: "transparent",
							}}
							onMouseEnter={(e) => {
								if (filters?.rating !== 0)
									e.currentTarget.style.background = "var(--surface-low)";
							}}
							onMouseLeave={(e) => {
								if (filters?.rating !== 0)
									e.currentTarget.style.background =
										filters?.rating === 0
											? "rgba(22,163,74,0.08)"
											: "transparent";
							}}
						>
							<input
								type="radio"
								name="rating"
								value="0"
								checked={filters?.rating === 0}
								onChange={() => handleFilterChange({ rating: 0 })}
								className="sr-only"
							/>
							<span className="text-xs" style={{ color: "var(--text-secondary)" }}>
								Any rating
							</span>
						</label>
					</div>
				</div>

				{/* Availability */}
				<div>
					<h4
						className="text-xs font-semibold uppercase tracking-wider mb-3"
						style={{ color: "var(--text-hint)" }}
					>
						Availability
					</h4>
					<label
						className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all"
						style={{
							background: filters?.inStockOnly
								? "rgba(22,163,74,0.08)"
								: "transparent",
						}}
						onMouseEnter={(e) => {
							if (!filters?.inStockOnly)
								e.currentTarget.style.background = "var(--surface-low)";
						}}
						onMouseLeave={(e) => {
							if (!filters?.inStockOnly)
								e.currentTarget.style.background = "transparent";
						}}
					>
						<div
							className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all"
							style={{
								borderColor: filters?.inStockOnly
									? "var(--color-primary)"
									: "var(--border-medium)",
								background: filters?.inStockOnly
									? "var(--color-primary)"
									: "transparent",
							}}
						>
							{filters?.inStockOnly && (
								<svg
									width="10"
									height="10"
									viewBox="0 0 24 24"
									fill="none"
									stroke="white"
									strokeWidth="3"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<polyline points="20 6 9 17 4 12" />
								</svg>
							)}
						</div>
						<input
							type="checkbox"
							checked={filters?.inStockOnly}
							onChange={(e) =>
								handleFilterChange({ inStockOnly: e.target.checked })
							}
							className="sr-only"
						/>
						<span className="text-sm" style={{ color: "var(--text-secondary)" }}>
							In stock only
						</span>
					</label>
				</div>

				{/* Sort By */}
				<div>
					<h4
						className="text-xs font-semibold uppercase tracking-wider mb-3"
						style={{ color: "var(--text-hint)" }}
					>
						Sort By
					</h4>
					<select
						value={filters?.sortBy}
						onChange={(e) =>
							handleFilterChange({
								sortBy: e.target.value as SearchFilters["sortBy"],
							})
						}
						className="w-full px-3 py-2 rounded-lg text-sm outline-none cursor-pointer transition-all appearance-none"
						style={{
							background: "var(--surface-low)",
							border: "1px solid var(--border-medium)",
							color: "var(--text-primary)",
							backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
							backgroundPosition: "right 0.5rem center",
							backgroundRepeat: "no-repeat",
							backgroundSize: "1.5em 1.5em",
							paddingRight: "2.5rem",
						}}
					>
						<option value="name">Name (A-Z)</option>
						<option value="price-low">Price: Low to High</option>
						<option value="price-high">Price: High to Low</option>
						<option value="rating">Customer Rating</option>
						<option value="newest">Newest First</option>
					</select>
				</div>
			</div>
		</div>
	);
};

export default SearchFiltersComponent;
