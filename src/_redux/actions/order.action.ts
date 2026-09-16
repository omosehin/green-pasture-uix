import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/_utils/axiosInstance";
import { extractErrorMessage, buildPaginationParams } from "@/_utils/apiHelpers";

const fetchMyOrdersAsync = createAsyncThunk<any, { page?: number; limit?: number }, { rejectValue: string }>(
	"order/fetchMyOrders",
	async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
		try {
			const params = buildPaginationParams(page, limit);
			const response = await axiosInstance.get(`order/my-orders?${params}`);
			return response.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

const fetchMyOrderDetailAsync = createAsyncThunk<any, string, { rejectValue: string }>(
	"order/fetchMyOrderDetail",
	async (orderReference, { rejectWithValue }) => {
		try {
			const response = await axiosInstance.get(`order/my-orders/ref/${orderReference}`);
			return response.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

export const orderAction = { fetchMyOrdersAsync, fetchMyOrderDetailAsync };
