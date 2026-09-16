import React from "react";
import Layout from "@/_components/Layout";
import CheckoutCardFlow from "@/_components/CheckoutCardFlow";
import { useAppSelector } from "@/_redux/store";

/**
 * Animated card-payment flow.
 *
 * `onPay` is intentionally left unset, so the flow simulates a 2s
 * authorisation. To go live, pass an onPay that calls
 * `transaction/place-order` and resolves once the webhook confirms —
 * NOT one that posts the card fields anywhere. Paystack takes the card
 * on its own hosted page; this UI never handles the real PAN.
 */
const CheckoutCardPage: React.FC = () => {
	const { total } = useAppSelector((state) => state.cart);

	return (
		<Layout pageTitle="Payment">
			<div className="container page-wrapper mx-auto px-4 py-12">
				<CheckoutCardFlow amount={total || 0} />
			</div>
		</Layout>
	);
};

export default CheckoutCardPage;
