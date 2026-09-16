import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/_utils/axiosInstance";
import { extractErrorMessage } from "@/_utils/apiHelpers";

const fetchProfileAsync = createAsyncThunk<any, void, { rejectValue: string }>(
	"profile/fetch",
	async (_, { rejectWithValue }) => {
		try {
			const res = await axiosInstance.get("profile");
			return res.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

const updateProfileAsync = createAsyncThunk<any, { firstName?: string; lastName?: string; phoneNumber?: string; gender?: string }, { rejectValue: string }>(
	"profile/update",
	async (payload, { rejectWithValue }) => {
		try {
			const res = await axiosInstance.patch("profile", payload);
			return res.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

const uploadProfilePictureAsync = createAsyncThunk<any, FormData, { rejectValue: string }>(
	"profile/uploadPicture",
	async (formData, { rejectWithValue }) => {
		try {
			const res = await axiosInstance.patch("profile/picture", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			return res.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

const deleteProfilePictureAsync = createAsyncThunk<any, void, { rejectValue: string }>(
	"profile/deletePicture",
	async (_, { rejectWithValue }) => {
		try {
			const res = await axiosInstance.delete("profile/picture");
			return res.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

export const profileAction = { fetchProfileAsync, updateProfileAsync, uploadProfilePictureAsync, deleteProfilePictureAsync };
