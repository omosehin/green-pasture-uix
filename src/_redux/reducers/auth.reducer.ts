import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, User } from "@/types";
import {
	loginAsync,
	signupAsync,
	logoutAsync,
	forgotPasswordAsync,
	verifyAccountAsync,
	resendOtpAsync,
	googleOAuthSigninAsync,
} from "../actions/auth.action";
import { authConstants } from "../constants";
import { authCookies } from "@/_utils/authCookies";

const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
	isLoading: false,
	error: null,
};

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		logout: (state) => {
			state.user = null;
			state.isAuthenticated = false;
			state.error = null;
			state.isLoading = false;
			authCookies.clearTokens();
		},
		clearError: (state) => {
			state.error = null;
		},
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.isLoading = action.payload;
		},
		// Reconcile session state against the auth cookie at startup. The token
		// cookie is the single source of truth — when it is absent/expired the
		// user is logged out regardless of any persisted state.
		hydrateAuth: (
			state,
			action: PayloadAction<{ isAuthenticated: boolean; user?: User | null }>
		) => {
			state.isAuthenticated = action.payload.isAuthenticated;
			if (!action.payload.isAuthenticated) {
				state.user = null;
			} else if (action.payload.user !== undefined) {
				state.user = action.payload.user;
			}
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(loginAsync.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(loginAsync.fulfilled, (state, action: PayloadAction<any>) => {
				state.isLoading = false;
				state.user = action.payload?.data?.profileInfo;
				state.isAuthenticated = true;
				state.error = null;
				authCookies.setTokens(
				action.payload.data.accessToken,
				action.payload.data.refreshToken,
				action.payload.data.profileInfo
				);
			})
			.addCase(loginAsync.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
				state.isAuthenticated = false;
			});

		builder
			.addCase(signupAsync.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(signupAsync.fulfilled, (state) => {
				state.isLoading = false;
				state.error = null;
			})
			.addCase(signupAsync.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
			});

		builder.addCase(logoutAsync.fulfilled, (state) => {
			state.user = null;
			state.isAuthenticated = false;
			state.isLoading = false;
			state.error = null;
		});

		builder
			.addCase(forgotPasswordAsync.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(forgotPasswordAsync.fulfilled, (state) => {
				state.isLoading = false;
			})
			.addCase(forgotPasswordAsync.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
			});

		builder
			.addCase(verifyAccountAsync.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(verifyAccountAsync.fulfilled, (state) => {
				state.isLoading = false;
			})
			.addCase(verifyAccountAsync.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
			});

		builder
			.addCase(resendOtpAsync.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(resendOtpAsync.fulfilled, (state) => {
				state.isLoading = false;
			})
			.addCase(resendOtpAsync.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
			});

		builder
			.addCase(googleOAuthSigninAsync.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(googleOAuthSigninAsync.fulfilled, (state, action: PayloadAction<any>) => {
				state.isLoading = false;
				state.user = action.payload?.data?.profileInfo;
				state.isAuthenticated = true;
				state.error = null;
				authCookies.setTokens(
					action.payload.data.accessToken,
					action.payload.data.refreshToken,
					action.payload.data.profileInfo
				);
			})
			.addCase(googleOAuthSigninAsync.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
				state.isAuthenticated = false;
			});
	},
});

export const { logout, clearError, setLoading, hydrateAuth } = authSlice.actions;
export default authSlice.reducer;
