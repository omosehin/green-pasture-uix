import React, { useState, useEffect, useRef } from "react";
import { uuidv7 } from "uuidv7";
import {
	resolveIdempotencyKey,
	buildAuthenticatedAttemptSignature,
	buildGuestAttemptSignature,
	IdempotencyState,
} from "@/_utils/idempotencyKey";
import { useRouter } from "next/router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	CreditCard,
	Truck,
	CheckCircle,
	Loader2,
	DollarSign,
	Wallet,
	Lock,
	ShieldCheck,
	MapPin,
	Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/_redux/store";
import { checkoutAction } from "@/_redux/actions/checkout.action";
import { clearCart } from "@/_redux/reducers/cart.reducer";
import { resetCheckout, clearCheckoutError } from "@/_redux/reducers/checkout.reducer";
import Image from "next/image";
import Layout from "@/_components/Layout";
import toast from "react-hot-toast";
import { useOutcome } from "@/_UI/Outcome";
import { formatRateAsPercent } from "@/_utils/rate";
import { formatWeight } from "@/_utils/formatWeight";
import { FormInput } from "@/_UI/FormField";
import Button from "@/_UI/Button";
import PageLoader from "@/_UI/PageLoader";
import AuthPrompt from "@/_UI/AuthPrompt";
import { appConstants } from "@/_redux/constants";

/* ------------------------------------------------------------------ */
/*  Zod schema                                                        */
/* ------------------------------------------------------------------ */

const checkoutFormSchema = z.object({
	// Guest identity (only shown/required when not authenticated)
	guestFirstName: z.string().optional(),
	guestLastName: z.string().optional(),
	guestEmail: z.string().optional(),
	guestPhone: z.string().optional(),
	// Existing fields
	shippingAddress: z.object({
		street: z.string().min(1, "Street is required"),
		city: z.string().min(1, "City is required"),
		state: z.string().min(1, "State is required"),
		country: z.string().min(1, "Country is required"),
		postalCode: z.string().min(1, "Postal code is required"),
	}),
	// The id of an admin-configured shipping method — not a fixed set, so this
	// is validated as "picked something" rather than against a closed list.
	shippingMethod: z.string().min(1, "Please select a shipping method"),
	paymentMethod: z.enum(["CARD", "CASH_ON_DELIVERY"]),
});

type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

/* ------------------------------------------------------------------ */
/*  Option data                                                       */
/* ------------------------------------------------------------------ */

const paymentOptions = [
	{ value: "CARD" as const, label: "Pay with Card", desc: "Secure payment via Paystack", Icon: CreditCard },
	{ value: "CASH_ON_DELIVERY" as const, label: "Cash on Delivery", desc: "Pay when you receive your order", Icon: DollarSign },
];

/* ------------------------------------------------------------------ */
/*  Steps data                                                        */
/* ------------------------------------------------------------------ */

const steps = [
	{ num: 1, label: "Shipping" },
	{ num: 2, label: "Payment" },
	{ num: 3, label: "Review" },
];

/* ------------------------------------------------------------------ */
/*  Animation variants                                                */
/* ------------------------------------------------------------------ */

const containerVariants = {
	hidden: {},
	visible: {
		transition: { staggerChildren: 0.12, delayChildren: 0.1 },
	},
};

const sectionVariants = {
	hidden: { opacity: 0, x: -30 },
	visible: {
		opacity: 1,
		x: 0,
		transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
	},
};

const sidebarVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const },
	},
};

const checkmarkVariants = {
	hidden: { scale: 0, opacity: 0 },
	visible: {
		scale: 1,
		opacity: 1,
		transition: { type: "spring" as const, stiffness: 200, damping: 12, mass: 0.8 },
	},
};

const successTextVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { delay: 0.3 + i * 0.12, duration: 0.5 },
	}),
};

/* ------------------------------------------------------------------ */
/*  OptionCard                                                        */
/* ------------------------------------------------------------------ */

interface OptionCardProps {
	selected: boolean;
	Icon: React.FC<{ size?: number; className?: string }>;
	label: string;
	desc: string;
	value: string;
	onChange: () => void;
	name: string;
	inputRef?: React.Ref<HTMLInputElement>;
}

const OptionCard: React.FC<OptionCardProps> = ({ selected, Icon, label, desc, value, onChange, name, inputRef }) => (
	<motion.label
		whileTap={{ scale: 0.985 }}
		style={{
			borderColor: selected ? "var(--color-primary)" : "var(--border-light)",
			background: selected ? "rgba(22,163,74,0.06)" : "var(--surface-paper)",
			cursor: "pointer",
		}}
		className="relative flex items-center gap-4 rounded-xl border-2 p-4 transition-all"
	>
		<input ref={inputRef} type="radio" name={name} value={value} checked={selected} onChange={onChange} className="sr-only" />

		{/* Icon circle */}
		<div
			className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors"
			style={{
				background: selected ? "rgba(22,163,74,0.12)" : "var(--surface-low)",
				color: selected ? "var(--color-primary)" : "var(--text-secondary)",
			}}
		>
			<Icon size={20} />
		</div>

		{/* Text */}
		<div className="flex-1 min-w-0">
			<p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
				{label}
			</p>
			<p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
				{desc}
			</p>
		</div>

		{/* Checkmark */}
		<AnimatePresence>
			{selected && (
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					exit={{ scale: 0 }}
					transition={{ type: "spring", stiffness: 300, damping: 18 }}
					className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
					style={{ background: "var(--color-primary)" }}
				>
					<Check size={14} className="text-white" />
				</motion.div>
			)}
		</AnimatePresence>
	</motion.label>
);

