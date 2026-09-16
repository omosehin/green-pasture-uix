// _utils/idempotencyKey.ts
//
// Decides whether a checkout attempt should reuse its current idempotency key
// or mint a fresh one. Same key on a retry of the same attempt (double-click,
// dismissing a failure and resubmitting with nothing changed) — that's what
// lets the backend replay the stored response instead of double-charging. A
// fresh key the moment the customer changes anything that changes the
// request body (address, coupon, shipping/payment method) — reusing the old
// key there would hit the backend's "same key, different body" 422, which
// the customer has no way to clear.

export interface IdempotencyState {
	key: string | undefined;
	signature: string | undefined;
}

export function resolveIdempotencyKey(
	current: IdempotencyState,
	nextSignature: string,
	mint: () => string,
): IdempotencyState {
	if (!current.key || current.signature !== nextSignature) {
		return { key: mint(), signature: nextSignature };
	}
	return current;
}

// --- Attempt signatures --------------------------------------------------
//
// One signature per checkout branch, built from exactly what varies that
// branch's request bodies (order/checkout/:cartId + transaction/place-order
// for the authenticated branch; order/guest-checkout + transaction/place-order
// for the guest branch). Both calls in a branch share one key, so the
// signature is the union of what either call's body depends on.
//
// cartId/items are included even though they aren't literal body fields for
// every call (cartId is a URL param) — the backend's idempotency scope is
// keyed by (key, scope, route *pattern*), e.g. "/order/checkout/:cartId",
// never the interpolated cartId. So if the frontend swaps in a different
// cart (checkout.tsx's stale-cart recovery) without that showing up
// somewhere in the signature, a reused key would replay the OLD cart's
// stored response against the new cart. Same reasoning for guest items:
// there's no cartId there, the item list is the thing that identifies what's
// being converted into an order.

export interface AuthenticatedAttemptFields {
	cartId: string;
	items: unknown;
	shippingAddress: unknown;
	shippingMethod: string;
	paymentMethod: string;
	couponCode?: string;
}

export function buildAuthenticatedAttemptSignature(fields: AuthenticatedAttemptFields): string {
	const { cartId, items, shippingAddress, shippingMethod, paymentMethod, couponCode } = fields;
	return JSON.stringify({ cartId, items, shippingAddress, shippingMethod, paymentMethod, couponCode });
}

export interface GuestAttemptFields {
	items: { itemId: string; quantity: number }[];
	shippingAddress: unknown;
	shippingMethod: string;
	paymentMethod: string;
	couponCode?: string;
	guestFirstName?: string;
	guestLastName?: string;
	guestEmail?: string;
	guestPhone?: string;
}

export function buildGuestAttemptSignature(fields: GuestAttemptFields): string {
	const { items, shippingAddress, shippingMethod, paymentMethod, couponCode, guestFirstName, guestLastName, guestEmail, guestPhone } =
		fields;
	return JSON.stringify({
		items,
		shippingAddress,
		shippingMethod,
		paymentMethod,
		couponCode,
		guestFirstName,
		guestLastName,
		guestEmail,
		guestPhone,
	});
}
