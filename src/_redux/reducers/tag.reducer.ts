import { createSlice } from "@reduxjs/toolkit";

import { tagAction } from "../actions/tag.action";
import type { Tag } from "@/types";

interface TagState {
	tags: Tag[];
	/** Admin table: includes inactive tags, so kept separate from `tags`. */
	tableTags: Tag[];
	tableMeta: any;
	isFetchingTags: boolean;
	isSavingTag: boolean;
	error: string | null;
}

const initialState: TagState = {
	tags: [],
	tableTags: [],
	tableMeta: null,
	isFetchingTags: false,
	isSavingTag: false,
	error: null,
};

const tagSlice = createSlice({
	name: "tag",
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(tagAction.fetchTags.pending, (state) => {
				state.isFetchingTags = true;
			})
			.addCase(tagAction.fetchTags.fulfilled, (state, action) => {
				state.tags = action.payload ?? [];
				state.isFetchingTags = false;
			})
			.addCase(tagAction.fetchTags.rejected, (state, action) => {
				state.isFetchingTags = false;
				state.error = action.payload ?? "Failed to load tags";
			})

			.addCase(tagAction.fetchTagTable.pending, (state) => {
				state.isFetchingTags = true;
			})
			.addCase(tagAction.fetchTagTable.fulfilled, (state, action) => {
				state.tableTags = action.payload.items ?? [];
				state.tableMeta = action.payload.meta;
				state.isFetchingTags = false;
			})
			.addCase(tagAction.fetchTagTable.rejected, (state, action) => {
				state.isFetchingTags = false;
				state.error = action.payload ?? "Failed to load tags";
			})

			// Writes refetch rather than patching both lists in place — the
			// active list and the table list have different membership rules
			// (status), so reconciling them here would drift.
			.addCase(tagAction.createTag.pending, (state) => {
				state.isSavingTag = true;
			})
			.addCase(tagAction.createTag.fulfilled, (state) => {
				state.isSavingTag = false;
			})
			.addCase(tagAction.createTag.rejected, (state, action) => {
				state.isSavingTag = false;
				state.error = action.payload ?? "Failed to create tag";
			})
			.addCase(tagAction.updateTag.pending, (state) => {
				state.isSavingTag = true;
			})
			.addCase(tagAction.updateTag.fulfilled, (state) => {
				state.isSavingTag = false;
			})
			.addCase(tagAction.updateTag.rejected, (state, action) => {
				state.isSavingTag = false;
				state.error = action.payload ?? "Failed to update tag";
			});
	},
});

export default tagSlice.reducer;
