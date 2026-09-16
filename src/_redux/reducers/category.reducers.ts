import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { categoryAction } from "../actions/category.action";
import { CategoriesState, ProductCategory,PaginatedProducts } from "@/types";

const initialState: CategoriesState = {
  isFetchingAllCategories: false,
  isFetchingCategory: false,
  isCreatingCategory: false,
  isUpdatingCategory: false,
  isDeletingCategory:false,
  productCategories: [],
  selectedCategory: "All",
  searchTerm: "",
  error: null,
};


const productCategoriesSlice = createSlice({
    name: "category",
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
            .addCase(categoryAction.fetchAllCategories.pending, (state) => {
                state.isFetchingAllCategories = true;
            })
            .addCase(
                categoryAction.fetchAllCategories.fulfilled,
                (state, action: PayloadAction<PaginatedProducts>) => {
                state.productCategories = action.payload.items;
                state.pagination = action.payload.meta;
                state.isFetchingAllCategories = false;
                }
            )
            .addCase(categoryAction.fetchAllCategories.rejected, (state,action) => {
                state.isFetchingAllCategories = false;
                state.error = action.payload ?? "failed to fetch";
            })
            .addCase(categoryAction.createCategory.pending, (state) => {
                state.isCreatingCategory = true;
                state.error = null;
            })
            .addCase(
                categoryAction.createCategory.fulfilled,
                (state, action: PayloadAction<ProductCategory>) => {
                    state.productCategories.push(action.payload);
                    state.isCreatingCategory = false;
                }
            )
            .addCase(categoryAction.createCategory.rejected, (state, action) => {
                state.isCreatingCategory = false;
                state.error = action.payload ?? "Failed to create category";
            })
            //updating
            .addCase(categoryAction.updateCategory.pending, (state) => {
            state.isUpdatingCategory = true;
            state.error = null;
            })
            .addCase(
                categoryAction.updateCategory.fulfilled,
                (state, action: PayloadAction<ProductCategory>) => {
                    const index = state.productCategories.findIndex(
                    (cat) => cat.id === action.payload.id
                    );

                    if (index !== -1) {
                    state.productCategories[index] = action.payload;
                    }

                    state.isUpdatingCategory = false;
                }
            )
            .addCase(categoryAction.updateCategory.rejected, (state, action) => {
            state.isUpdatingCategory = false;
            state.error = action.payload ?? "Failed to create category";
            }) 
            // Delete category
            .addCase(categoryAction.deleteCategory.pending, (state) => {
                state.isDeletingCategory = true;
                state.error = null;
            })
            .addCase(
                categoryAction.deleteCategory.fulfilled,
                (state, action: PayloadAction<string>) => {
                    state.productCategories = state.productCategories.filter(
                        (cat) => cat.id !== action.payload
                    );
                    state.isDeletingCategory = false;
                }
            )
            .addCase(categoryAction.deleteCategory.rejected, (state, action) => {
                state.isDeletingCategory = false;
                state.error = action.payload ?? "Failed to delete category";
            });
    },
});

export const { setSelectedCategory, setSearchTerm } = productCategoriesSlice.actions;

export default productCategoriesSlice.reducer;
