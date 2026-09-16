import {ProductCategory,PaginatedProducts,UpdateCategoryPayload} from "@/types"
import {createAsyncThunk} from "@reduxjs/toolkit";
import axiosInstance from "@/_utils/axiosInstance"; // Import your axios instance

const fetchAllCategories = createAsyncThunk<
  PaginatedProducts,
  { page?: number; limit?: number; search?: string } | undefined,
  { rejectValue: string }
>(
  "products/fetchAll",
  async (args, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("products", {
        params: {
          page: args?.page ?? 1,
          limit: args?.limit ?? 50,
          ...(args?.search ? { search: args.search } : {}),
        },
      });

      return {
        items: response.data.data.items,
        meta: response.data.data.meta,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch categories"
      );
    }
  }
);



const createCategory = createAsyncThunk<
 ProductCategory,                     //[1] SUCCESS return type
  Omit<ProductCategory, "id">,        // [2] INPUT parameter type
  { rejectValue: string }             // [3] ERROR return type
>(
  "products/create",
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "products/create",
        categoryData
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create category"
      );
    }
  }
);


export const updateCategory = createAsyncThunk<
  ProductCategory,
  UpdateCategoryPayload,
  { rejectValue: string }
>(
  "products/update",
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(
        `products/update/${id}`,
        payload
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update category"
      );
    }
  }
);

const deleteCategory = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  "products/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`products/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete category"
      );
    }
  }
);

export const categoryAction = {
	fetchAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
};