import { Product } from "@/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/_utils/axiosInstance";
import { extractErrorMessage } from "@/_utils/apiHelpers";
import { mapBackendItemToProduct } from "@/_utils/transformBackendItem";

interface RootState {
	wishlist: { items: Product[] };
	auth: { isAuthenticated: boolean; user: any };
}

export const addToWishlistAsync = createAsyncThunk(
	"wishlist/addToWishlistAsync",
	async (product: Product, { rejectWithValue, getState }) => {
		try {
			const state = getState() as RootState;

			if (state.auth.isAuthenticated) {
				await axiosInstance.post("wishlist/items", { itemId: product.id });
			}

			return product;
		} catch (error) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

export const removeFromWishlistAsync = createAsyncThunk(
	"wishlist/removeFromWishlistAsync",
	async (itemId: string, { rejectWithValue, getState }) => {
		try {
			const state = getState() as RootState;

			if (state.auth.isAuthenticated) {
				await axiosInstance.delete(`wishlist/items/${itemId}`);
			}

			return itemId;
		} catch (error) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

export const clearWishlistAsync = createAsyncThunk(
	"wishlist/clearWishlistAsync",
	async (_, { rejectWithValue, getState }) => {
		try {
			const state = getState() as RootState;

			if (state.auth.isAuthenticated) {
				await axiosInstance.delete("wishlist/clear");
			}

			return true;
		} catch (error) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

/**
 * `mergeLocal` is the login transition ONLY -- same rule as the cart: local
 * items are only "new" when they were collected while signed out. Pushing them
 * up on an already-authenticated visit resurrects items the customer removed
 * on another device.
 */
export const syncWishlistOnLoginAsync = createAsyncThunk<
	Product[],
	boolean | void,
	{ rejectValue: string }
>(
	"wishlist/syncOnLogin",
	async (mergeLocal, { rejectWithValue, getState }) => {
		try {
			const state = getState() as RootState;
			const localItems = mergeLocal ? state.wishlist.items : [];

			// Fetch what's already on the backend FIRST — this call runs on every
			// login and every /wishlist page visit, so re-POSTing items already
			// there on every one of those (as this used to do) burns through the
			// write rate limit on pure no-ops. Only the genuinely new, local-only
			// items get pushed.
			// page/limit are required (not @IsOptional) on the backend's shared
			// PaginationDto — every other listing call in this codebase sends
			// them explicitly (see products.action.ts) rather than relying on a
			// server-side default that doesn't exist.
			const existingRes = await axiosInstance.get("wishlist?page=1&limit=100");
			const existingRows = existingRes.data?.data?.items ?? [];
			const existingIds = new Set(existingRows.map((row: any) => String((row.item ?? row).id)));
			const newLocalItems = localItems.filter((item) => !existingIds.has(String(item.id)));

			if (newLocalItems.length === 0) {
				return existingRows.map((row: any) => mapBackendItemToProduct(row.item ?? row));
			}

			for (const item of newLocalItems) {
				try {
					await axiosInstance.post("wishlist/items", { itemId: item.id });
				} catch {
					// Item may already be wishlisted, skip
				}
			}

			// Fetch the full wishlist from backend — this is the source of truth.
			const res = await axiosInstance.get("wishlist?page=1&limit=100");
			const rows = res.data?.data?.items ?? [];

			return rows.map((row: any) => mapBackendItemToProduct(row.item ?? row));
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

export const wishlistAction = {
	addToWishlistAsync,
	removeFromWishlistAsync,
	clearWishlistAsync,
	syncWishlistOnLoginAsync,
};
