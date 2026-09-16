import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/_utils/axiosInstance";
import { extractErrorMessage, buildPaginationParams } from "@/_utils/apiHelpers";

const fetchOrdersAsync = createAsyncThunk<any, { page?: number; limit?: number; search?: string; filter?: string }, { rejectValue: string }>(
	"admin/fetchOrders",
	async ({ page = 1, limit = 50, search, filter } = {}, { rejectWithValue }) => {
		try {
			const params = buildPaginationParams(page, limit, search, filter);
			const response = await axiosInstance.get(`order?${params}`);
			return response.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

const cancelOrderAsync = createAsyncThunk<any, string, { rejectValue: string }>(
	"admin/cancelOrder",
	async (orderId, { rejectWithValue }) => {
		try {
			const response = await axiosInstance.patch(`order/admin/cancel/${orderId}`);
			return { ...response.data, orderId };
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

const fetchCustomersAsync = createAsyncThunk<any, { page?: number; limit?: number; search?: string; filter?: string }, { rejectValue: string }>(
	"admin/fetchCustomers",
	async ({ page = 1, limit = 50, search, filter } = {}, { rejectWithValue }) => {
		try {
			const params = buildPaginationParams(page, limit, search, filter);
			const response = await axiosInstance.get(`customers?${params}`);
			return response.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

const fetchStaffAsync = createAsyncThunk<any, { page?: number; limit?: number; search?: string; filter?: string }, { rejectValue: string }>(
	"admin/fetchStaff",
	async ({ page = 1, limit = 50, search, filter } = {}, { rejectWithValue }) => {
		try {
			const params = buildPaginationParams(page, limit, search, filter);
			const response = await axiosInstance.get(`staff?${params}`);
			return response.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

const updateStaffAsync = createAsyncThunk<any, { id: string; data: any }, { rejectValue: string }>(
	"admin/updateStaff",
	async ({ id, data }, { rejectWithValue }) => {
		try {
			const response = await axiosInstance.patch(`staff/${id}`, data);
			return response.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

const deleteCustomerAsync = createAsyncThunk<any, string, { rejectValue: string }>(
	"admin/deleteCustomer",
	async (id, { rejectWithValue }) => {
		try {
			const response = await axiosInstance.delete(`customers/${id}`);
			return { ...response.data, customerId: id };
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

const updateCustomerStatusAsync = createAsyncThunk<any, { id: string; activate: boolean }, { rejectValue: string }>(
	"admin/updateCustomerStatus",
	async ({ id, activate }, { rejectWithValue }) => {
		try {
			const endpoint = activate ? "customers/activate" : "customers/deactivate";
			const response = await axiosInstance.patch(endpoint, { ids: [id] });
			return { ...response.data, customerId: id, activate };
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

const updateStaffStatusAsync = createAsyncThunk<any, { id: string; activate: boolean }, { rejectValue: string }>(
	"admin/updateStaffStatus",
	async ({ id, activate }, { rejectWithValue }) => {
		try {
			const endpoint = activate ? "staff/activate" : "staff/deactivate";
			const response = await axiosInstance.patch(endpoint, { ids: [id] });
			return { ...response.data, staffId: id, activate };
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

const deleteStaffAsync = createAsyncThunk<any, string, { rejectValue: string }>(
	"admin/deleteStaff",
	async (id, { rejectWithValue }) => {
		try {
			const response = await axiosInstance.delete(`staff/${id}`);
			return { ...response.data, staffId: id };
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

const updateItemStatusAsync = createAsyncThunk<any, { id: string; activate: boolean }, { rejectValue: string }>(
	"admin/updateItemStatus",
	async ({ id, activate }, { rejectWithValue }) => {
		try {
			const endpoint = activate ? "items/activate" : "items/deactivate";
			const response = await axiosInstance.patch(endpoint, { ids: [id] });
			return { ...response.data, itemId: id, activate };
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

/**
 * Storefront visibility. Distinct from updateItemStatusAsync, which is the
 * record's lifecycle — a product can be an active record that is not published.
 */
const updateItemPublishedAsync = createAsyncThunk<any, { id: string; publish: boolean }, { rejectValue: string }>(
	"admin/updateItemPublished",
	async ({ id, publish }, { rejectWithValue }) => {
		try {
			const endpoint = publish ? "items/publish" : "items/unpublish";
			const response = await axiosInstance.patch(endpoint, { ids: [id] });
			return { ...response.data, itemId: id, publish };
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

const fetchAdminItemsAsync = createAsyncThunk<any, { page?: number; limit?: number; search?: string; filter?: string }, { rejectValue: string }>(
	"admin/fetchAdminItems",
	async ({ page = 1, limit = 50, search, filter } = {}, { rejectWithValue }) => {
		try {
			const params = buildPaginationParams(page, limit, search, filter);
			const response = await axiosInstance.get(`items?${params}`);
			return response.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

export const adminAction = { fetchOrdersAsync, cancelOrderAsync, fetchCustomersAsync, deleteCustomerAsync, updateCustomerStatusAsync, fetchStaffAsync, updateStaffAsync, updateStaffStatusAsync, deleteStaffAsync, fetchAdminItemsAsync, updateItemStatusAsync, updateItemPublishedAsync };
