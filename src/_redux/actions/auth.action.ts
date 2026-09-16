import { createAsyncThunk } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import { appConstants } from "../constants";
import axios from "axios";
import axiosInstance from "@/_utils/axiosInstance";
import { extractErrorMessage } from "@/_utils/apiHelpers";
import { authCookies, AUTH_COOKIES } from "@/_utils/authCookies";
import { stopAuthScheduler } from "@/_utils/tokenRefresh";

interface Address {
	latitude: string;
	longitude: string;
	houseAddress: string;
	state: string;
	city: string;
	postalCode: string;
}

interface User {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	phoneNumber?: string;
	role?: "CLIENT" | "ADMIN" | "OTHER";
	address?: Address;
}

export const signupAsync = createAsyncThunk(
	"auth/signupAsync",
	async (user: User, { rejectWithValue }) => {
		try {
			const response = await axios.post(   //Use axiosInstance ONLY for protected APIs
				`${appConstants.API_BASE_URL}auth/signup`,
				user
			);
			console.log(response.data);
			return response.data;
		} catch (error: any) {
			console.log(error);
			const message =
				error.response?.data?.message || error.message || "Signup failed";
			return rejectWithValue(message);
		}
	}
);

export const loginAsync = createAsyncThunk(
	"auth/loginAsync",
	async (user: { email: string; password: string }, { rejectWithValue }) => {
		try {
			// console.log("Login payload:", user);
			const response = await axios.post( //Use axiosInstance ONLY for protected APIs
				`${appConstants.API_BASE_URL}auth/login`,
				user
			);
			return response.data;
		} catch (error: any) {
      let message = "Login failed. Please check your internet connection or try again later.";
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          message = error.response.data.message;
        } else if (error.code === "ECONNABORTED") {  //backend not responding
          message = "Please try again later.";
        }
      }
			return rejectWithValue(message);
		}
	}
);

export const logoutAsync = createAsyncThunk<void, void, { rejectValue: string }>(
	"auth/logout",
	async (_, { rejectWithValue }) => {
		stopAuthScheduler();
		// Send the refresh token so the API can actually revoke it (the bearer
		// header carries the access token, which the server can't use to revoke).
		const refreshToken = Cookies.get(AUTH_COOKIES.refreshToken);
		try {
			await axiosInstance.post("auth/logout", { refreshToken });
			authCookies.clearTokens();
		} catch {
			authCookies.clearTokens(); // Always clear tokens even on error
		}
	}
);

export const forgotPasswordAsync = createAsyncThunk<any, { email: string }, { rejectValue: string }>(
	"auth/forgotPassword",
	async (payload, { rejectWithValue }) => {
		try {
			const res = await axios.post(`${appConstants.API_BASE_URL}auth/forgot-password`, payload);
			return res.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

export const verifyAccountAsync = createAsyncThunk<any, { email: string; otp: string }, { rejectValue: string }>(
	"auth/verifyAccount",
	async (payload, { rejectWithValue }) => {
		try {
			const res = await axios.post(`${appConstants.API_BASE_URL}auth/verify-account`, payload);
			return res.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

export const resendOtpAsync = createAsyncThunk<any, { email: string }, { rejectValue: string }>(
	"auth/resendOtp",
	async (payload, { rejectWithValue }) => {
		try {
			const res = await axios.post(`${appConstants.API_BASE_URL}auth/resend-verification-otp`, payload);
			return res.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);

export const googleOAuthSigninAsync = createAsyncThunk<any, { accessToken: string }, { rejectValue: string }>(
	"auth/googleOAuth",
	async (payload, { rejectWithValue }) => {
		try {
			const res = await axios.post(`${appConstants.API_BASE_URL}auth/google/oauth/signin`, payload);
			return res.data;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error));
		}
	}
);
