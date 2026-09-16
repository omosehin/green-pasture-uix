import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getBio } from "../actions/user.action";
import { BioProp, User } from "@/types";

const initialState: BioProp = {
	isLoading: false,
	bio: null,
};

const usersSlice = createSlice({
	name: "user",
	initialState,
	reducers: {
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.isLoading = action.payload;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(getBio.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(
				getBio.fulfilled,
				(state, action: PayloadAction<User | null>) => {
					state.bio = action.payload;
					state.isLoading = false;
				}
			)
			.addCase(getBio.rejected, (state) => {
				state.isLoading = false;
			});
	},
});

export const { setLoading } = usersSlice.actions;
export default usersSlice.reducer;
