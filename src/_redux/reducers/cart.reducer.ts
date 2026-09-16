import { CartItem, CartState, Product } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { appConstants } from "../constants";
import {
	addToCartAsync,
	clearCartAsync,
	removeFromCartAsync,
	updateQuantityAsync,
	syncCartOnLoginAsync,
	fetchCartAsync,
	createCartAsync,
} from "../actions/cart.action";
import { logoutAsync } from "../actions/auth.action";
import { logout } from "./auth.reducer";

const initialState: CartState & { cartId: string | null } = {
	items: [],
	total: 0,
	loading: false,
	itemCount: 0,
	taxRate: 0.08,
	error: null,
	lastUpdated: null,
	appliedCoupons: [],
	discountAmount: 0,
	cartId: null,
};

const cartSlice = createSlice({
	name: "cart",
	initialState,
	reducers: {
		addToCart: (state, action: PayloadAction<Product>) => {
			const existingItem = state.items.find(
				(item) => item.id === action.payload.id
			);

			if (!existingItem) {
				state.items.push({
					...action.payload,
					quantity: 1,
					createdAt: Date.now(),
				});
			}

			cartSlice.caseReducers.calculateTotals(state);
			state.lastUpdated = Date.now();
		},
		removeFromCart: (state, action: PayloadAction<string>) => {
			state.items = state.items.filter((item) => item.id !== action.payload);
			cartSlice.caseReducers.calculateTotals(state);
		},
		updateQuantity: (
			state,
			action: PayloadAction<{ id: string; quantity: number }>
		) => {
			const item = state.items.find((item) => item.id === action.payload.id);
			if (item) {
				item.quantity = Math.min(action.payload.quantity, 99);
			}
			cartSlice.caseReducers.calculateTotals(state);
			state.lastUpdated = Date.now();
		},
		clearCart: (state) => {
			state.items = [];
			state.total = 0;
			state.itemCount = 0;
			state.discountAmount = 0;
			state.cartId = null;
			state.appliedCoupons = [];
			state.lastUpdated = Date.now();
		},
		calculateTotals: (state) => {
			state.itemCount = state.items?.length;
			// const subtotal = state.items.reduce(
			// 	(total, item) => total + item.price * item.quantity,
			// 	0
			// );
			state.total = state.items.reduce(
				(total, item) => total + item.price * item.quantity,
				0
			);
			// state.total = Math.max(0, subtotal - state.discountAmount);
		},
		applyCoupon: (
			state,
			action: PayloadAction<{ code: string; discount: number }>
		) => {
			const { code, discount } = action.payload;

			if (!state.appliedCoupons.includes(code)) {
				state.appliedCoupons.push(code);
				state.discountAmount += discount;
				cartSlice.caseReducers.calculateTotals(state);
				state.lastUpdated = Date.now();
			}
		},
		removeCoupon: (
			state,
			action: PayloadAction<{ code: string; discount: number }>
		) => {
			const { code, discount } = action.payload;
			const couponIndex = state.appliedCoupons.indexOf(code);

			if (couponIndex !== -1) {
				state.appliedCoupons.splice(couponIndex, 1);
				state.discountAmount = Math.max(0, state.discountAmount - discount);
				cartSlice.caseReducers.calculateTotals(state);
				state.lastUpdated = Date.now();
			}
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		// `loading` is a cart-level flag: it belongs to fetching/syncing the whole
		// cart, not to item mutations. Item mutations are applied optimistically
		// and already show a per-item spinner (useCartOperations' isUpdating), so
		// flipping the global flag here made the cart page swap itself for a
		// full-page loader on every quantity change — a full "refresh" that only
		// logged-in users saw, since guests never dispatch these thunks.

		// Add to cart async
		builder
			.addCase(addToCartAsync.pending, (state) => {
				state.error = null;
			})
			.addCase(addToCartAsync.fulfilled, (state, action) => {
				cartSlice.caseReducers.addToCart(state, action);
			})
			.addCase(addToCartAsync.rejected, (state, action) => {
				state.error = action.payload as string;
			});

		// Remove from cart async
		builder
			.addCase(removeFromCartAsync.pending, (state) => {
				state.error = null;
			})
			.addCase(removeFromCartAsync.fulfilled, (state, action) => {
				cartSlice.caseReducers.removeFromCart(state, action);
			})
			.addCase(removeFromCartAsync.rejected, (state, action) => {
				state.error = action.payload as string;
			});

		// Update quantity async
		builder
			.addCase(updateQuantityAsync.pending, (state) => {
				state.error = null;
			})
			.addCase(updateQuantityAsync.fulfilled, (state, action) => {
				cartSlice.caseReducers.updateQuantity(state, action);
			})
			.addCase(updateQuantityAsync.rejected, (state, action) => {
				state.error = action.payload as string;
			});

		// Clear cart async
		builder
			.addCase(clearCartAsync.pending, (state) => {
				state.error = null;
			})
			.addCase(clearCartAsync.fulfilled, (state) => {
				cartSlice.caseReducers.clearCart(state);
			})
			.addCase(clearCartAsync.rejected, (state, action) => {
				state.error = action.payload as string;
			});

		// Fetch cart
		builder
			.addCase(fetchCartAsync.fulfilled, (state, action) => {
				const cart = action.payload?.data;
				if (cart?.id) {
					state.cartId = cart.id;
				}
			});

		// Create (get-or-create) cart -- the id has to land in state, or the very
		// next add resolves the cart all over again.
		builder
			.addCase(createCartAsync.fulfilled, (state, action) => {
				const cart = action.payload?.data;
				if (cart?.id) {
					state.cartId = cart.id;
				}
			});

		// Sync cart on login
		builder
			.addCase(syncCartOnLoginAsync.pending, (state) => {
				state.loading = true;
			})
			.addCase(syncCartOnLoginAsync.fulfilled, (state, action) => {
				state.loading = false;
				if (action.payload) {
					state.cartId = action.payload.cartId;

					// Replace local state with server cart (source of truth)
					const backendItems = action.payload.items;
					state.items = Array.isArray(backendItems)
						? backendItems.map((bItem: any) => {
								const itemData = bItem.item || bItem;
								return {
									id: String(itemData.id || bItem.itemId),
									name: itemData.name || "",
									price: Number(itemData.price || 0),
									image: itemData.photos?.[0]?.url || "",
									category: itemData.product?.name || "",
									description: itemData.description || "",
									quantity: bItem.quantity || 1,
									inStock: (itemData.unit || 0) > 0,
									rating: itemData.ratingStats?.average || 0,
									reviews: itemData.ratingStats?.count || 0,
									weightValue: itemData.weightValue ?? null,
									weightUnit: itemData.weightUnit ?? null,
									createdAt: Date.now(),
								} as any;
							})
						: [];

					// Recalculate totals
					state.itemCount = state.items.length;
					state.total = state.items.reduce(
						(sum, item) => sum + item.price * item.quantity,
						0
					);
				} else {
					// Server returned no cart — clear local state
					state.items = [];
					state.cartId = null;
					state.itemCount = 0;
					state.total = 0;
				}
				state.lastUpdated = Date.now();
			})
			.addCase(syncCartOnLoginAsync.rejected, (state) => {
				state.loading = false;
			});

		// The cart is persisted to localStorage, so signing out used to leave
		// the previous session's items sitting there for whoever signed in
		// next -- on the same browser, or on this device while the real cart
		// moved on elsewhere. Dropping it here is what makes "sign out and
		// back in" a predictable reset.
		builder
			.addCase(logout, (state) => {
				cartSlice.caseReducers.clearCart(state);
			})
			.addCase(logoutAsync.fulfilled, (state) => {
				cartSlice.caseReducers.clearCart(state);
			});
	},
});

export const {
	addToCart,
	removeFromCart,
	updateQuantity,
	clearCart,
	calculateTotals,
	applyCoupon,
	removeCoupon,
	clearError,
} = cartSlice.actions;

export default cartSlice.reducer;

// export const selectCartSummary = (state: { cart: CartState }) => {
// 	const { total, taxRate, itemCount, freeShippingThreshold, discountAmount } =
// 		state.cart;
// 	const shipping = total > freeShippingThreshold ? 0 : 20000;
// 	const tax = Math.round(total * taxRate);
// 	const finalTotal = total + shipping + tax;
// 	const remainingForFreeShipping = Math.max(0, freeShippingThreshold - total);

// 	return {
// 		subtotal: total || 0,
// 		shipping,
// 		tax,
// 		finalTotal,
// 		itemCount,
// 		freeShippingThreshold,
// 		remainingForFreeShipping,
// 		hasQualifiedForFreeShipping: total > freeShippingThreshold,
// 	};
// };
