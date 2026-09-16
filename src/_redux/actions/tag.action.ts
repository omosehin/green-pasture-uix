import { createAsyncThunk } from "@reduxjs/toolkit";

import axiosInstance from "@/_utils/axiosInstance";
import { extractErrorMessage } from "@/_utils/apiHelpers";
import type { Tag } from "@/types";

/** Active tags — the storefront filter and the admin assign control. Public. */
const fetchTags = createAsyncThunk<Tag[], void, { rejectValue: string }>(
	"tag/fetchAll",
	async (_, { rejectWithValue }) => {
		try {
			const res = await axiosInstance.get("tags");
			return res.data?.data ?? [];
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

/** Admin table — every tag regardless of status. */
const fetchTagTable = createAsyncThunk<
	{ items: Tag[]; meta: any },
	{ page?: number; limit?: number; search?: string } | undefined,
	{ rejectValue: string }
>("tag/fetchTable", async (args, { rejectWithValue }) => {
	try {
		const res = await axiosInstance.get("tags/table", {
			params: {
				page: args?.page ?? 1,
				limit: args?.limit ?? 50,
				...(args?.search ? { search: args.search } : {}),
			},
		});
		return { items: res.data?.data?.items ?? [], meta: res.data?.data?.meta };
	} catch (error: any) {
		return rejectWithValue(extractErrorMessage(error));
	}
});

const createTag = createAsyncThunk<Tag, { name: string; description?: string }, { rejectValue: string }>(
	"tag/create",
	async (payload, { rejectWithValue }) => {
		try {
			const res = await axiosInstance.post("tags", payload);
			return res.data?.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

const updateTag = createAsyncThunk<Tag, { id: string; name?: string; description?: string }, { rejectValue: string }>(
	"tag/update",
	async ({ id, ...payload }, { rejectWithValue }) => {
		try {
			const res = await axiosInstance.patch(`tags/${id}`, payload);
			return res.data?.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

const setTagStatus = createAsyncThunk<{ id: string; activate: boolean }, { id: string; activate: boolean }, { rejectValue: string }>(
	"tag/setStatus",
	async ({ id, activate }, { rejectWithValue }) => {
		try {
			await axiosInstance.patch(`tags/${id}/status`, { activate });
			return { id, activate };
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

const deleteTag = createAsyncThunk<string, string, { rejectValue: string }>(
	"tag/delete",
	async (id, { rejectWithValue }) => {
		try {
			await axiosInstance.delete(`tags/${id}`);
			return id;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

export const tagAction = {
	fetchTags,
	fetchTagTable,
	createTag,
	updateTag,
	setTagStatus,
	deleteTag,
};
