import { createSlice } from "@reduxjs/toolkit";
import { ReviewState } from "@/types";
import { reviewAction } from "../actions/review.action";
import { mergePages } from "@/_utils/mergePages";

const initialState: ReviewState = {
	reviews: [],
	pagination: null,
	testimonials: [],
	testimonialsPagination: null,
	isLoadingTestimonials: false,
	isLoading: false,
	isSubmitting: false,
	error: null,
};

const reviewSlice = createSlice({
	name: "review",
	initialState,
	reducers: {
		clearReviews: (state) => {
			state.reviews = [];
			state.pagination = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(reviewAction.fetchItemReviewsAsync.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(reviewAction.fetchItemReviewsAsync.fulfilled, (state, action) => {
				state.isLoading = false;
				state.reviews = action.payload?.data?.items ?? [];
				state.pagination = action.payload?.data?.meta ?? null;
			})
			.addCase(reviewAction.fetchItemReviewsAsync.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
			})
			.addCase(reviewAction.fetchTestimonialsAsync.pending, (state) => {
				state.isLoadingTestimonials = true;
			})
			.addCase(reviewAction.fetchTestimonialsAsync.fulfilled, (state, action) => {
				state.isLoadingTestimonials = false;
				const meta = action.payload?.data?.meta ?? null;
				state.testimonials = mergePages(state.testimonials, action.payload?.data?.items ?? [], meta?.currentPage ?? 1);
				state.testimonialsPagination = meta;
			})
			.addCase(reviewAction.fetchTestimonialsAsync.rejected, (state) => {
				state.isLoadingTestimonials = false;
			})
			.addCase(reviewAction.submitReviewAsync.pending, (state) => {
				state.isSubmitting = true;
				state.error = null;
			})
			.addCase(reviewAction.submitReviewAsync.fulfilled, (state) => {
				state.isSubmitting = false;
			})
			.addCase(reviewAction.submitReviewAsync.rejected, (state, action) => {
				state.isSubmitting = false;
				state.error = action.payload as string;
			});
	},
});

export const { clearReviews } = reviewSlice.actions;
export default reviewSlice.reducer;
