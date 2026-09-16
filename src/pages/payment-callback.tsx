import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { CheckCircle, XCircle, Loader2, Clock } from "lucide-react";
import { motion } from "framer-motion";
import Layout from "@/_components/Layout";
import { useAppDispatch, useAppSelector } from "@/_redux/store";
import { checkoutAction } from "@/_redux/actions/checkout.action";
import { resetCheckout } from "@/_redux/reducers/checkout.reducer";
import { clearCart } from "@/_redux/reducers/cart.reducer";

const MAX_RETRIES = 3;
const RETRY_DELAY = 3000; // 3 seconds
const TIMEOUT = 30000; // 30 seconds

const PaymentCallback: React.FC = () => {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { paymentStatus, isVerifying, error } = useAppSelector(
		(state) => state.checkout
	);
	const [retryCount, setRetryCount] = useState(0);
	const [timedOut, setTimedOut] = useState(false);
	const verifiedRef = useRef(false);

	// Verify payment with retry logic
	useEffect(() => {
		const reference = router.query.reference as string;
		if (!reference || !router.isReady || verifiedRef.current) return;
		verifiedRef.current = true;

		const verify = async () => {
			dispatch(checkoutAction.verifyPaymentAsync(reference));
		};

		verify();

		// Timeout fallback
		const timeout = setTimeout(() => {
			setTimedOut(true);
		}, TIMEOUT);

		return () => clearTimeout(timeout);
	}, [router.query.reference, router.isReady, dispatch]);

	// Retry if payment status is "failed" (webhook may be delayed)
	useEffect(() => {
		if (paymentStatus === "failed" && retryCount < MAX_RETRIES && !timedOut) {
			const timer = setTimeout(() => {
				const reference = router.query.reference as string;
				if (reference) {
					setRetryCount((c) => c + 1);
					dispatch(checkoutAction.verifyPaymentAsync(reference));
				}
			}, RETRY_DELAY);
			return () => clearTimeout(timer);
		}
	}, [paymentStatus, retryCount, timedOut, dispatch, router.query.reference]);

	// Clear cart on success and redirect to order confirmation
	useEffect(() => {
		if (paymentStatus === "success") {
			dispatch(clearCart());
			const orderRef = (router.query.orderReference ?? router.query.orderId) as string | undefined;
			if (orderRef) {
				router.push(`/order-confirmation/${orderRef}`);
			} else {
				router.push("/my-orders");
			}
		}
	}, [paymentStatus, dispatch, router]);

	const handleContinueShopping = () => {
		dispatch(resetCheckout());
		router.push("/products");
	};

	const handleRetry = () => {
		dispatch(resetCheckout());
		router.push("/cart");
	};

	const isStillChecking = isVerifying || (paymentStatus === "failed" && retryCount < MAX_RETRIES && !timedOut);
	const hasFinallyFailed = paymentStatus === "failed" && (retryCount >= MAX_RETRIES || timedOut);

	return (
		<Layout pageTitle="Payment Status">
			<div className="min-h-[60vh] flex items-center justify-center px-4">
				<div
					className="max-w-md w-full text-center rounded-xl p-8"
					style={{
						background: "var(--surface-paper)",
						border: "1px solid var(--border-light)",
						boxShadow: "var(--shadow-lg)",
					}}
				>
					{/* Verifying / Retrying */}
					{isStillChecking && (
						<>
							<Loader2
								className="h-16 w-16 animate-spin mx-auto mb-4"
								style={{ color: "var(--color-primary)" }}
							/>
							<h2
								className="text-xl font-semibold mb-2"
								style={{ color: "var(--text-primary)" }}
							>
								{retryCount > 0 ? "Still Verifying..." : "Verifying Payment"}
							</h2>
							<p
								className="text-sm"
								style={{ color: "var(--text-hint)" }}
							>
								{retryCount > 0
									? `Checking again (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`
									: "Please wait while we confirm your payment..."}
							</p>
						</>
					)}

					{/* Success */}
					{paymentStatus === "success" && (
						<motion.div
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ type: "spring" as const, stiffness: 200, damping: 15 }}
						>
							<div
								className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
								style={{ background: "rgba(22,163,74,0.1)" }}
							>
								<CheckCircle
									className="h-10 w-10"
									style={{ color: "var(--color-primary)" }}
								/>
							</div>
							<h2
								className="text-xl font-semibold mb-2"
								style={{ color: "var(--text-primary)" }}
							>
								Payment Successful!
							</h2>
							<p
								className="text-sm mb-6"
								style={{ color: "var(--text-hint)" }}
							>
								Your order has been placed. You&apos;ll receive a confirmation email shortly.
							</p>
							<button
								onClick={handleContinueShopping}
								className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all press-effect cursor-pointer"
								style={{ background: "var(--color-primary)" }}
							>
								Continue Shopping
							</button>
						</motion.div>
					)}

					{/* Final failure */}
					{hasFinallyFailed && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
						>
							<div
								className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
								style={{ background: "rgba(239,68,68,0.1)" }}
							>
								<XCircle className="h-10 w-10 text-red-500" />
							</div>
							<h2
								className="text-xl font-semibold mb-2"
								style={{ color: "var(--text-primary)" }}
							>
								Payment Verification Failed
							</h2>
							<p
								className="text-sm mb-6"
								style={{ color: "var(--text-hint)" }}
							>
								{typeof error === "string" ? error : "We couldn't verify your payment. If you were charged, please contact support."}
							</p>
							<div className="space-y-3">
								<button
									onClick={handleRetry}
									className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all press-effect cursor-pointer"
									style={{ background: "var(--color-primary)" }}
								>
									Try Again
								</button>
								<button
									onClick={handleContinueShopping}
									className="w-full py-2.5 rounded-lg text-sm font-medium transition-all press-effect cursor-pointer"
									style={{ border: "1px solid var(--border-medium)", color: "var(--text-secondary)" }}
								>
									Continue Shopping
								</button>
							</div>
						</motion.div>
					)}

					{/* Timed out but still pending */}
					{timedOut && paymentStatus !== "success" && paymentStatus !== "failed" && (
						<>
							<Clock
								className="h-16 w-16 mx-auto mb-4"
								style={{ color: "var(--text-hint)" }}
							/>
							<h2
								className="text-xl font-semibold mb-2"
								style={{ color: "var(--text-primary)" }}
							>
								Still Processing
							</h2>
							<p
								className="text-sm mb-6"
								style={{ color: "var(--text-hint)" }}
							>
								Your payment is being processed. You&apos;ll receive an email confirmation once complete.
							</p>
							<button
								onClick={handleContinueShopping}
								className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all press-effect cursor-pointer"
								style={{ background: "var(--color-primary)" }}
							>
								Continue Shopping
							</button>
						</>
					)}
				</div>
			</div>
		</Layout>
	);
};

export default PaymentCallback;
