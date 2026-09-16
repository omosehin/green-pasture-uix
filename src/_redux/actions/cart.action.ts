import { CartState, Product } from "@/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/_utils/axiosInstance";
import { extractErrorMessage } from "@/_utils/apiHelpers";

interface RootState {
	cart: CartState & { cartId: string | null };
	auth: { isAuthenticated: boolean; user: any };
}

export const fetchCartAsync = createAsyncThunk<
	any,
	void,
	{ rejectValue: string }
>("cart/fetchCart", async (_, { rejectWithValue }) => {
	try {
		const response = await axiosInstance.get("cart/mine");
		return response.data;
	} catch (error: any) {
		return rejectWithValue(extractErrorMessage(error));
	}
});

export const fetchCartItemsAsync = createAsyncThunk<
	any,
	string,
	{ rejectValue: string }
>("cart/fetchCartItems", async (cartId, { rejectWithValue }) => {
	try {
		const response = await axiosInstance.get(`cart-item/${cartId}`);
		return response.data;
	} catch (error: any) {
		return rejectWithValue(extractErrorMessage(error));
	}
});

export const createCartAsync = createAsyncThunk<
	any,
	void,
	{ rejectValue: string }
>("cart/createCart", async (_, { rejectWithValue }) => {
	try {
		const response = await axiosInstance.post("cart/create");
		return response.data;
	} catch (error: any) {
		return rejectWithValue(extractErrorMessage(error));
	}
});

export const addToCartAsync = createAsyncThunk(
	"cart/addToCartAsync",
	async (product: Product, { rejectWithValue, getState, dispatch }) => {
		try {
			if (!product.id || !product.name || !product.price) {
				throw new Error("Invalid product data");
			}

			const state = getState() as RootState;

			if (state.auth.isAuthenticated) {
				// Resolve the cart rather than giving up when we have no id yet.
				// Skipping the write on a null cartId meant a signed-in customer
				// who added from a product card before ever opening /cart wrote
				// nothing to the server -- the item lived in localStorage only,
				// and the next cart sync replaced it with the empty server cart.
				// POST /cart/create returns the existing cart when there is one,
				// so it is get-or-create, not a duplicate.
				let cartId = state.cart.cartId;
				if (!cartId) {
					const created = await dispatch(createCartAsync()).unwrap();
					cartId = created?.data?.id ?? null;
				}
				if (cartId) {
					await axiosInstance.post("cart-item/create", {
						cartId,
						itemId: product.id,
						quantity: 1,
					});
				}
			}

			return product;
		} catch (error) {
			return rejectWithValue(
				error instanceof Error
					? error.message
					: "Failed to add item to cart"
			);
		}
	}
);

export const removeFromCartAsync = createAsyncThunk(
	"cart/removeFromCartAsync",
	async (productId: string, { rejectWithValue, getState }) => {
		try {
			const state = getState() as RootState;

			if (state.auth.isAuthenticated && state.cart.cartId) {
				await axiosInstance.delete("cart-item/remove", {
					data: {
						cartId: state.cart.cartId,
						itemId: productId,
					},
				});
			}

			return productId;
		} catch (error) {
			return rejectWithValue(
				error instanceof Error
					? error.message
					: "Failed to remove item from cart"
			);
		}
	}
);

export const updateQuantityAsync = createAsyncThunk(
	"cart/updateQuantityAsync",
	async (
		{ id, quantity }: { id: string; quantity: number },
		{ rejectWithValue, getState }
	) => {
		try {
			if (quantity < 0) throw new Error("Quantity cannot be negative");
			if (quantity > 99) throw new Error("Maximum quantity is 99");

			const state = getState() as RootState;

			if (state.auth.isAuthenticated && state.cart.cartId) {
				await axiosInstance.patch("cart-item/update", {
					cartId: state.cart.cartId,
					itemId: id,
					quantity,
				});
			}

			return { id, quantity };
		} catch (error) {
			return rejectWithValue(
				error instanceof Error
					? error.message
					: "Failed to update quantity"
			);
		}
	}
);

export const clearCartAsync = createAsyncThunk(
	"cart/clearCartAsync",
	async (_, { rejectWithValue, getState }) => {
		try {
			const state = getState() as RootState;

			if (state.auth.isAuthenticated) {
				await axiosInstance.delete("cart/clear");
			}

			return true;
		} catch (error) {
			return rejectWithValue(
				error instanceof Error ? error.message : "Failed to clear cart"
			);
		}
	}
);

/**
 * Pulls the server cart down and makes it local state.
 *
 * `mergeLocal` is the login transition ONLY: local items accumulated while
 * signed out are genuinely new and have to be pushed up first. On an
 * already-authenticated visit it must stay false -- every local item there
 * already came from the server, so pushing them back up resurrects lines the
 * customer deleted on another device (and re-adds the whole cart after a
 * checkout emptied it server-side).
 */
export const syncCartOnLoginAsync = createAsyncThunk<
	any,
	boolean | void,
	{ rejectValue: string }
>(
	"cart/syncOnLogin",
	async (mergeLocal, { rejectWithValue, getState }) => {
		try {
			const state = getState() as RootState;
			const localItems = mergeLocal ? state.cart.items : [];

			// Try to fetch the existing cart. GET cart/mine answers 200 with a
			// null body when the customer has no cart row yet -- it does not
			// 404 -- so a missing cart has to be detected from the payload, not
			// from a thrown error. Creating one only in the catch meant a
			// first-time login found no cart, pushed nothing, and wiped the
			// items the customer had added while signed out.
			let cartData: any;
			try {
				const cartRes = await axiosInstance.get("cart/mine");
				cartData = cartRes.data?.data;
			} catch {
				cartData = null;
			}
			if (!cartData?.id) {
				const createRes = await axiosInstance.post("cart/create");
				cartData = createRes.data?.data;
			}

			if (!cartData?.id) return null;

			// Push any local-only items to the backend cart
			for (const item of localItems) {
				try {
					await axiosInstance.post("cart-item/create", {
						cartId: cartData.id,
						itemId: item.id,
						quantity: item.quantity,
					});
				} catch {
					// Item may already exist in cart, skip
				}
			}

			// Fetch the full cart from backend — this is the source of truth
			const itemsRes = await axiosInstance.get(
				`cart-item/${cartData.id}`
			);

			return {
				cartId: cartData.id,
				items: itemsRes.data?.data ?? [],
			};
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

export const cartAction = {
	fetchCartAsync,
	fetchCartItemsAsync,
	createCartAsync,
	addToCartAsync,
	removeFromCartAsync,
	updateQuantityAsync,
	clearCartAsync,
	syncCartOnLoginAsync,
};
