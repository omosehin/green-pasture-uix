import { useState } from "react";

interface PaginationProps {
	currentPage: number;
	totalPages?: number;
	onPageChange: (page: number) => void;
	itemsPerPage: number;
	totalItems: number;
	onItemsPerPageChange: (items: number) => void;
	itemsPerPageOptions?: number[];
	showItemsPerPage?: boolean;
	showPageInfo?: boolean;
	maxPageButtons?: number;
}

export function Pagination({
	totalItems,
	onPageChange,
	currentPage,
	itemsPerPage,
	onItemsPerPageChange,
	totalPages = Math.ceil(totalItems / itemsPerPage),
	itemsPerPageOptions = [5, 10, 20, 50, 100],
	showItemsPerPage = false,
	showPageInfo = true,
	maxPageButtons = 5,
}: PaginationProps) {
	const startItem = (currentPage - 1) * itemsPerPage + 1;
	const endItem = Math.min(currentPage * itemsPerPage, totalItems);

	const getPageNumbers = () => {
		const pages: (number | string)[] = [];

		if (totalPages <= maxPageButtons) {
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		}

		const leftSiblingIndex = Math.max(currentPage - 1, 1);
		const rightSiblingIndex = Math.min(currentPage + 1, totalPages);

		const showLeftDots = leftSiblingIndex > 2;
		const showRightDots = rightSiblingIndex < totalPages - 1;

		if (!showLeftDots && showRightDots) {
			const leftRange = Array.from({ length: 5 }, (_, i) => i + 1);
			return [...leftRange, "...", totalPages];
		}

		if (showLeftDots && !showRightDots) {
			const rightRange = Array.from(
				{ length: 5 },
				(_, i) => totalPages - 4 + i
			);
			return [1, "...", ...rightRange];
		}

		if (showLeftDots && showRightDots) {
			const middleRange = Array.from(
				{ length: 3 },
				(_, i) => leftSiblingIndex + i
			);
			return [1, "...", ...middleRange, "...", totalPages];
		}

		return pages;
	};

	const pageNumbers = getPageNumbers();

	return (
		<div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-white/[0.04] border-t border-[rgba(22,163,74,0.06)] dark:border-white/8">
			{/* Items per page selector */}
			{showItemsPerPage && (
				<div className="flex items-center gap-2">
					<label
						htmlFor="items-per-page"
						className="text-sm text-gray-700 dark:text-white/70"
					>
						Rows per page:
					</label>
					<select
						id="items-per-page"
						value={itemsPerPage}
						onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
						className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						{itemsPerPageOptions.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
				</div>
			)}

			{/* Page info */}
			{showPageInfo && (
				<div className="text-sm text-gray-700 dark:text-white/70">
					Showing <span className="font-medium">{startItem}</span> to{" "}
					<span className="font-medium">{endItem}</span> of{" "}
					<span className="font-medium">{totalItems}</span> results
				</div>
			)}

			{/* Pagination controls */}
			<div className="flex items-center gap-1">
				{/* First page button */}
				<button
					onClick={() => onPageChange(1)}
					disabled={currentPage === 1}
					className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
					aria-label="First page"
				>
					<svg
						className="w-5 h-5 text-gray-700 dark:text-white/70"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
						/>
					</svg>
				</button>

				{/* Previous button */}
				<button
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage === 1}
					className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
					aria-label="Previous page"
				>
					<svg
						className="w-5 h-5 text-gray-700 dark:text-white/70"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</button>

				{/* Page numbers */}
				{pageNumbers?.map((page, index) => (
					<button
						key={index}
						onClick={() => typeof page === "number" && onPageChange(page)}
						disabled={page === "..."}
						className={`min-w-[2.5rem] px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer transition-colors ${
							page === currentPage
								? "bg-green-100 dark:bg-white/10 text-green-700 font-medium"
								: page === "..."
								? "cursor-default"
								: "hover:text-gray-900 text-gray-700 dark:text-white/70"
						}`}
					>
						{page}
					</button>
				))}

				{/* Next button */}
				<button
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage === totalPages}
					className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
					aria-label="Next page"
				>
					<svg
						className="w-5 h-5 text-gray-700 dark:text-white/70"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>

				{/* Last page button */}
				<button
					onClick={() => onPageChange(totalPages)}
					disabled={currentPage === totalPages}
					className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
					aria-label="Last page"
				>
					<svg
						className="w-5 h-5 text-gray-700 dark:text-white/70"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M13 5l7 7-7 7M5 5l7 7-7 7"
						/>
					</svg>
				</button>
			</div>
		</div>
	);
}
