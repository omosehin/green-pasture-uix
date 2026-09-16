import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

import { useAppDispatch, useAppSelector } from "@/_redux/store";
import { reviewAction } from "@/_redux/actions/review.action";
import { reviewSchema, ReviewFormData } from "@/_validations/review";

interface ReviewFormProps {
	itemId: string;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ itemId }) => {
	const dispatch = useAppDispatch();
	const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
	const isSubmitting = useAppSelector((state) => state.review.isSubmitting);
	const [hoverRating, setHoverRating] = useState(0);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors },
	} = useForm<ReviewFormData>({
		resolver: zodResolver(reviewSchema),
		defaultValues: {
			rating: 0,
			comment: "",
		},
	});

	const currentRating = watch("rating");

	const handleStarClick = (rating: number) => {
		setValue("rating", rating, { shouldValidate: true });
	};

	const onSubmit = async (data: ReviewFormData) => {
		try {
			await dispatch(
				reviewAction.submitReviewAsync({
					rating: data.rating,
					comment: data.comment,
					itemId,
				})
			).unwrap();
			toast.success("Review submitted successfully!");
			reset();
			setHoverRating(0);
			dispatch(reviewAction.fetchItemReviewsAsync({ itemId }));
		} catch (error: any) {
			toast.error(error || "Failed to submit review");
		}
	};

	if (!isAuthenticated) {
		return (
			<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
				<p className="mb-3" style={{ color: "var(--text-secondary)" }}>Log in to leave a review</p>
				<Link
					href="/login"
					className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors font-medium"
				>
					Log In
				</Link>
			</div>
		);
	}

	return (
		<div className="bg-white dark:bg-white/[0.04] border border-[rgba(22,163,74,0.06)] dark:border-white/8 rounded-xl p-6 transition-all duration-300">
			<h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Write a Review</h4>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div>
					<label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Rating</label>
					<div className="flex items-center space-x-1">
						{[1, 2, 3, 4, 5].map((star) => (
							<button
								key={star}
								type="button"
								onClick={() => handleStarClick(star)}
								onMouseEnter={() => setHoverRating(star)}
								onMouseLeave={() => setHoverRating(0)}
								className="focus:outline-none"
							>
								<Star
									className={`h-7 w-7 cursor-pointer transition-colors ${
										star <= (hoverRating || currentRating)
											? "text-yellow-400 fill-current"
											: "text-gray-300"
									}`}
								/>
							</button>
						))}
					</div>
					{errors.rating && (
						<p className="text-red-500 text-sm mt-1">{errors.rating.message}</p>
					)}
				</div>

				<div>
					<label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
						Comment (optional)
					</label>
					<textarea
						{...register("comment")}
						rows={4}
						placeholder="Share your experience with this product..."
						className="w-full border rounded-md px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-colors resize-none"
						style={{ borderColor: "var(--border-light)", color: "var(--text-primary)" }}
					/>
				</div>

				<button
					type="submit"
					disabled={isSubmitting}
					className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
				>
					{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
					<span>{isSubmitting ? "Submitting..." : "Submit Review"}</span>
				</button>
			</form>
		</div>
	);
};

export default ReviewForm;
