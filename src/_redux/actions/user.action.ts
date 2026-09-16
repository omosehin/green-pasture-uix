import { getObjectFromStorage } from "@/_utils";
import { User } from "@/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { authConstants } from "../constants";

export const getBio = createAsyncThunk<User | null>(
	"user/fetchBio",
	async () => {
		const response = await getObjectFromStorage(authConstants.USER_KEY);
		const bio = response?.user;
		return bio as User | null;
	}
);
