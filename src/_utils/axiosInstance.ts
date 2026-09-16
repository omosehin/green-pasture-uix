// _utils/axiosInstance.ts
import { appConstants } from "@/_redux/constants";
import axios, {
	AxiosInstance,
	InternalAxiosRequestConfig,
	AxiosError,
} from "axios";
import Cookies from "js-cookie";
import { authCookies, AUTH_COOKIES } from "./authCookies";
import { refreshAccessToken, forceLogout } from "./tokenRefresh";
import { logger } from "./logger";
import { shouldRetryColdStart, COLD_START_TIMEOUT_MS } from "./coldStartRetry";

let cachedIpInfo: any = null;

// Fetch IP info only once and cache it (UNCHANGED)
async function getIpInfo(): Promise<any> {
	if (cachedIpInfo) return cachedIpInfo;

	try {
		const response = await fetch(`https://ipinfo.io/json?token=${appConstants.IPINFO_TOKEN}`);
		if (!response.ok) throw new Error("Failed to fetch IP info");

		const data = await response.json();
		logger.log({ country: data });
		cachedIpInfo = data?.country || "Unknown";

		return cachedIpInfo;
	} catch (error) {
		console.error("IPInfo fetch error:", error);
		return null;
	}
}

// Create Axios instance (UNCHANGED)
const axiosInstance: AxiosInstance = axios.create({
	baseURL: appConstants.API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
	timeout: 15000
	// withCredentials: true,
});

// ✅ CHANGE 4: Update request interceptor
axiosInstance.interceptors.request.use(
	async (
		config: InternalAxiosRequestConfig
	): Promise<InternalAxiosRequestConfig> => {
		try {
			//const ipInfo = await getIpInfo();

			//config.params = { ...config.params, country: ipInfo?.country };
			// if (config.method?.toLowerCase() === "get") {
			// } else {
			// 	config.data = { ...(config.data || {}), country: ipInfo?.country };
			// }

			// Get access token from the auth cookie
			const tokenData = authCookies.getTokens();
			const token = tokenData?.accessToken;

			if (token && !config.headers.Authorization) {
				config.headers.Authorization = `Bearer ${token}`;
			}

			return config;
		} catch (error) {
			console.warn("Failed to get IP info:", error);
			return config;
		}
	},
	(error) => Promise.reject(error)
);

// Response interceptor: on 401, transparently refresh (single-flight via
// tokenRefresh) and retry the original request. If refresh genuinely fails,
// end the session and redirect to /login preserving the current path.
axiosInstance.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const originalRequest: any = error.config;

		if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
			// Only attempt a refresh for users who were actually logged in.
			if (!Cookies.get(AUTH_COOKIES.refreshToken)) {
				return Promise.reject(error);
			}

			originalRequest._retry = true;

			try {
				const accessToken = await refreshAccessToken();
				if (originalRequest.headers) {
					originalRequest.headers.Authorization = `Bearer ${accessToken}`;
				}
				return axiosInstance(originalRequest);
			} catch (refreshError) {
				// Session truly over: clear state and bounce to login with the
				// current path captured so the user returns here after re-login.
				await forceLogout({ redirect: true });
				return Promise.reject(refreshError);
			}
		}

		// A read that never got an answer is almost always the API waking from
		// idle (~44s cold, against a 15s timeout). Give it one more go with room
		// to finish rather than showing "Couldn't load products" on first load.
		if (shouldRetryColdStart(error, originalRequest)) {
			originalRequest._coldStartRetry = true;
			originalRequest.timeout = COLD_START_TIMEOUT_MS;
			return axiosInstance(originalRequest);
		}

		console.error("API Error:", error.response || error.message);
		return Promise.reject(error);
	}
);

export default axiosInstance;
