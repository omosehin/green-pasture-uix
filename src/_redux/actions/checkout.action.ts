import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/_utils/axiosInstance";
import { extractErrorMessage } from "@/_utils/apiHelpers";
import { ShippingMethodType, PaymentMethodType, ShippingAddress } from "@/types";

export interface PlaceOrderPayload {
	orderId: string;
	shippingMethod: ShippingMethodType;
	paymentMethod: PaymentMethodType;
	shippingAddress: ShippingAddress;
	/** Stable per checkout attempt — see checkout.tsx. Sent as a header, not part of the body. */
	idempotencyKey: string;
}

export interface CheckoutCartPayload {
	cartId: string;
	/** Server re-validates and prices this; the client's discount figure is ignored. */
	couponCode?: string;
	shippingMethod?: ShippingMethodType;
	/** Stable per checkout attempt — see checkout.tsx. Sent as a header, not part of the body. */
	idempotencyKey: string;
}

const checkoutCartAsync = createAsyncThunk<
	any,
	CheckoutCartPayload,
	{ rejectValue: string }
>("checkout/checkoutCart", async ({ cartId, couponCode, shippingMethod, idempotencyKey }, { rejectWithValue }) => {
	try {
		const response = await axiosInstance.post(
			`order/checkout/${cartId}`,
			{
				...(couponCode ? { couponCode } : {}),
				...(shippingMethod ? { shippingMethod } : {}),
			},
			{ headers: { "Idempotency-Key": idempotencyKey } },
		);
		return response.data;
	} catch (error: any) {
		return rejectWithValue(extractErrorMessage(error));
	}
});

const placeOrderAsync = createAsyncThunk<
	any,
	PlaceOrderPayload,
	{ rejectValue: string }
>("checkout/placeOrder", async ({ idempotencyKey, ...payload }, { rejectWithValue }) => {
	try {
		const response = await axiosInstance.post("transaction/place-order", payload, {
			headers: { "Idempotency-Key": idempotencyKey },
		});
		return response.data;
	} catch (error: any) {
		return rejectWithValue(extractErrorMessage(error));
	}
});

const verifyPaymentAsync = createAsyncThunk<
	any,
	string,
	{ rejectValue: string }
>("checkout/verifyPayment", async (reference, { rejectWithValue }) => {
	try {
		const response = await axiosInstance.get(
			`transaction/callback?reference=${reference}`
		);
		return response.data;
	} catch (error: any) {
		return rejectWithValue(extractErrorMessage(error));
	}
});

export const checkoutAction = {
	checkoutCartAsync,
	placeOrderAsync,
	verifyPaymentAsync,
};
