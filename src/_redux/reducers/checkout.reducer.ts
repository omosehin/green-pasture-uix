import { createSlice } from "@reduxjs/toolkit";
import { CheckoutState } from "@/types";
import { checkoutAction } from "../actions/checkout.action";

const initialState: CheckoutState = {
	orderId: null,
	paymentUrl: null,
	paymentReference: null,
	paymentStatus: "idle",
	isCheckingOut: false,
	isPlacingOrder: false,
	isVerifying: false,
	error: null,
};

const checkoutSlice = createSlice({
	name: "checkout",
	initialState,
	reducers: {
		resetCheckout: () => initialState,
		clearCheckoutError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Checkout cart -> create order
			.addCase(checkoutAction.checkoutCartAsync.pending, (state) => {
				state.isCheckingOut = true;
				state.error = null;
			})
			.addCase(
				checkoutAction.checkoutCartAsync.fulfilled,
				(state, action) => {
					state.isCheckingOut = false;
					state.orderId = action.payload?.data?.id ?? null;
				}
			)
			.addCase(
				checkoutAction.checkoutCartAsync.rejected,
				(state, action) => {
					state.isCheckingOut = false;
					state.error = action.payload as string;
				}
			)
			// Place order -> initiate payment
			.addCase(checkoutAction.placeOrderAsync.pending, (state) => {
				state.isPlacingOrder = true;
				state.error = null;
			})
			.addCase(
				checkoutAction.placeOrderAsync.fulfilled,
				(state, action) => {
					state.isPlacingOrder = false;
					const paystackData = action.payload?.data?.data;
					state.paymentUrl =
						paystackData?.authorization_url ?? null;
					state.paymentReference =
						paystackData?.reference ?? null;
					state.paymentStatus = "pending";
				}
			)
			.addCase(
				checkoutAction.placeOrderAsync.rejected,
				(state, action) => {
					state.isPlacingOrder = false;
					state.error = action.payload as string;
				}
			)
			// Verify payment
			.addCase(checkoutAction.verifyPaymentAsync.pending, (state) => {
				state.isVerifying = true;
				state.error = null;
			})
			.addCase(
				checkoutAction.verifyPaymentAsync.fulfilled,
				(state, action) => {
					state.isVerifying = false;
					const status = action.payload?.data?.data?.status;
					state.paymentStatus =
						status === "success" ? "success" : "failed";
				}
			)
			.addCase(
				checkoutAction.verifyPaymentAsync.rejected,
				(state, action) => {
					state.isVerifying = false;
					state.paymentStatus = "failed";
					state.error = action.payload as string;
				}
			);
	},
});

export const { resetCheckout, clearCheckoutError } = checkoutSlice.actions;
export default checkoutSlice.reducer;
