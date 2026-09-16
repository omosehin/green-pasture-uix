import { Product } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
	addToWishlistAsync,
	removeFromWishlistAsync,
	clearWishlistAsync,
	syncWishlistOnLoginAsync,
} from "../actions/wishlist.action";
import { logoutAsync } from "../actions/auth.action";
import { logout } from "./auth.reducer";

interface WishlistState {
	items: Product[];
	wishlistItemCount: number;
	loading: boolean;
	error: string | null;
}

const initialState: WishlistState = {
	items: [],
	wishlistItemCount: 0,
	loading: false,
	error: null,
};

const wishlistSlice = createSlice({
	name: "wishlist",
	initialState,
	reducers: {
		addToWishlist: (state, action: PayloadAction<Product>) => {
			const existingItem = state.items.find(
				(item) => item.id === action.payload.id
			);

			if (!existingItem) {
				state.items.push(action.payload);
				state.wishlistItemCount += 1;
			}
		},
		removeFromWishlist: (state, action: PayloadAction<string>) => {
			state.items = state.items.filter((item) => item.id !== action.payload);
			state.wishlistItemCount = state.items.length;
		},
		clearWishlist: (state) => {
			state.items = [];
			state.wishlistItemCount = 0;
		},
		toggleWishlist: (state, action: PayloadAction<Product>) => {
			const existingItem = state.items.find(
				(item) => item.id === action.payload.id
			);

			if (existingItem) {
				state.items = state.items.filter(
					(item) => item.id !== action.payload.id
				);
			} else {
				state.items.push(action.payload);
			}

			state.wishlistItemCount = state.items.length;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(addToWishlistAsync.pending, (state) => {
				state.error = null;
			})
			.addCase(addToWishlistAsync.fulfilled, (state, action) => {
				wishlistSlice.caseReducers.addToWishlist(state, action);
			})
			.addCase(addToWishlistAsync.rejected, (state, action) => {
				state.error = action.payload as string;
			});

		builder
			.addCase(removeFromWishlistAsync.pending, (state) => {
				state.error = null;
			})
			.addCase(removeFromWishlistAsync.fulfilled, (state, action) => {
				wishlistSlice.caseReducers.removeFromWishlist(state, action);
			})
			.addCase(removeFromWishlistAsync.rejected, (state, action) => {
				state.error = action.payload as string;
			});

		builder
			.addCase(clearWishlistAsync.pending, (state) => {
				state.error = null;
			})
			.addCase(clearWishlistAsync.fulfilled, (state) => {
				wishlistSlice.caseReducers.clearWishlist(state);
			})
			.addCase(clearWishlistAsync.rejected, (state, action) => {
				state.error = action.payload as string;
			});

		builder
			.addCase(syncWishlistOnLoginAsync.pending, (state) => {
				state.loading = true;
			})
			.addCase(syncWishlistOnLoginAsync.fulfilled, (state, action) => {
				state.loading = false;
				state.items = action.payload;
				state.wishlistItemCount = action.payload.length;
			})
			.addCase(syncWishlistOnLoginAsync.rejected, (state) => {
				state.loading = false;
			});

		// Persisted like the cart, and cleared on sign-out for the same reason.
		builder
			.addCase(logout, (state) => {
				wishlistSlice.caseReducers.clearWishlist(state);
			})
			.addCase(logoutAsync.fulfilled, (state) => {
				wishlistSlice.caseReducers.clearWishlist(state);
			});
	},
});

export const {
	addToWishlist,
	removeFromWishlist,
	clearWishlist,
	toggleWishlist,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
