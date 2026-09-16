import { Product } from "@/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/_utils/axiosInstance";
import { extractErrorMessage } from "@/_utils/apiHelpers";

const fetchAllProducts = createAsyncThunk<Product[], { activeOnly?: boolean } | undefined>(
	"product/fetchAll",
	async (args, { rejectWithValue }) => {
		try {
			// `published`, not `filter=A`: status is the record's lifecycle,
			// publishing is the editorial decision about storefront visibility.
			const url = args?.activeOnly
				? "/items?page=1&limit=100&published=true"
				: "/items?page=1&limit=100";
			const response = await axiosInstance.get(url);
			return response.data?.data?.items ?? [];
		} catch (error: any) {
			return rejectWithValue(
				error.response?.data?.message || "Failed to fetch products"
			);
		}
	}
);

const fetchItemByIdAsync = createAsyncThunk<any, string, { rejectValue: string }>(
	"product/fetchItemById",
	async (id, { rejectWithValue }) => {
		try {
			const res = await axiosInstance.get(`items/${id}`);
			return res.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

const createItemAsync = createAsyncThunk<any, FormData, { rejectValue: string }>(
	"product/createItem",
	async (formData, { rejectWithValue }) => {
		try {
			const res = await axiosInstance.post("items", formData, { headers: { "Content-Type": "multipart/form-data" } });
			return res.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

const updateItemAsync = createAsyncThunk<any, { id: string; data: any }, { rejectValue: string }>(
	"product/updateItem",
	async ({ id, data }, { rejectWithValue }) => {
		try {
			const res = await axiosInstance.patch(`items/${id}`, data);
			return { ...res.data, itemId: id };
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

const deleteItemAsync = createAsyncThunk<any, string, { rejectValue: string }>(
	"product/deleteItem",
	async (id, { rejectWithValue }) => {
		try {
			const res = await axiosInstance.delete(`items/${id}`);
			return { ...res.data, itemId: id };
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

const addItemImagesAsync = createAsyncThunk<any, { id: string; formData: FormData }, { rejectValue: string }>(
	"product/addItemImages",
	async ({ id, formData }, { rejectWithValue }) => {
		try {
			const res = await axiosInstance.post(`items/${id}/images`, formData, { headers: { "Content-Type": "multipart/form-data" } });
			return res.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

const deleteItemImageAsync = createAsyncThunk<any, { itemId: string; imageId: string }, { rejectValue: string }>(
	"product/deleteItemImage",
	async ({ itemId, imageId }, { rejectWithValue }) => {
		try {
			const res = await axiosInstance.delete(`items/${itemId}/images/${imageId}`);
			return { ...res.data, itemId, imageId };
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

export const productsAction = {
	fetchAllProducts,
	fetchItemByIdAsync,
	createItemAsync,
	updateItemAsync,
	deleteItemAsync,
	addItemImagesAsync,
	deleteItemImageAsync,
};
