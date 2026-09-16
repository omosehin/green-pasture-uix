import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { productsAction } from "../actions";
import { Product, ProductsState } from "@/types";
import { categoryAction } from "../actions/category.action";

// Transform API response to Product type
const transformApiProduct = (item: any): Product => {
	return {
		id: String(item.id),
		name: item.name || "",
		price: Number(item.price || 0),
		originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
		image: item.photos?.[0]?.url || item.image || "",
		category: item.product?.name || item.category || "",
		description: item.description || "",
		quantity: Number(item.unit || item.quantity || 0),
		inStock: (item.unit || item.quantity || 0) > 0,
		rating: item.ratingStats?.average || item.rating || 0,
		reviews: item.ratingStats?.count || item.reviews || 0,
	};
};

const initialState: ProductsState = {
	isFetchingAllProducts: false,
	isFetchingProduct: false,
	fetchAllProductsError: null,
	products: [],
	product: null,
	categories: ["All"],
	selectedCategory: "All",
	searchTerm: "",
};

const productsSlice = createSlice({
	name: "product",
	initialState,
	reducers: {
		setSelectedCategory: (state, action) => {
			state.selectedCategory = action.payload;
		},
		setSearchTerm: (state, action) => {
			state.searchTerm = action.payload;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(productsAction.fetchAllProducts.pending, (state) => {
				state.isFetchingAllProducts = true;
				state.fetchAllProductsError = null;
			})
			.addCase(
				productsAction.fetchAllProducts.fulfilled,
				(state, action: PayloadAction<Product[]>) => {
					// Transform API response items to Product type
					state.products = action.payload.map(item =>
						typeof item.name === 'undefined' ? transformApiProduct(item as any) : item
					);
					state.isFetchingAllProducts = false;
					state.fetchAllProductsError = null;
				}
			)
			.addCase(productsAction.fetchAllProducts.rejected, (state, action) => {
				state.isFetchingAllProducts = false;
				state.fetchAllProductsError = (action.payload as string) || "Failed to load products";
			})
			// Fetch Item By Id
			.addCase(
				productsAction.fetchItemByIdAsync.fulfilled,
				(state, action) => {
					state.product = action.payload?.data ?? null;
				}
			)
			// Delete Item
			.addCase(
				productsAction.deleteItemAsync.fulfilled,
				(state, action) => {
					const deletedId = action.payload.itemId;
					state.products = state.products.filter(
						(p) => String(p.id) !== String(deletedId)
					);
				}
			)
			// Create Item
			.addCase(
				productsAction.createItemAsync.fulfilled,
				(state, action) => {
					const newProductData = action.payload?.data || action.payload;
					if (newProductData) {
						// Transform API response to Product type
						const newProduct = typeof newProductData.name === 'undefined' 
							? transformApiProduct(newProductData) 
							: newProductData;
						
						// Check if product already exists (avoid duplicates)
						const exists = state.products.some(p => String(p.id) === String(newProduct.id));
						if (!exists) {
							state.products.unshift(newProduct); // Add to beginning of array
						}
					}
				}
			)
			// Update Item
			.addCase(
				productsAction.updateItemAsync.fulfilled,
				(state, action) => {
					const updatedProductData = action.payload?.data || action.payload;
					if (updatedProductData) {
						// Transform API response to Product type
						const updatedProduct = typeof updatedProductData.name === 'undefined' 
							? transformApiProduct(updatedProductData) 
							: updatedProductData;
						
						const index = state.products.findIndex(p => String(p.id) === String(updatedProduct.id || updatedProductData.itemId));
						if (index !== -1) {
							state.products[index] = updatedProduct;
						}
					}
				}
			)
			// Categories come exclusively from the category API; "All" is the
			// UI sentinel for "no category filter".
			.addCase(
				categoryAction.fetchAllCategories.fulfilled,
				(state, action: PayloadAction<any>) => {
					const items = action.payload?.items ?? [];
					if (items.length > 0) {
						const names = items.map((c: any) => c.name);
						state.categories = [
							"All",
							...names.sort(),
						];
					}
				}
			);
	},
});

export const { setSelectedCategory, setSearchTerm } = productsSlice.actions;

export default productsSlice.reducer;
