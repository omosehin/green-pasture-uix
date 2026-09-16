import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/_utils/axiosInstance";

/**
 * Admin-owned storefront settings, read once per app load from the public
 * `store/settings` endpoint. Deliberately NOT in the persist whitelist so an
 * admin toggling something is picked up on the customer's next page load
 * instead of being pinned to a stale localStorage copy.
 */
export interface SettingsState {
	freeShippingThreshold: number;
	taxRate: number;
	shippingFee: number;
	defaultCurrency: string;
	showDiscountBadges: boolean;
	/** Regions where the free-shipping threshold actually applies. Empty = everywhere. */
	freeShippingRegions: string[];
	multiCurrencyEnabled: boolean;
	loaded: boolean;
}

const initialState: SettingsState = {
	freeShippingThreshold: 0,
	taxRate: 0,
	shippingFee: 0,
	defaultCurrency: "NGN",
	// Default on: an unset flag on an existing store must not silently hide
	// discounts that were already live before this setting existed.
	showDiscountBadges: true,
	freeShippingRegions: [],
	// Default OFF: an unset flag on an existing store must keep showing NGN
	// to everyone, exactly today's behaviour, until an admin opts in.
	multiCurrencyEnabled: false,
	loaded: false,
};

export const fetchStoreSettings = createAsyncThunk(
	"settings/fetch",
	async () => {
		const res = await axiosInstance.get("store/settings");
		return res.data?.data ?? null;
	}
);

const settingsSlice = createSlice({
	name: "settings",
	initialState,
	reducers: {
		setShowDiscountBadges: (state, action: PayloadAction<boolean>) => {
			state.showDiscountBadges = action.payload;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchStoreSettings.fulfilled, (state, action) => {
				const order = action.payload?.orderSettings ?? {};
				const shipping = action.payload?.shippingConfig ?? {};

				state.freeShippingThreshold = Number(order.freeShippingThreshold) || 0;
				state.taxRate = Number(order.taxRate) || 0;
				state.shippingFee = Number(shipping.methods?.find((m: any) => m?.enabled !== false)?.baseCost) || 0;
				state.defaultCurrency = order.defaultCurrency ?? "NGN";
				state.showDiscountBadges = order.showDiscountBadges !== false;
				state.freeShippingRegions = Array.isArray(order.freeShippingRegions) ? order.freeShippingRegions : [];
				state.multiCurrencyEnabled = order.multiCurrencyEnabled === true;
				state.loaded = true;
			})
			// A settings outage must not blank the storefront — keep the defaults
			// and mark it resolved so consumers stop waiting.
			.addCase(fetchStoreSettings.rejected, (state) => {
				state.loaded = true;
			});
	},
});

export const { setShowDiscountBadges } = settingsSlice.actions;
export default settingsSlice.reducer;
