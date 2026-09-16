import { createSlice } from "@reduxjs/toolkit";
import { ProfileState } from "@/types";
import { profileAction } from "../actions/profile.action";

const initialState: ProfileState = {
	profile: null,
	isLoading: false,
	isUpdating: false,
	error: null,
};

const profileSlice = createSlice({
	name: "profile",
	initialState,
	reducers: {
		clearProfile: (state) => {
			state.profile = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch profile
			.addCase(profileAction.fetchProfileAsync.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(profileAction.fetchProfileAsync.fulfilled, (state, action) => {
				state.isLoading = false;
				state.profile = action.payload?.data ?? null;
			})
			.addCase(profileAction.fetchProfileAsync.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
			})
			// Update profile
			.addCase(profileAction.updateProfileAsync.pending, (state) => {
				state.isUpdating = true;
				state.error = null;
			})
			.addCase(profileAction.updateProfileAsync.fulfilled, (state, action) => {
				state.isUpdating = false;
				if (state.profile && action.payload?.data) {
					state.profile = { ...state.profile, ...action.payload.data };
				}
			})
			.addCase(profileAction.updateProfileAsync.rejected, (state, action) => {
				state.isUpdating = false;
				state.error = action.payload as string;
			})
			// Upload profile picture
			.addCase(profileAction.uploadProfilePictureAsync.pending, (state) => {
				state.isUpdating = true;
				state.error = null;
			})
			.addCase(profileAction.uploadProfilePictureAsync.fulfilled, (state, action) => {
				state.isUpdating = false;
				if (state.profile) {
					state.profile.profileImage = action.payload?.data ?? null;
				}
			})
			.addCase(profileAction.uploadProfilePictureAsync.rejected, (state, action) => {
				state.isUpdating = false;
				state.error = action.payload as string;
			})
			// Delete profile picture
			.addCase(profileAction.deleteProfilePictureAsync.pending, (state) => {
				state.isUpdating = true;
				state.error = null;
			})
			.addCase(profileAction.deleteProfilePictureAsync.fulfilled, (state) => {
				state.isUpdating = false;
				if (state.profile) {
					state.profile.profileImage = undefined;
				}
			})
			.addCase(profileAction.deleteProfilePictureAsync.rejected, (state, action) => {
				state.isUpdating = false;
				state.error = action.payload as string;
			});
	},
});

export const { clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
