import React, { useEffect, useState } from "react";
import { Star, Loader2 } from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/_redux/store";
import { reviewAction } from "@/_redux/actions/review.action";
import { BackendReview } from "@/types";

interface ReviewListProps {
	itemId: string;
}

const ReviewList: React.FC<ReviewListProps> = ({ itemId }) => {
	const dispatch = useAppDispatch();
	const { reviews, pagination, isLoading } = useAppSelector((state) => state.review);
	const [page, setPage] = useState(1);

	useEffect(() => {
		dispatch(reviewAction.fetchItemReviewsAsync({ itemId, page: 1, limit: 10 }));
	}, [dispatch, itemId]);

	const handleLoadMore = () => {
		const nextPage = page + 1;
		setPage(nextPage);
		dispatch(reviewAction.fetchItemReviewsAsync({ itemId, page: nextPage, limit: 10 }));
	};

	const hasMore = pagination && pagination.currentPage < pagination.totalPages;

	const averageRating =
		reviews.length > 0
			? reviews.reduce((sum: number, r: BackendReview) => sum + r.rating, 0) / reviews.length
			: 0;

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	if (isLoading && reviews.length === 0) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-green-600" />
			</div>
		);
	}

	if (!isLoading && reviews.length === 0) {
		return (
			<div className="bg-white dark:bg-white/[0.04] border border-[rgba(22,163,74,0.06)] dark:border-white/8 rounded-xl transition-all duration-300 p-8 text-center">
				<p className="text-gray-500 text-lg">No reviews yet. Be the first to review!</p>
			</div>
		);
	}

	return (
		<div>
			{/* Average Rating Summary */}
			<div className="bg-white dark:bg-white/[0.04] border border-[rgba(22,163,74,0.06)] dark:border-white/8 rounded-xl transition-all duration-300 p-6 mb-6">
				<div className="flex items-center space-x-6">
					<div className="text-center">
						<div className="text-3xl font-bold text-gray-800 dark:text-white/90">{averageRating.toFixed(1)}</div>
						<div className="flex items-center justify-center space-x-1 mt-1">
							{[...Array(5)].map((_, i) => (
								<Star
									key={i}
									className={`h-4 w-4 ${
										i < Math.floor(averageRating)
											? "text-yellow-400 fill-current"
											: "text-gray-300"
									}`}
								/>
							))}
						</div>
						<div className="text-sm text-gray-600 mt-1">
							{pagination?.totalItems ?? reviews.length} review{(pagination?.totalItems ?? reviews.length) !== 1 ? "s" : ""}
						</div>
					</div>
				</div>
			</div>

			{/* Individual Reviews */}
			<div className="space-y-4">
				{reviews.map((review: BackendReview) => (
					<div key={review.id} className="bg-white dark:bg-white/[0.04] border border-[rgba(22,163,74,0.06)] dark:border-white/8 rounded-xl transition-all duration-300 p-6">
						<div className="flex items-start justify-between mb-3">
							<div>
								<div className="font-medium text-gray-800 dark:text-white/90">{review.customer}</div>
								<div className="flex items-center space-x-1 mt-1">
									{[...Array(5)].map((_, i) => (
										<Star
											key={i}
											className={`h-4 w-4 ${
												i < review.rating
													? "text-yellow-400 fill-current"
													: "text-gray-300"
											}`}
										/>
									))}
								</div>
							</div>
							<span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
						</div>
						{review.comment && <p className="text-gray-700">{review.comment}</p>}
					</div>
				))}
			</div>

			{/* Load More */}
			{hasMore && (
				<div className="text-center mt-6">
					<button
						onClick={handleLoadMore}
						disabled={isLoading}
						className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
					>
						{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
						<span>{isLoading ? "Loading..." : "Load More"}</span>
					</button>
				</div>
			)}
		</div>
	);
};

export default ReviewList;
