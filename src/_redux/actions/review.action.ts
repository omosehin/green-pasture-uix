import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/_utils/axiosInstance";
import { extractErrorMessage } from "@/_utils/apiHelpers";

/** Item-scoped on a product page; unscoped (no itemId) for the admin moderation table. */
const fetchItemReviewsAsync = createAsyncThunk<any, { itemId?: string; page?: number; limit?: number; search?: string }, { rejectValue: string }>(
	"review/fetchItemReviews",
	async ({ itemId, page = 1, limit = 10, search }, { rejectWithValue }) => {
		try {
			const response = await axiosInstance.get(
				`reviews?page=${page}&limit=${limit}${itemId ? `&itemId=${itemId}` : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}`
			);
			return response.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

const submitReviewAsync = createAsyncThunk<any, { rating: number; comment?: string; itemId: string }, { rejectValue: string }>(
	"review/submitReview",
	async (payload, { rejectWithValue }) => {
		try {
			const response = await axiosInstance.post("reviews", payload);
			return response.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

/**
 * Public testimonials: active, 4-star-plus, and only ones that actually say
 * something. Pass an itemId to scope them to a single product.
 */
const fetchTestimonialsAsync = createAsyncThunk<
	any,
	{ page?: number; limit?: number; itemId?: string; featured?: boolean } | void,
	{ rejectValue: string }
>(
	"review/fetchTestimonials",
	async (args, { rejectWithValue }) => {
		const { page = 1, limit = 6, itemId, featured } = args || {};
		try {
			const response = await axiosInstance.get(
				`reviews?filter=ACTIVE&minRating=4&withComment=true&page=${page}&limit=${limit}` +
					`${itemId ? `&itemId=${itemId}` : ""}${featured ? "&featured=true" : ""}`
			);
			return response.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

/** Moderator curation: which quotes the marketing pages lead with. */
const setReviewFeaturedAsync = createAsyncThunk<any, { ids: string[]; featured: boolean }, { rejectValue: string }>(
	"review/setFeatured",
	async ({ ids, featured }, { rejectWithValue }) => {
		try {
			const response = await axiosInstance.post(featured ? "reviews/feature" : "reviews/unfeature", { ids });
			return response.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

export const reviewAction = { fetchItemReviewsAsync, submitReviewAsync, fetchTestimonialsAsync, setReviewFeaturedAsync };