/* ------------------------------------------------------------------ */
/*  StepIndicator                                                     */
/* ------------------------------------------------------------------ */

const StepIndicator: React.FC<{ currentStep: number }> = ({ currentStep }) => (
	<div className="flex items-center justify-center gap-0 mb-10">
		{steps.map((step, idx) => {
			const isActive = step.num <= currentStep;
			return (
				<React.Fragment key={step.num}>
					<div className="flex items-center gap-2.5">
						<motion.div
							initial={false}
							animate={{
								background: isActive ? "var(--color-primary)" : "var(--surface-medium)",
								color: isActive ? "#fff" : "var(--text-secondary)",
							}}
							transition={{ duration: 0.35 }}
							className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
						>
							{step.num < currentStep ? <Check size={14} /> : step.num}
						</motion.div>
						<span
							className="text-sm font-medium hidden sm:inline"
							style={{ color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}
						>
							{step.label}
						</span>
					</div>
					{idx < steps.length - 1 && (
						<div
							className="w-10 sm:w-16 h-px mx-2 sm:mx-4"
							style={{
								background: step.num < currentStep ? "var(--color-primary)" : "var(--border-light)",
							}}
						/>
					)}
				</React.Fragment>
			);
		})}
	</div>
);

/* ------------------------------------------------------------------ */
/*  CheckoutPage                                                      */
/* ------------------------------------------------------------------ */

const CheckoutPage: React.FC = () => {
	// Money-moment failures get the blocking outcome modal, not a toast that can
	// scroll away unnoticed while the customer waits for a payment page.
	const { failure } = useOutcome();
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { items, total, cartId } = useAppSelector((state) => state.cart);
	const { isAuthenticated, user } = useAppSelector((state) => state.auth);
	const isAdmin = appConstants.ADMIN_ROLES.includes(user?.profileType?.toUpperCase() as any || "");
	const { isCheckingOut, isPlacingOrder, paymentUrl, error } = useAppSelector((state) => state.checkout);
	const [orderPlaced, setOrderPlaced] = useState(false);
	const [couponCode, setCouponCode] = useState("");
	const [couponDiscount, setCouponDiscount] = useState(0);
	const [couponLoading, setCouponLoading] = useState(false);
	const [couponApplied, setCouponApplied] = useState(false);
	const [couponError, setCouponError] = useState("");
	const [emailExists, setEmailExists] = useState(false);
	const [checkingEmail, setCheckingEmail] = useState(false);

	const {
		register,
		handleSubmit,
		setValue,
		control,
		formState: { errors },
	} = useForm<CheckoutFormData>({
		resolver: zodResolver(checkoutFormSchema),
		defaultValues: {
			// Set once the store config loads and the enabled methods are known
			// (see the effect below) — there is no fixed default id to assume.
			shippingMethod: "",
			paymentMethod: "CARD",
			guestFirstName: "",
			guestLastName: "",
			guestEmail: "",
			guestPhone: "",
		},
	});

	const selectedShipping = useWatch({ control, name: "shippingMethod" });
	const selectedPayment = useWatch({ control, name: "paymentMethod" });

	/* Derive visual step based on form completion (all sections visible) */
	const hasShippingErrors =
		errors.shippingAddress?.street ||
		errors.shippingAddress?.city ||
		errors.shippingAddress?.state ||
		errors.shippingAddress?.country ||
		errors.shippingAddress?.postalCode;

	const visualStep = hasShippingErrors ? 1 : selectedPayment ? 3 : 2;

	const [storeConfig, setStoreConfig] = useState<any>(null);
	const [configLoading, setConfigLoading] = useState(true);

	// Clear stale errors on mount
	useEffect(() => {
		dispatch(clearCheckoutError());
	}, [dispatch]);

	// Fetch store settings for tax/shipping
	useEffect(() => {
		const fetchConfig = async () => {
			try {
				const axiosInstance = (await import("@/_utils/axiosInstance")).default;
				const res = await axiosInstance.get("store/settings");
				setStoreConfig(res.data?.data);
			} catch {} finally {
				setConfigLoading(false);
			}
		};
		fetchConfig();
	}, []);

	const taxRate = Number(storeConfig?.orderSettings?.taxRate) || 0;
	const freeShippingThreshold = Number(storeConfig?.orderSettings?.freeShippingThreshold) || 0;

	// Price the method the customer picked, matched by id — matching by name
	// meant a renamed method silently fell through to methods[0], so express
	// was displayed and charged at standard cost. Disabled methods aren't
	// offered at all, so they can never be the active selection.
	const shippingMethods = storeConfig?.shippingConfig?.methods ?? [];
	const enabledShippingMethods = shippingMethods.filter((m: any) => m?.enabled !== false);
	const activeMethod = enabledShippingMethods.find((m: any) => m.id === selectedShipping) ?? enabledShippingMethods[0];
	const shippingFee = Number(activeMethod?.baseCost) || 0;

	// Default (and re-default if the store config changes underneath the form,
	// e.g. the admin disabled the previously-selected method) to the first
	// enabled method's id.
	useEffect(() => {
		if (enabledShippingMethods.length === 0) return;
		if (!enabledShippingMethods.some((m: any) => m.id === selectedShipping)) {
			setValue("shippingMethod", enabledShippingMethods[0].id);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [storeConfig]);

	const subtotal = total;
	const shipping = freeShippingThreshold > 0 && subtotal >= freeShippingThreshold ? 0 : shippingFee;
	const tax = Math.round(subtotal * taxRate);
	// Display only — the server recomputes all of this at checkout and the
	// order is charged from its figures, not these.
	const finalTotal = Math.max(0, subtotal + shipping + tax - couponDiscount);

	const handleApplyCoupon = async () => {
		if (!couponCode.trim()) return;
		setCouponLoading(true);
		setCouponError("");
		try {
			const axiosInstance = (await import("@/_utils/axiosInstance")).default;
			const res = await axiosInstance.post("coupons/validate", {
				code: couponCode,
				orderAmount: subtotal,
			});
			const data = res.data?.data;
			if (data?.valid) {
				setCouponDiscount(Number(data.discount) || 0);
				setCouponApplied(true);
				toast.success(`Coupon applied! You save ₦${Number(data.discount).toLocaleString()}`);
			} else {
				setCouponError(data?.message || "Invalid coupon");
			}
		} catch (err: any) {
			setCouponError(err?.response?.data?.message || "Failed to validate coupon");
		} finally {
			setCouponLoading(false);
		}
	};

	const handleEmailBlur = async (email: string) => {
		if (!email || email.length < 5) return;
		setCheckingEmail(true);
		try {
			const axiosInstance = (await import("@/_utils/axiosInstance")).default;
			const res = await axiosInstance.get(`auth/check-email?email=${encodeURIComponent(email)}`);
			setEmailExists(res.data?.data?.exists || false);
		} catch {
			setEmailExists(false);
		} finally {
			setCheckingEmail(false);
		}
	};

	// Admin guard — admins can't checkout as customers
	useEffect(() => {
		if (!router.isReady) return;
		if (isAdmin) {
			router.push("/cart");
		}
	}, [isAdmin, router]);

	/* ---- Empty cart guard ---- */
	useEffect(() => {
		if (!router.isReady) return;
		if (items.length === 0 && !orderPlaced) {
			router.push("/cart");
		}
	}, [items, orderPlaced, router]);

	/* ---- Paystack redirect ---- */
	const redirectToPaystack = (authorizationUrl: string) => {
		dispatch(clearCart());
		dispatch(resetCheckout());
		window.location.href = authorizationUrl;
	};

	/* ---- Double-click guard ---- */
	const submittingRef = React.useRef(false);

	/* ---- Idempotency key: one per checkout attempt ----
	 * checkoutCart/guest-checkout and placeOrder are two calls that make up a
	 * single attempt (create order, then start payment), so they share one key —
	 * the backend scopes the key by endpoint, so reusing the value across the two
	 * calls isn't a collision. Whether that key is reused or replaced is decided
	 * by resolveIdempotencyKey against a per-branch signature built by
	 * buildAuthenticatedAttemptSignature / buildGuestAttemptSignature — see
	 * src/_utils/idempotencyKey.ts. The signature is computed where its inputs
	 * are actually final (after the stale-cart recovery below settles
	 * activeCartId, or from the current cart items in the guest branch), not
	 * eagerly at the top of onSubmit — cartId is only known after that recovery
	 * runs. Held in a ref, lazily minted (not eagerly via useRef(uuidv7())) so
	 * we never generate a UUID that's thrown away on render.
	 */
	const idempotencyStateRef = useRef<IdempotencyState>({ key: undefined, signature: undefined });

	/* ---- Submit handler ---- */
	const onSubmit = async (data: CheckoutFormData) => {
		// Prevent double submission
		if (submittingRef.current) return;
		submittingRef.current = true;

		try {
			if (isAuthenticated) {
				// ---- Authenticated checkout flow ----
				const axiosInstance = (await import("@/_utils/axiosInstance")).default;

				// Step 1: Get customer ID
				const customerRes = await axiosInstance.get("customers/me");
				const customerId = customerRes.data?.data?.id;
				if (!customerId) {
					toast.error("Please complete your profile before checkout.");
					return;
				}

				// Step 2: Ensure backend cart exists (always verify — cartId may be stale)
				let activeCartId = cartId;
				let needsSync = !activeCartId;

				if (activeCartId) {
					// Verify the stored cartId still exists in the backend
					try {
						await axiosInstance.get(`cart/${activeCartId}`);
					} catch {
						// Cart was deleted or doesn't exist — need a new one
						activeCartId = null;
						needsSync = true;
					}
				}

				if (!activeCartId) {
					const cartRes = await axiosInstance.post("cart/create");
					activeCartId = cartRes.data?.data?.id;
					if (!activeCartId) {
						toast.error("Failed to create cart. Please try again.");
						return;
					}
				}

				// The idempotency key is scoped to this attempt only now that
				// activeCartId is final — it can silently differ from the stored
				// cartId (the stale-cart recovery above), and cartId must be part of
				// the signature or a swap would replay the old cart's response.
				const authenticatedAttemptSignature = buildAuthenticatedAttemptSignature({
					cartId: activeCartId,
					items,
					shippingAddress: data.shippingAddress,
					shippingMethod: data.shippingMethod,
					paymentMethod: data.paymentMethod,
					couponCode: couponApplied ? couponCode : undefined,
				});
				idempotencyStateRef.current = resolveIdempotencyKey(idempotencyStateRef.current, authenticatedAttemptSignature, uuidv7);
				const idempotencyKey = idempotencyStateRef.current.key as string;

				// Step 3: Sync local items to backend cart if needed
				if (needsSync) {
					const failedItems: typeof items = [];
					for (const item of items) {
						try {
							await axiosInstance.post("cart-item/create", {
								cartId: activeCartId,
								itemId: item.id,
								quantity: item.quantity,
							});
						} catch (error) {
							// A 409/already-exists is fine (backend handles that
							// idempotently), but anything else means this item never
							// made it into the cart — placing an order now would
							// silently omit it, so that must not pass unnoticed.
							console.error("Failed to sync cart item", item.id, error);
							failedItems.push(item);
						}
					}
					if (failedItems.length > 0) {
						toast.error("Some items could not be added to your cart. Please try again.");
						return;
					}
				}

				// Step 4: Create order from cart (idempotent — returns existing if cart already checked out)
				const orderResult = await dispatch(
					checkoutAction.checkoutCartAsync({
						cartId: activeCartId,
						couponCode: couponApplied ? couponCode : undefined,
						shippingMethod: data.shippingMethod,
						idempotencyKey,
					})
				).unwrap();

				const orderId = orderResult?.data?.id;
				const orderReference = orderResult?.data?.orderReference;
				if (!orderId) {
					failure({
							title: "We couldn't place your order",
							message:
								"Your order was not created and you have not been charged. Your cart is still intact, so you can try again.",
							action: { label: "Back to cart", href: "/cart" },
						});
					return;
				}

				// Step 5: Handle payment method
				const backendPaymentMethod = data.paymentMethod === "CARD" ? "Paystack" : "Cash On Delivery";

				if (data.paymentMethod === "CASH_ON_DELIVERY") {
					dispatch(clearCart());
					dispatch(resetCheckout());
					toast.success("Order placed successfully!");
					router.push(`/order-confirmation/${orderReference ?? orderId}`);
					return;
				}

				// Step 6: Initialize payment (idempotent — returns existing transaction if one exists)
				const paymentResult = await dispatch(
					checkoutAction.placeOrderAsync({
						orderId,
						shippingMethod: data.shippingMethod,
						paymentMethod: backendPaymentMethod as any,
						shippingAddress: {
							...data.shippingAddress,
							latitude: "0",
							longitude: "0",
							region: data.shippingAddress.state || "",
							houseAddress: data.shippingAddress.street,
						} as any,
						idempotencyKey,
					}),
				).unwrap();

				// Step 7: Redirect to Paystack payment page
				const paystackData = paymentResult?.data?.data ?? paymentResult?.data;
				const authUrl = paystackData?.authorization_url;
				if (authUrl) {
					redirectToPaystack(authUrl);
				} else {
					failure({
							title: "Payment could not be started",
							message:
								"Your order was created but we couldn't reach the payment provider, so nothing has been charged. You can retry payment from your orders.",
							action: { label: "Go to my orders", href: "/my-orders" },
						});
				}
			} else {
				// ---- Guest checkout flow ----
				if (!data.guestFirstName || !data.guestEmail || !data.guestPhone) {
					toast.error("Please fill in your name, email, and phone number.");
					return;
				}


				const axiosInstance = (await import("@/_utils/axiosInstance")).default;

				// Guest checkout has no cartId — the item list is what identifies
				// which cart is being converted into an order, so it stands in for
				// cartId's role in the authenticated branch's signature.
				const guestItems = items.map((item) => ({ itemId: item.id, quantity: item.quantity }));
				const guestAttemptSignature = buildGuestAttemptSignature({
					items: guestItems,
					shippingAddress: data.shippingAddress,
					shippingMethod: data.shippingMethod,
					paymentMethod: data.paymentMethod,
					couponCode: couponApplied ? couponCode : undefined,
					guestFirstName: data.guestFirstName,
					guestLastName: data.guestLastName,
					guestEmail: data.guestEmail,
					guestPhone: data.guestPhone,
				});
				idempotencyStateRef.current = resolveIdempotencyKey(idempotencyStateRef.current, guestAttemptSignature, uuidv7);
				const idempotencyKey = idempotencyStateRef.current.key as string;

				// Call guest-checkout endpoint
				const guestRes = await axiosInstance.post(
					"order/guest-checkout",
					{
						firstName: data.guestFirstName,
						lastName: data.guestLastName || "",
						email: data.guestEmail,
						phoneNumber: data.guestPhone,
						items: guestItems,
						shippingMethod: data.shippingMethod,
						paymentMethod: data.paymentMethod === "CARD" ? "Paystack" : "Cash On Delivery",
						couponCode: couponApplied ? couponCode : undefined,
						shippingAddress: {
							houseAddress: data.shippingAddress.street,
							city: data.shippingAddress.city,
							region: data.shippingAddress.state || "",
							state: data.shippingAddress.state || "",
							country: data.shippingAddress.country,
							postalCode: data.shippingAddress.postalCode || "",
							latitude: "0",
							longitude: "0",
						},
					},
					{ headers: { "Idempotency-Key": idempotencyKey } },
				);

				const orderId = guestRes.data?.data?.orderId;
				const guestOrderReference = guestRes.data?.data?.orderReference;
				if (!orderId) {
					failure({
							title: "We couldn't place your order",
							message:
								"Your order was not created and you have not been charged. Your cart is still intact, so you can try again.",
							action: { label: "Back to cart", href: "/cart" },
						});
					return;
				}

				if (data.paymentMethod === "CASH_ON_DELIVERY") {
					dispatch(clearCart());
					toast.success("Order placed successfully!");
					router.push(`/order-confirmation/${guestOrderReference ?? orderId}`);
					return;
				}

				// Initialize Paystack payment
				const paymentRes = await axiosInstance.post(
					"transaction/place-order",
					{
						orderId,
						shippingMethod: data.shippingMethod,
						paymentMethod: "Paystack",
						shippingAddress: {
							houseAddress: data.shippingAddress.street,
							city: data.shippingAddress.city,
							region: data.shippingAddress.state || "",
							state: data.shippingAddress.state || "",
							country: data.shippingAddress.country,
							postalCode: data.shippingAddress.postalCode || "",
							latitude: "0",
							longitude: "0",
						},
					},
					{ headers: { "Idempotency-Key": idempotencyKey } },
				);

				const paystackData = paymentRes.data?.data?.data ?? paymentRes.data?.data;
				const authUrl = paystackData?.authorization_url;
				if (authUrl) {
					redirectToPaystack(authUrl);
				} else {
					failure({
							title: "Payment could not be started",
							message:
								"Your order was created but we couldn't reach the payment provider, so nothing has been charged. Check your email for the order reference.",
						});
				}
			}
		} catch (err: any) {
			const status = err?.response?.status;
			const serverMsg = err?.response?.data?.message || "";
			if (status === 409 && serverMsg.includes("already being processed")) {
				// The idempotency interceptor: this attempt's key is still IN_FLIGHT
				// from a prior submission — same-tab double-clicks are already
				// blocked by submittingRef, so this means a network-level retry or a
				// second tab beat this one to the server. Nothing failed; ask the
				// customer to wait rather than reporting an error.
				toast.error("Your order is already being processed. Please wait a moment before trying again.");
			} else if (status === 422) {
				// Same idempotency key, reused against a different request body.
				// Should be rare now that the signature covers cartId/items, but a
				// stale key must not strand the customer with no way to recover —
				// force a fresh key so their next submit isn't blocked by this one.
				idempotencyStateRef.current = { key: undefined, signature: undefined };
				toast.error("Something about your order changed since your last attempt. Please try again.");
			} else if (status === 409) {
				if (serverMsg.toLowerCase().includes("email")) {
					setEmailExists(true);
				}
				toast.error(serverMsg || "An account with these details already exists. Please log in.");
			} else {
				const msg = typeof err === "string"
					? err
					: err?.response?.data?.message || err?.message || "Checkout failed. Please try again.";
				toast.error(msg);
			}
		} finally {
			submittingRef.current = false;
		}
	};

	const isProcessing = isCheckingOut || isPlacingOrder;

	/* ================================================================ */
	/*  Success state                                                   */
	/* ================================================================ */

	if (orderPlaced) {
		return (
			<Layout pageTitle="Order Confirmed">
				<div
					className="flex min-h-[70vh] items-center justify-center px-4"
					style={{ background: "var(--surface-paper)" }}
				>
					<motion.div
						initial="hidden"
						animate="visible"
						className="max-w-md w-full text-center py-16"
					>
						{/* Animated checkmark */}
						<motion.div
							variants={checkmarkVariants}
							className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-full"
							style={{ background: "rgba(22,163,74,0.1)" }}
						>
							<motion.div
								className="flex h-20 w-20 items-center justify-center rounded-full"
								style={{ background: "var(--color-primary)" }}
							>
								<CheckCircle size={40} className="text-white" strokeWidth={2.5} />
							</motion.div>
						</motion.div>

						<motion.h1
							custom={0}
							variants={successTextVariants}
							className="text-3xl font-bold mb-3"
							style={{ color: "var(--text-primary)" }}
						>
							Order Placed!
						</motion.h1>

						<motion.p
							custom={1}
							variants={successTextVariants}
							className="text-base mb-10 leading-relaxed"
							style={{ color: "var(--text-secondary)" }}
						>
							Thank you for your order. We&apos;ll send you a confirmation email shortly.
						</motion.p>

						<motion.div custom={2} variants={successTextVariants}>
							<Button variant="filled" size="lg" onClick={() => router.push("/")}>
								Continue Shopping
							</Button>
						</motion.div>
					</motion.div>
				</div>
			</Layout>
		);
	}

	/* ================================================================ */
	/*  Main checkout form                                              */
	/* ================================================================ */

	return (
		<Layout pageTitle="Checkout">
			<div className="container page-wrapper mx-auto px-4 py-8">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
					className="mb-2"
				>
					<h1 className="text-2xl md:text-3xl font-bold text-center" style={{ color: "var(--text-primary)" }}>
						Checkout
					</h1>
					<p className="text-center text-sm mt-1.5 flex items-center justify-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
						<Lock size={13} />
						Secure checkout
					</p>
				</motion.div>

				{/* Step indicators */}
				<StepIndicator currentStep={visualStep} />

				{/* Error banner */}
				<AnimatePresence>
					{error && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							className="rounded-lg px-4 py-3 mb-6 text-sm font-medium"
							style={{
								background: "rgba(239,68,68,0.08)",
								border: "1px solid rgba(239,68,68,0.25)",
								color: "#dc2626",
							}}
						>
							{typeof error === "string" ? error : "Something went wrong. Please try again."}
						</motion.div>
					)}
				</AnimatePresence>

				<form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* ---- Left column ---- */}
					<motion.div
						className="lg:col-span-2 space-y-8"
						variants={containerVariants}
						initial="hidden"
						animate="visible"
					>
						{/* ===== Guest Identity — only shown for unauthenticated users ===== */}
						{!isAuthenticated && (
							<div className="rounded-xl p-5 mb-5" style={{ background: "var(--surface-paper)", border: "1px solid var(--border-light)" }}>
								<h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
									Contact Information
								</h3>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>First Name *</label>
										<input
											{...register("guestFirstName")}
											placeholder="John"
											className="w-full px-3 py-2.5 rounded-md text-sm bg-transparent outline-none transition-colors"
											style={{ border: `1px solid ${errors.guestFirstName ? '#ef4444' : 'var(--border-light)'}`, color: "var(--text-primary)" }}
										/>
									</div>
									<div>
										<label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>Last Name</label>
										<input
											{...register("guestLastName")}
											placeholder="Doe"
											className="w-full px-3 py-2.5 rounded-md text-sm bg-transparent outline-none transition-colors"
											style={{ border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
										/>
									</div>
									<div>
										<label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>Email *</label>
										<input
											{...register("guestEmail")}
											type="email"
											placeholder="john@example.com"
											onBlur={(e) => handleEmailBlur(e.target.value)}
											className="w-full px-3 py-2.5 rounded-md text-sm bg-transparent outline-none transition-colors"
											style={{ border: `1px solid ${emailExists ? '#ef4444' : 'var(--border-light)'}`, color: "var(--text-primary)" }}
										/>
										{emailExists && (
											<p className="text-xs mt-1" style={{ color: "#ef4444" }}>
												This email is already registered.{" "}
												<a href={`/login?redirect=/checkout`} className="underline font-medium" style={{ color: "var(--color-primary)" }}>
													Log in instead
												</a>
											</p>
										)}
									</div>
									<div>
										<label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>Phone *</label>
										<input
											{...register("guestPhone")}
											type="tel"
											placeholder="+2348012345678"
											className="w-full px-3 py-2.5 rounded-md text-sm bg-transparent outline-none transition-colors"
											style={{ border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
										/>
									</div>
								</div>
								<p className="text-[0.65rem] mt-3" style={{ color: "var(--text-hint)" }}>
									Already have an account?{" "}
									<a href={`/login?redirect=/checkout`} className="font-medium" style={{ color: "var(--color-primary)" }}>
										Log in
									</a>
								</p>
							</div>
						)}

						{/* ===== Shipping Address ===== */}
						<motion.section
							variants={sectionVariants}
							className="rounded-2xl p-6 md:p-8"
							style={{
								background: "var(--surface-paper)",
								border: "1px solid var(--border-light)",
							}}
						>
							<h2
								className="text-lg font-semibold mb-6 flex items-center gap-2"
								style={{ color: "var(--text-primary)" }}
							>
								<MapPin size={18} style={{ color: "var(--color-primary)" }} />
								Shipping Address
							</h2>

							<div className="space-y-4">
								<FormInput
									label="Street Address"
									required
									placeholder="123 Main Street"
									{...register("shippingAddress.street")}
									error={errors.shippingAddress?.street?.message}
								/>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<FormInput
										label="City"
										required
										placeholder="Lagos"
										{...register("shippingAddress.city")}
										error={errors.shippingAddress?.city?.message}
									/>
									<FormInput
										label="State"
										required
										placeholder="Lagos"
										{...register("shippingAddress.state")}
										error={errors.shippingAddress?.state?.message}
									/>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<FormInput
										label="Postal Code"
										required
										placeholder="100001"
										{...register("shippingAddress.postalCode")}
										error={errors.shippingAddress?.postalCode?.message}
									/>
									<FormInput
										label="Country"
										required
										defaultValue="Nigeria"
										{...register("shippingAddress.country")}
										error={errors.shippingAddress?.country?.message}
									/>
								</div>
							</div>
						</motion.section>

						{/* ===== Shipping Method ===== */}
						<motion.section
							variants={sectionVariants}
							className="rounded-2xl p-6 md:p-8"
							style={{
								background: "var(--surface-paper)",
								border: "1px solid var(--border-light)",
							}}
						>
							<h2
								className="text-lg font-semibold mb-5 flex items-center gap-2"
								style={{ color: "var(--text-primary)" }}
							>
								<Truck size={18} style={{ color: "var(--color-primary)" }} />
								Shipping Method
							</h2>

							<div className="space-y-3">
								{configLoading ? (
									<div className="h-16 rounded-xl animate-pulse" style={{ background: "var(--surface-medium)" }} />
								) : enabledShippingMethods.length === 0 ? (
									<div
										className="rounded-lg p-4 text-sm"
										style={{ background: "var(--surface-medium)", color: "var(--text-secondary)" }}
									>
										No shipping methods are currently available. Please check back later or contact support.
									</div>
								) : (
									enabledShippingMethods.map((opt: any) => (
										<OptionCard
											key={opt.id}
											selected={selectedShipping === opt.id}
											Icon={Truck}
											label={opt.name}
											desc={`${opt.estimatedDays ? `${opt.estimatedDays} • ` : ""}₦${Number(opt.baseCost).toLocaleString()}`}
											value={opt.id}
											name="shippingMethod"
											onChange={() => setValue("shippingMethod", opt.id)}
										/>
									))
								)}
							</div>
						</motion.section>

						{/* ===== Payment Method ===== */}
						<motion.section
							variants={sectionVariants}
							className="rounded-2xl p-6 md:p-8"
							style={{
								background: "var(--surface-paper)",
								border: "1px solid var(--border-light)",
							}}
						>
							<h2
								className="text-lg font-semibold mb-5 flex items-center gap-2"
								style={{ color: "var(--text-primary)" }}
							>
								<CreditCard size={18} style={{ color: "var(--color-primary)" }} />
								Payment Method
							</h2>

							<div className="space-y-3">
								{paymentOptions.map((opt) => (
									<OptionCard
										key={opt.value}
										selected={selectedPayment === opt.value}
										Icon={opt.Icon}
										label={opt.label}
										desc={opt.desc}
										value={opt.value}
										name="paymentMethod"
										onChange={() => setValue("paymentMethod", opt.value)}
									/>
								))}
							</div>

							{/* Security badges */}
							<div
								className="mt-5 flex items-center gap-4 text-xs pt-4"
								style={{ borderTop: "1px solid var(--border-light)", color: "var(--text-secondary)" }}
							>
								<span className="flex items-center gap-1">
									<ShieldCheck size={13} />
									256-bit encryption
								</span>
								<span className="flex items-center gap-1">
									<Lock size={13} />
									PCI compliant
								</span>
							</div>
						</motion.section>
					</motion.div>

					{/* ---- Right column: Order Summary ---- */}
					<motion.div
						className="lg:col-span-1"
						variants={sidebarVariants}
						initial="hidden"
						animate="visible"
					>
						<div
							className="sticky top-24 rounded-2xl p-6"
							style={{
								background: "var(--surface-paper)",
								border: "1px solid var(--border-light)",
							}}
						>
							<h2 className="text-lg font-semibold mb-5" style={{ color: "var(--text-primary)" }}>
								Order Summary
							</h2>

							{/* Product list */}
							<div className="space-y-4 mb-5">
								{items.map((item) => {
									const imgSrc = (item as any).photos?.[0]?.url || item.image || "";
									return (
										<div key={item.id} className="flex items-center gap-3">
											<div
												className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg"
												style={{ background: "var(--surface-low)" }}
											>
												{imgSrc ? (
													<Image
														height={48}
														width={48}
														src={imgSrc}
														alt={item.name}
														className="h-full w-full object-cover"
													/>
												) : (
													<div className="flex h-full w-full items-center justify-center text-xs" style={{ color: "var(--text-secondary)" }}>
														No img
													</div>
												)}
											</div>
											<div className="flex-1 min-w-0">
												<h4
													className="text-sm font-medium truncate"
													style={{ color: "var(--text-primary)" }}
												>
													{item.name}
												</h4>
												<p className="text-xs" style={{ color: "var(--text-secondary)" }}>
													{[formatWeight(item.weightValue, item.weightUnit), `Qty: ${item.quantity}`].filter(Boolean).join(" · ")}
												</p>
											</div>
											<span className="text-sm font-semibold shrink-0" style={{ color: "var(--text-primary)" }}>
												&#8358;{(item.price * item.quantity).toLocaleString()}
											</span>
										</div>
									);
								})}
							</div>

							{/* Divider */}
							<div className="h-px w-full mb-4" style={{ background: "var(--border-light)" }} />

							{/* Coupon Code */}
							<div className="mb-4">
								<div className="flex gap-2">
									<input
										type="text"
										value={couponCode}
										onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); setCouponApplied(false); setCouponDiscount(0); }}
										placeholder="Promo code"
										disabled={couponApplied}
										className="flex-1 px-3 py-2 text-sm rounded-lg outline-none"
										style={{
											background: "var(--surface-low)",
											border: `1px solid ${couponError ? "#ef4444" : "var(--border-light)"}`,
											color: "var(--text-primary)",
										}}
									/>
									<button
										type="button"
										onClick={couponApplied ? () => { setCouponCode(""); setCouponApplied(false); setCouponDiscount(0); } : handleApplyCoupon}
										disabled={couponLoading || (!couponApplied && !couponCode.trim())}
										className="px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
										style={{
											background: couponApplied ? "rgba(239,68,68,0.08)" : "rgba(22,163,74,0.08)",
											color: couponApplied ? "#ef4444" : "var(--color-primary)",
										}}
									>
										{couponLoading ? "..." : couponApplied ? "Remove" : "Apply"}
									</button>
								</div>
								{couponError && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{couponError}</p>}
								{couponApplied && <p className="text-xs mt-1" style={{ color: "var(--color-primary)" }}>Coupon applied successfully!</p>}
							</div>

							{/* Pricing breakdown */}
							{configLoading ? (
								<div className="space-y-2.5 mb-5">
									{[1, 2, 3, 4].map((i) => (
										<div key={i} className="flex justify-between">
											<div className="h-4 rounded w-20 animate-pulse" style={{ background: "var(--surface-medium)" }} />
											<div className="h-4 rounded w-16 animate-pulse" style={{ background: "var(--surface-medium)" }} />
										</div>
									))}
								</div>
							) : !storeConfig ? (
								<div className="rounded-lg p-3 mb-5 text-xs" style={{ background: "var(--surface-medium)", color: "var(--text-secondary)" }}>
									Tax and shipping info is currently unavailable. Totals shown may not include tax or shipping fees.
								</div>
							) : (
							<div className="space-y-2.5 mb-5">
								<div className="flex justify-between text-sm">
									<span style={{ color: "var(--text-secondary)" }}>Subtotal</span>
									<span className="font-medium" style={{ color: "var(--text-primary)" }}>
										&#8358;{subtotal.toLocaleString()}
									</span>
								</div>
								<div className="flex justify-between text-sm">
									<span style={{ color: "var(--text-secondary)" }}>Shipping</span>
									<span className="font-medium" style={{ color: shipping === 0 ? "var(--color-primary)" : "var(--text-primary)" }}>
										{shipping === 0 ? "Free" : `\u20A6${shipping.toLocaleString()}`}
									</span>
								</div>
								<div className="flex justify-between text-sm">
									<span style={{ color: "var(--text-secondary)" }}>Tax ({formatRateAsPercent(taxRate)})</span>
									<span className="font-medium" style={{ color: "var(--text-primary)" }}>
										&#8358;{tax.toLocaleString()}
									</span>
								</div>

								{couponDiscount > 0 && (
									<div className="flex justify-between text-sm">
										<span style={{ color: "var(--color-primary)" }}>Discount</span>
										<span className="font-medium" style={{ color: "var(--color-primary)" }}>
											-&#8358;{couponDiscount.toLocaleString()}
										</span>
									</div>
								)}

								{/* Total divider */}
								<div className="h-px w-full" style={{ background: "var(--border-light)" }} />

								<div className="flex justify-between items-center pt-1">
									<span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
										Total
									</span>
									<span className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>
										&#8358;{finalTotal.toLocaleString()}
									</span>
								</div>
							</div>
							)}

							{/* Place Order button */}
							<Button
								type="submit"
								variant="filled"
								size="lg"
								fullWidth
								loading={isProcessing}
								disabled={isProcessing || configLoading || enabledShippingMethods.length === 0}
							>
								{isProcessing ? "Processing..." : "Place Order"}
							</Button>

							{/* Trust text */}
							<p
								className="text-center text-xs mt-4 flex items-center justify-center gap-1"
								style={{ color: "var(--text-secondary)" }}
							>
								<Lock size={11} />
								Secure checkout
							</p>
						</div>
					</motion.div>
				</form>
			</div>
		</Layout>
	);
};

export default CheckoutPage;
