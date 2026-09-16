import React, { useCallback, useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Star } from "lucide-react";
import toast from "react-hot-toast";

import withAdminAuth from "@/_components/withAdminAuth";
import AdminLayout from "@/_components/AdminLayout";
import { DataTable } from "@/_components/DataTable";
import { useAppDispatch, useAppSelector } from "@/_redux/store";
import { reviewAction } from "@/_redux/actions/review.action";
import { useListParams } from "@/_hooks/useListParams";
import { BackendReview } from "@/types";

/**
 * Review moderation. The one thing this page exists for is the Featured
 * toggle — featured reviews are what the home page's testimonial carousel
 * leads with, so this is the editorial control over that section.
 */
const AdminReviews: React.FC = () => {
	const dispatch = useAppDispatch();
	const { reviews, pagination, isLoading } = useAppSelector((state) => state.review);
	const { page: currentPage, pageSize, search: searchTerm, setPage, setSearch, setPageSize } = useListParams();
	const [togglingId, setTogglingId] = useState<string | null>(null);

	const refresh = useCallback(() => {
		dispatch(reviewAction.fetchItemReviewsAsync({ page: currentPage, limit: pageSize, search: searchTerm || undefined }));
	}, [dispatch, currentPage, pageSize, searchTerm]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const toggleFeatured = async (review: BackendReview) => {
		setTogglingId(review.id);
		try {
			await dispatch(reviewAction.setReviewFeaturedAsync({ ids: [review.id], featured: !review.featured })).unwrap();
			toast.success(review.featured ? "Removed from the home page" : "Featured on the home page");
			refresh();
		} catch (error) {
			toast.error(error as string);
		} finally {
			setTogglingId(null);
		}
	};

	const columns: ColumnDef<BackendReview, any>[] = [
		{
			accessorKey: "customer",
			header: "Customer",
			meta: { width: "180px" },
			cell: ({ row }) => (
				<span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
					{row.original.customer}
				</span>
			),
		},
		{
			id: "item",
			header: "Product",
			meta: { width: "180px" },
			cell: ({ row }) => (
				<span className="text-sm" style={{ color: "var(--text-secondary)" }}>
					{row.original.item?.name ?? "—"}
				</span>
			),
		},
		{
			accessorKey: "rating",
			header: "Rating",
			meta: { width: "90px" },
			cell: ({ row }) => (
				<span className="text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
					{row.original.rating}★
				</span>
			),
		},
		{
			accessorKey: "comment",
			header: "Comment",
			meta: { maxWidth: "420px", truncate: true },
			cell: ({ row }) => (
				<span className="text-sm" style={{ color: "var(--text-secondary)" }}>
					{row.original.comment || "— no written feedback —"}
				</span>
			),
		},
		{
			id: "featured",
			header: "Home page",
			enableSorting: false,
			meta: { width: "130px", align: "center" },
			cell: ({ row }) => {
				const review = row.original;
				// Only reviews that carry text can be a testimonial — the carousel has
				// nothing to show without a quote, so don't let one be featured.
				const canFeature = !!review.comment?.trim();
				return (
					<button
						onClick={() => toggleFeatured(review)}
						disabled={!canFeature || togglingId === review.id}
						title={canFeature ? (review.featured ? "Remove from home page" : "Feature on home page") : "Needs a written comment"}
						className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
						style={{
							background: review.featured ? "rgba(154,202,60,0.16)" : "transparent",
							border: `1px solid ${review.featured ? "transparent" : "var(--border-light)"}`,
							color: review.featured ? "var(--color-primary)" : "var(--text-secondary)",
						}}
					>
						<Star className={`h-3.5 w-3.5 ${review.featured ? "fill-current" : ""}`} />
						{review.featured ? "Featured" : "Feature"}
					</button>
				);
			},
		},
	];

	return (
		<AdminLayout>
			<div className="animate-page-enter space-y-6">
				<DataTable
					columns={columns}
					data={reviews ?? []}
					isLoading={isLoading}
					onRefresh={refresh}
					refreshing={isLoading}
					manualFiltering
					globalFilter={searchTerm}
					onGlobalFilterChange={setSearch}
					searchPlaceholder="Search review comments..."
					pageIndex={currentPage - 1}
					pageSize={pageSize}
					pageCount={pagination?.totalPages ?? 1}
					totalItems={pagination?.totalItems}
					onPageChange={(idx) => setPage(idx + 1)}
					onPageSizeChange={setPageSize}
					emptyMessage="No reviews yet"
				/>
			</div>
		</AdminLayout>
	);
};

export default withAdminAuth(AdminReviews);
