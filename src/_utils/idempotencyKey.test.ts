// Run: pnpm test          (or: node --test src/_utils/idempotencyKey.test.ts)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
	resolveIdempotencyKey,
	buildAuthenticatedAttemptSignature,
	buildGuestAttemptSignature,
} from "./idempotencyKey.ts";

test("mints a key on the first attempt", () => {
	const state = resolveIdempotencyKey({ key: undefined, signature: undefined }, "sig-a", () => "key-1");
	assert.equal(state.key, "key-1");
	assert.equal(state.signature, "sig-a");
});

test("reuses the key on a retry of the same attempt (double-click, dismiss-and-resubmit)", () => {
	const first = resolveIdempotencyKey({ key: undefined, signature: undefined }, "sig-a", () => "key-1");
	// Same attempt signature the second time around — must not mint a new key,
	// or the backend's double-submit protection never engages.
	const second = resolveIdempotencyKey(first, "sig-a", () => "key-2");
	assert.equal(second.key, "key-1");
	assert.equal(second.signature, "sig-a");
});

test("mints a fresh key when the attempt-defining fields change", () => {
	const first = resolveIdempotencyKey({ key: undefined, signature: undefined }, "sig-a", () => "key-1");
	// Customer edited the shipping address or coupon — different signature —
	// reusing key-1 here would hit the backend's 422 with no way to clear it.
	const second = resolveIdempotencyKey(first, "sig-b", () => "key-2");
	assert.equal(second.key, "key-2");
	assert.equal(second.signature, "sig-b");
});

test("a key changed by an edit does not revert on a further retry of the new attempt", () => {
	const first = resolveIdempotencyKey({ key: undefined, signature: undefined }, "sig-a", () => "key-1");
	const edited = resolveIdempotencyKey(first, "sig-b", () => "key-2");
	const retryOfEdited = resolveIdempotencyKey(edited, "sig-b", () => "key-3");
	assert.equal(retryOfEdited.key, "key-2");
});

const baseAuthenticatedFields = {
	cartId: "cart-a",
	items: [{ itemId: "item-1", quantity: 1 }],
	shippingAddress: { street: "1 Market St", city: "Lagos", state: "LA", country: "NG", postalCode: "100001" },
	shippingMethod: "STANDARD",
	paymentMethod: "CARD",
	couponCode: undefined,
};

test("authenticated attempt signature differs when the target cart differs", () => {
	// checkout.tsx silently swaps in a freshly created cart when the stored
	// cartId 404s (Step 2's stale-cart recovery). The backend's idempotency
	// scope is keyed by route *pattern* (/order/checkout/:cartId), never the
	// interpolated cartId, so if cartId isn't part of what we hash here, a cart
	// swap with everything else unchanged reuses the old key and the
	// interceptor replays the OLD cart's stored response against the NEW cart.
	const sigForCartA = buildAuthenticatedAttemptSignature({ ...baseAuthenticatedFields, cartId: "cart-a" });
	const sigForCartB = buildAuthenticatedAttemptSignature({ ...baseAuthenticatedFields, cartId: "cart-b" });
	assert.notEqual(sigForCartA, sigForCartB, "cartId must be part of the authenticated attempt signature");
});

test("authenticated attempt signature differs when the cart's items differ", () => {
	// Same swapped-cart scenario as above, but via cart-item sync (Step 3)
	// rather than cartId itself: same cartId, different items on it. Without
	// items in the signature, the key would be reused and the interceptor
	// would replay a stale response against a cart whose contents changed.
	const sigForOneItem = buildAuthenticatedAttemptSignature({
		...baseAuthenticatedFields,
		items: [{ itemId: "item-1", quantity: 1 }],
	});
	const sigForTwoItems = buildAuthenticatedAttemptSignature({
		...baseAuthenticatedFields,
		items: [{ itemId: "item-1", quantity: 1 }, { itemId: "item-2", quantity: 1 }],
	});
	assert.notEqual(sigForOneItem, sigForTwoItems, "items must be part of the authenticated attempt signature");
});

const baseGuestFields = {
	shippingAddress: { street: "1 Market St", city: "Lagos", state: "LA", country: "NG", postalCode: "100001" },
	shippingMethod: "STANDARD",
	paymentMethod: "CARD",
	couponCode: undefined,
	guestFirstName: "Ada",
	guestLastName: "Lovelace",
	guestEmail: "ada@example.com",
	guestPhone: "+2340000000",
};

test("guest attempt signature differs when the cart's items differ", () => {
	// Guest checkout has no cartId — the item list is what identifies which
	// cart is being converted into an order, so it needs the same protection.
	const sigForOneItem = buildGuestAttemptSignature({
		...baseGuestFields,
		items: [{ itemId: "item-1", quantity: 1 }],
	});
	const sigForTwoItems = buildGuestAttemptSignature({
		...baseGuestFields,
		items: [{ itemId: "item-1", quantity: 1 }, { itemId: "item-2", quantity: 1 }],
	});
	assert.notEqual(sigForOneItem, sigForTwoItems, "items must be part of the guest attempt signature");
});
