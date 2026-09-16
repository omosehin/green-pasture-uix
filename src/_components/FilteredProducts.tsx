import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
	Grid,
	List,
	SlidersHorizontal,
	X,
	Star,
} from "lucide-react";

import EmptyState from "@/_UI/EmptyState";
import EmptySearchIllustration from "@/_UI/illustrations/EmptySearchIllustration";
import SearchFiltersComponent from "@/_components/SearchFilters";
import { useAppDispatch, useAppSelector } from "@/_redux/store";
import { filterAndSortProducts } from "@/_utils";
import { groupVariants } from "@/_utils/groupVariants";
import { variantSummary } from "@/_utils/variantSummary";
import { useProductFilters } from "@/_hooks/useProductFilters";
import ProductCard from "@/_components/ProductCard";
import SearchBar from "@/_components/SearchBar";
import { usePathname } from "next/navigation";
import { productsAction } from "@/_redux/actions";
import { htmlToText } from "@/_utils/htmlToText";

const gridContainerVariants = {
	hidden: {},
	visible: {
		transition: { staggerChildren: 0.06 },
	},
};

const gridItemVariants = {
	hidden: { opacity: 0, y: 20, scale: 0.95 },
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
	},
};

const FilteredProducts: React.FC = () => {
	const router = useRouter();
	const pathname = usePathname();
	const dispatch = useAppDispatch();
	const isSearchPage = pathname.includes("/search");

	const { query, filters } = useProductFilters();
	const { products, isFetchingAllProducts } = useAppSelector(
		(state) => state.product
	);
	const showDiscount = useAppSelector((state) => state.settings.showDiscountBadges);

	const [showFilters, setShowFilters] = useState(false);
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

	useEffect(() => {
		dispatch(productsAction.fetchAllProducts({ activeOnly: true }));
	}, [dispatch]);

	// Same order as the home rail: filter, then collapse pack sizes into one
	// card each. The result count on line 98 then counts products, not SKUs,
	// which is what "12 products found" is meant to mean.
	const filteredProducts = groupVariants(filterAndSortProducts(products, query, filters));

	const handleSearch = (searchQuery: string) => {
		router.push(
			`/search?q=${encodeURIComponent(searchQuery)}`,
			undefined,
			{ shallow: true }
		);
	};

	return (
		<div className="container page-wrapper mx-auto px-4 py-8 md:py-12">
			{/* Header */}
			<div className="mb-8">
				{isSearchPage && (
					<div className="max-w-2xl mx-auto mb-8">
						<SearchBar onSearch={handleSearch} autoFocus />
					</div>
				)}

				<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
					<div>
						<h1
							className="text-2xl md:text-3xl font-bold"
							style={{ color: "var(--text-primary)" }}
						>
							{isSearchPage
								? query
									? `Results for "${query}"`
									: "Search Products"
								: "All Products"}
						</h1>
						<p
							className="text-sm mt-1"
							style={{ color: "var(--text-hint)" }}
						>
							{isFetchingAllProducts
								? "Loading..."
								: `${filteredProducts?.length ?? 0} product${(filteredProducts?.length ?? 0) !== 1 ? "s" : ""} found`}
						</p>
					</div>

					<div className="flex items-center gap-2">
						{/* View toggle */}
						<div
							className="flex items-center rounded-lg p-0.5"
							style={{ background: "var(--surface-medium)" }}
						>
							{[
								{ mode: "grid" as const, icon: Grid },
								{ mode: "list" as const, icon: List },
							].map(({ mode, icon: Icon }) => (
								<button
									key={mode}
									onClick={() => setViewMode(mode)}
									className="p-2 rounded-md transition-all cursor-pointer"
									style={{
										background:
											viewMode === mode
												? "var(--surface-paper)"
												: "transparent",
										color:
											viewMode === mode
												? "var(--text-primary)"
												: "var(--text-hint)",
										boxShadow:
											viewMode === mode
												? "var(--shadow-sm)"
												: "none",
									}}
								>
									<Icon className="h-4 w-4" />
								</button>
							))}
						</div>

						{/* Mobile filter toggle */}
						<button
							onClick={() => setShowFilters(!showFilters)}
							className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
							style={{
								border: "1px solid var(--border-medium)",
								color: showFilters
									? "var(--color-primary)"
									: "var(--text-secondary)",
								background: showFilters
									? "rgba(22,163,74,0.06)"
									: "transparent",
							}}
						>
							{showFilters ? (
								<X className="h-3.5 w-3.5" />
							) : (
								<SlidersHorizontal className="h-3.5 w-3.5" />
							)}
							Filters
						</button>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
				{/* Filters Sidebar */}
				<div
					className={`lg:col-span-1 ${showFilters ? "block" : "hidden lg:block"}`}
				>
					<div
						className="rounded-xl p-5 sticky top-24"
						style={{
							background: "var(--surface-paper)",
							border: "1px solid var(--border-light)",
							boxShadow: "var(--shadow-sm)",
						}}
					>
						<SearchFiltersComponent />
					</div>
				</div>

				{/* Products */}
				<div className="lg:col-span-3">
					{isFetchingAllProducts && products.length === 0 ? (
						<div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
							{[...Array(6)].map((_, i) => (
								<div
									key={i}
									className="rounded-xl overflow-hidden animate-pulse"
									style={{
										background: "var(--surface-paper)",
										border: "1px solid var(--border-light)",
									}}
								>
									<div
										className="aspect-[4/3]"
										style={{
											background:
												"var(--surface-medium)",
										}}
									/>
									<div className="p-4 space-y-3">
										<div
											className="h-4 rounded-full w-3/4"
											style={{
												background:
													"var(--surface-medium)",
											}}
										/>
										<div
											className="h-3 rounded-full w-1/2"
											style={{
												background:
													"var(--surface-medium)",
											}}
										/>
										<div
											className="h-5 rounded-full w-1/3"
											style={{
												background:
													"var(--surface-medium)",
											}}
										/>
										<div
											className="h-9 rounded-lg"
											style={{
												background:
													"var(--surface-medium)",
											}}
										/>
									</div>
								</div>
							))}
						</div>
					) : filteredProducts?.length === 0 ? (
						<div
							className="rounded-xl"
							style={{
								background: "var(--surface-paper)",
								border: "1px solid var(--border-light)",
							}}
						>
							<EmptyState
								illustration={<EmptySearchIllustration className="w-36 h-36" />}
								title="No products found"
								description="Try adjusting your filters or search terms"
							/>
						</div>
					) : viewMode === "grid" ? (
						<motion.div
							className="grid grid-cols-2 lg:grid-cols-3 gap-4"
							variants={gridContainerVariants}
							initial="hidden"
							animate="visible"
							key="grid"
						>
							<AnimatePresence>
								{filteredProducts?.map((product) => (
									<motion.div
										key={product.id}
										variants={gridItemVariants}
										layout
										className="h-full flex flex-col"
									>
										<ProductCard product={product} />
									</motion.div>
								))}
							</AnimatePresence>
						</motion.div>
					) : (
						<motion.div
							className="space-y-3"
							variants={gridContainerVariants}
							initial="hidden"
							animate="visible"
							key="list"
						>
							{filteredProducts?.map((product, i) => {
								const p = product as any;
								const { packSize, priceVaries, lowestPrice } = variantSummary(p);
								const imageUrl =
									p.photos?.[0]?.url || p.image || "";
								const price = Number(p.price || 0);
								const originalPrice =
										showDiscount && p.originalPrice ? Number(p.originalPrice) : null;
								const discount = originalPrice && originalPrice > price
									? Math.round(((originalPrice - price) / originalPrice) * 100)
									: null;
								const rating =
									p.ratingStats?.average ??
									p.rating ??
									0;
								const reviewCount =
									p.ratingStats?.count ??
									p.reviews ??
									0;
								return (
									<div
										key={product.id}
										onClick={() =>
											router.push(
												`/product/${product.id}`
											)
										}
										className="flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer animate-row-enter"
										style={{
											background:
												"var(--surface-paper)",
											border: "1px solid var(--border-light)",
											animationDelay: `${i * 30}ms`,
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.boxShadow =
												"var(--shadow-md)";
											e.currentTarget.style.transform =
												"translateY(-1px)";
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.boxShadow =
												"none";
											e.currentTarget.style.transform =
												"none";
										}}
									>
										<div className="relative shrink-0">
											{imageUrl ? (
												<img
													src={imageUrl}
													alt={product.name}
													className="w-20 h-20 rounded-lg object-cover"
													style={{
														border: "1px solid var(--border-light)",
													}}
												/>
											) : (
												<div
													className="w-20 h-20 rounded-lg flex items-center justify-center text-xl font-bold"
													style={{
														background:
															"var(--surface-medium)",
														color: "var(--text-disabled)",
													}}
												>
													{product.name
														?.charAt(0)
														?.toUpperCase()}
												</div>
											)}
											{!priceVaries && discount && discount > 0 && (
												<span className="absolute top-1.5 left-1.5 text-[0.6rem] font-bold px-1 py-0.5 rounded text-white leading-none" style={{ background: '#ef4444' }}>
													-{discount}%
												</span>
											)}
										</div>
										<div className="flex-1 min-w-0">
											<h3
												className="font-semibold text-sm truncate"
												style={{
													color: "var(--text-primary)",
												}}
											>
												{product.name}
											</h3>
											{packSize && (
												<p
													className="text-xs mt-0.5"
													style={{
														color: "var(--text-hint)",
													}}
												>
													{packSize}
												</p>
											)}
											<p
												className="text-xs mt-0.5 line-clamp-1"
												style={{
													color: "var(--text-hint)",
												}}
											>
												{htmlToText(product.description)}
											</p>
											<div className="flex items-center gap-3 mt-2">
												<span
													className="text-sm font-bold"
													style={{
														color: "var(--color-primary)",
													}}
												>
													{priceVaries && (
														<span className="mr-0.5 text-[0.65rem] font-normal" style={{ color: "var(--text-hint)" }}>
															from
														</span>
													)}
													₦{(priceVaries ? lowestPrice : price).toLocaleString()}
												</span>
												{!priceVaries && originalPrice && discount && discount > 0 && (
													<span className="text-xs line-through" style={{ color: 'var(--text-hint)' }}>
														₦{originalPrice.toLocaleString()}
													</span>
												)}
												<div className="flex items-center gap-0.5">
													<Star className="h-3 w-3 text-amber-400 fill-amber-400" />
													<span
														className="text-[0.65rem]"
														style={{
															color: "var(--text-hint)",
														}}
													>
														{Number(
															rating
														).toFixed(1)}{" "}
														({reviewCount})
													</span>
												</div>
											</div>
										</div>
									</div>
								);
							})}
						</motion.div>
					)}
				</div>
			</div>
		</div>
	);
};

export default FilteredProducts;
