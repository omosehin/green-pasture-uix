import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/_utils/axiosInstance";
import { extractErrorMessage } from "@/_utils/apiHelpers";

const fetchDashboardAnalytics = createAsyncThunk<
	any,
	void,
	{ rejectValue: string }
>("analytics/fetchDashboard", async (_, { rejectWithValue }) => {
	try {
		const response = await axiosInstance.get("analytics/dashboard");
		return response.data;
	} catch (error: any) {
		return rejectWithValue(extractErrorMessage(error));
	}
});

export const analyticsAction = { fetchDashboardAnalytics };
