import React, {
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import Link from "next/link";
import {
	Minus,
	Plus,
	Trash2,
	ShoppingBag,
	AlertTriangle,
	RefreshCw,
	ArrowLeft,
	ShieldCheck,
	Truck,
	Lock,
	X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/_redux/store";
import {
	clearCart,
	clearError,
} from "@/_redux/reducers/cart.reducer";
import { clearCartAsync } from "@/_redux/actions/cart.action";
import { appConstants } from "@/_redux/constants";
import { formatRateAsPercent } from "@/_utils/rate";
import { formatWeight } from "@/_utils/formatWeight";
import Image from "next/image";
import Layout from "@/_components/Layout";
import PageLoader from "@/_UI/PageLoader";
import { useCartOperations } from "@/_hooks/useCart";

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: {
			delay: i * 0.08,
			duration: 0.4,
			ease: [0.25, 0.46, 0.45, 0.94] as const,
		},
	}),
	exit: {
		x: -100,
		opacity: 0,
		height: 0,
		marginBottom: 0,
		paddingTop: 0,
		paddingBottom: 0,
		transition: { duration: 0.35, ease: "easeInOut" as const },
	},
};

const fadeUp = {
	hidden: { opacity: 0, y: 12 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const CartPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const { items, total, itemCount, loading, error } = useAppSelector(
		(state) => state.cart
	);
	const { isAuthenticated, user } = useAppSelector((state) => state.auth);
	const isAdmin = appConstants.ADMIN_ROLES.includes(user?.profileType?.toUpperCase() as any || "");
	const { handleQuantityChange, handleRemoveItem, isUpdating, errors } =
		useCartOperations();

	const [isClearing, setIsClearing] = useState(false);
	const [showClearConfirm, setShowClearConfirm] = useState(false);
	const [syncing, setSyncing] = useState(true);
	const [storeConfig, setStoreConfig] = useState<any>(null);

	// Clear stale errors on mount
	useEffect(() => {
		dispatch(clearError());
	}, [dispatch]);

	// Fetch store settings + sync cart on page load
	useEffect(() => {
		const init = async () => {
			setSyncing(true);
			try {
				const axiosInstance = (await import("@/_utils/axiosInstance")).default;

				// Fetch store settings (tax, shipping, thresholds)
				try {
					const storeRes = await axiosInstance.get("store/settings");
					setStoreConfig(storeRes.data?.data);
				} catch {
					// Store settings not available — use defaults
				}

				// Sync cart with backend if authenticated (backend derives customer from JWT)
				if (isAuthenticated) {
					try {
						const { syncCartOnLoginAsync } = await import("@/_redux/actions/cart.action");
						await dispatch(syncCartOnLoginAsync() as any);
					} catch {
						// Customer may not exist — keep local cart
					}
				}
			} finally {
				setSyncing(false);
			}
		};
		init();
	}, [isAuthenticated, dispatch]);

	// Server-driven values — no hardcoded fallbacks
	const taxRate = Number(storeConfig?.orderSettings?.taxRate) || 0;
	const freeShippingThreshold = Number(storeConfig?.orderSettings?.freeShippingThreshold) || 0;
	const shippingFee = Number(storeConfig?.shippingConfig?.methods?.find((m: any) => m?.enabled !== false)?.baseCost) || 0;
	const defaultCurrency = storeConfig?.orderSettings?.defaultCurrency ?? "NGN";
	// Free shipping is threshold AND region. The cart has no delivery address
	// yet, so this is a preview: name the regions rather than promise the
	// waiver. The backend is the authority and re-decides at checkout.
	const freeShippingRegions: string[] = storeConfig?.orderSettings?.freeShippingRegions ?? [];

	const calculations = useMemo(() => {
		const subtotal = total || 0;
		const shipping = subtotal >= freeShippingThreshold ? 0 : shippingFee;
		const tax = Math.round(subtotal * taxRate);
		const finalTotal = subtotal + shipping + tax;
		const remainingForFreeShipping = Math.max(
			0,
			freeShippingThreshold - subtotal
		);

		return {
			subtotal,
			shipping,
			tax,
			taxRate,
			finalTotal,
			freeShippingThreshold,
			remainingForFreeShipping,
			hasQualifiedForFreeShipping: subtotal >= freeShippingThreshold,
		};
	}, [total, taxRate, freeShippingThreshold, shippingFee]);

	// The free-shipping threshold now comes from the admin-owned settings slice
	// (see useFreeShipping) — nothing to push into the cart slice here.

	const handleClearCart = useCallback(async () => {
		if (!showClearConfirm) {
			setShowClearConfirm(true);
			return;
		}

		setIsClearing(true);
		try {
			// Clear backend cart first, then local state
			await dispatch(clearCartAsync()).unwrap();
			dispatch(clearCart());
			setShowClearConfirm(false);
		} catch (error) {
			// Even if backend fails, clear local state
			dispatch(clearCart());
			setShowClearConfirm(false);
		} finally {
			setIsClearing(false);
		}
	}, [dispatch, showClearConfirm]);

	const getItemImage = (item: any): string => {
		return (item as any).photos?.[0]?.url || item.image || "";
	};

	const isItemInStock = (item: any): boolean => {
		return (item as any).unit > 0 || item.inStock;
	};

	const shippingProgress = useMemo(() => {
		if (!calculations) return 0;
		return Math.min(
			100,
			(calculations.subtotal / calculations.freeShippingThreshold) * 100
		);
	}, [calculations]);

	// --- Loading State ---
	// Only when there is nothing to show yet. Once the cart has items, a sync
	// refreshes them in place rather than collapsing the page into a loader.
	if ((loading || (syncing && isAuthenticated)) && items.length === 0) {
		return (
			<Layout>
				<PageLoader fullScreen={false} message="Loading your cart..." />
			</Layout>
		);
	}

	// --- Error State: only block if cart is truly empty AND there's an error ---
	if (error && items.length === 0 && !syncing) {
		return (
			<Layout>
				<div className="page-wrapper py-16 text-center">
					<div
						style={{
							width: "80px",
							height: "80px",
							borderRadius: "50%",
							backgroundColor: "rgba(239, 68, 68, 0.1)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							margin: "0 auto 1.5rem",
						}}
					>
						<AlertTriangle style={{ width: "36px", height: "36px", color: "#ef4444" }} />
					</div>
					<h2
						style={{
							fontSize: "1.25rem",
							fontWeight: 700,
							color: "var(--text-primary)",
							marginBottom: "0.5rem",
						}}
					>
						Unable to load your cart
					</h2>
					<p
						style={{
							color: "var(--text-secondary)",
							marginBottom: "1.5rem",
						}}
					>
						{error}
					</p>
					<button
						onClick={() => window.location.reload()}
						className="press-effect"
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: "0.5rem",
							padding: "0.75rem 1.5rem",
							backgroundColor: "#ef4444",
							color: "#fff",
							border: "none",
							borderRadius: "12px",
							fontWeight: 600,
							fontSize: "0.875rem",
							cursor: "pointer",
							transition: "transform 0.15s ease, box-shadow 0.15s ease",
						}}
					>
						<RefreshCw style={{ width: "16px", height: "16px" }} />
						Try Again
					</button>
				</div>
			</Layout>
		);
	}

	// --- Admin users can't shop ---
	if (isAdmin) {
		return (
			<Layout>
				<div className="page-wrapper py-16 md:py-24">
					<div
						className="max-w-md mx-auto text-center rounded-xl p-12"
						style={{ background: "var(--surface-paper)", border: "1px solid var(--border-light)" }}
					>
						<ShoppingBag className="h-16 w-16 mx-auto mb-4" style={{ color: "var(--text-disabled)" }} />
						<h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
							Admin Account
						</h2>
						<p className="text-sm mb-6" style={{ color: "var(--text-hint)" }}>
							Shopping is only available for customer accounts. Switch to a customer account to browse and purchase products.
						</p>
						<Link
							href="/products"
							className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all"
							style={{ border: "1px solid var(--border-medium)", color: "var(--text-secondary)" }}
						>
							Browse Products
						</Link>
					</div>
				</div>
			</Layout>
		);
	}

	// --- Empty State ---
	if (!items || items?.length === 0) {
		return (
			<Layout>
				<div className="page-wrapper py-16 md:py-24">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, ease: "easeOut" }}
						style={{ textAlign: "center", maxWidth: "28rem", margin: "0 auto" }}
					>
						<div
							style={{
								width: "120px",
								height: "120px",
								borderRadius: "50%",
								background: "linear-gradient(135deg, var(--surface-low), var(--surface-medium))",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								margin: "0 auto 2rem",
								position: "relative",
							}}
						>
							<ShoppingBag
								style={{
									width: "48px",
									height: "48px",
									color: "var(--text-hint)",
								}}
							/>
							<div
								style={{
									position: "absolute",
									top: "8px",
									right: "8px",
									width: "24px",
									height: "24px",
									borderRadius: "50%",
									backgroundColor: "var(--surface-high)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontSize: "0.75rem",
									fontWeight: 700,
									color: "var(--text-hint)",
								}}
							>
								0
							</div>
						</div>
						<h2
							style={{
								fontSize: "1.75rem",
								fontWeight: 800,
								color: "var(--text-primary)",
								marginBottom: "0.75rem",
								letterSpacing: "-0.02em",
							}}
						>
							Your cart is empty
						</h2>
						<p
							style={{
								color: "var(--text-secondary)",
								fontSize: "1rem",
								lineHeight: 1.6,
								marginBottom: "2rem",
							}}
						>
							Looks like you haven't added any items to your cart yet.
							Discover our premium supplements and start your wellness journey.
						</p>
						<Link href="/products">
							<button
								className="press-effect"
								style={{
									display: "inline-flex",
									alignItems: "center",
									gap: "0.5rem",
									padding: "0.875rem 2rem",
									backgroundColor: "var(--color-primary)",
									color: "#fff",
									border: "none",
									borderRadius: "12px",
									fontWeight: 600,
									fontSize: "1rem",
									cursor: "pointer",
									transition: "transform 0.15s ease, box-shadow 0.2s ease",
									boxShadow: "0 4px 14px rgba(22, 163, 74, 0.3)",
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.transform = "translateY(-2px)";
									e.currentTarget.style.boxShadow = "0 6px 20px rgba(22, 163, 74, 0.4)";
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.transform = "translateY(0)";
									e.currentTarget.style.boxShadow = "0 4px 14px rgba(22, 163, 74, 0.3)";
								}}
							>
								Browse Products
								<ArrowLeft style={{ width: "16px", height: "16px", transform: "rotate(180deg)" }} />
							</button>
						</Link>
					</motion.div>
				</div>
			</Layout>
		);
	}

	// --- Main Cart ---
	return (
		<Layout>
			<div className="page-wrapper py-8 md:py-12">
				{/* Header */}
				<motion.div
					initial="hidden"
					animate="visible"
					variants={fadeUp}
					className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4"
				>
					<div className="flex items-center gap-4">
						<Link
							href="/products"
							aria-label="Back to products"
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								width: "40px",
								height: "40px",
								borderRadius: "12px",
								backgroundColor: "var(--surface-low)",
								border: "1px solid var(--border-light)",
								color: "var(--text-secondary)",
								transition: "all 0.2s ease",
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = "var(--surface-medium)";
								e.currentTarget.style.color = "var(--text-primary)";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = "var(--surface-low)";
								e.currentTarget.style.color = "var(--text-secondary)";
							}}
						>
							<ArrowLeft style={{ width: "18px", height: "18px" }} />
						</Link>
						<h1
							className="flex items-center gap-3"
							style={{
								fontSize: "clamp(1.25rem, 3vw, 1.875rem)",
								fontWeight: 800,
								color: "var(--text-primary)",
								letterSpacing: "-0.02em",
								margin: 0,
							}}
						>
							Shopping Cart
							<span
								style={{
									display: "inline-flex",
									alignItems: "center",
									justifyContent: "center",
									minWidth: "28px",
									height: "28px",
									padding: "0 8px",
									borderRadius: "14px",
									backgroundColor: "var(--color-primary)",
									color: "#fff",
									fontSize: "0.8rem",
									fontWeight: 700,
								}}
							>
								{itemCount}
							</span>
						</h1>
					</div>

					<div className="flex items-center gap-2">
						<AnimatePresence mode="wait">
							{showClearConfirm ? (
								<motion.div
									key="confirm"
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.95 }}
									className="flex items-center gap-2"
								>
									<span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
										Clear all items?
									</span>
									<button
										onClick={handleClearCart}
										disabled={isClearing}
										className="press-effect"
										style={{
											padding: "0.5rem 1rem",
											backgroundColor: "#ef4444",
											color: "#fff",
											border: "none",
											borderRadius: "8px",
											fontSize: "0.8rem",
											fontWeight: 600,
											cursor: "pointer",
											opacity: isClearing ? 0.6 : 1,
											transition: "opacity 0.2s ease",
										}}
									>
										{isClearing ? "Clearing..." : "Confirm"}
									</button>
									<button
										onClick={() => setShowClearConfirm(false)}
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											width: "32px",
											height: "32px",
											borderRadius: "8px",
											border: "1px solid var(--border-light)",
											backgroundColor: "transparent",
											color: "var(--text-secondary)",
											cursor: "pointer",
											transition: "background-color 0.2s ease",
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.backgroundColor = "var(--surface-low)";
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.backgroundColor = "transparent";
										}}
									>
										<X style={{ width: "14px", height: "14px" }} />
									</button>
								</motion.div>
							) : (
								<motion.button
									key="clear"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									onClick={() => setShowClearConfirm(true)}
									disabled={isClearing}
									style={{
										padding: "0.5rem 1rem",
										backgroundColor: "transparent",
										color: "#ef4444",
										border: "1px solid transparent",
										borderRadius: "8px",
										fontSize: "0.875rem",
										fontWeight: 600,
										cursor: "pointer",
										transition: "all 0.2s ease",
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.08)";
										e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.backgroundColor = "transparent";
										e.currentTarget.style.borderColor = "transparent";
									}}
								>
									<span className="flex items-center gap-1.5">
										<Trash2 style={{ width: "14px", height: "14px" }} />
										Clear Cart
									</span>
								</motion.button>
							)}
						</AnimatePresence>
					</div>
				</motion.div>

				{/* Free Shipping Progress Bar */}
				{!calculations?.hasQualifiedForFreeShipping &&
					calculations?.remainingForFreeShipping > 0 && (
						<motion.div
							initial="hidden"
							animate="visible"
							variants={fadeUp}
							style={{
								padding: "1rem 1.25rem",
								borderRadius: "14px",
								backgroundColor: "var(--surface-paper)",
								border: "1px solid var(--border-light)",
								boxShadow: "var(--shadow-sm)",
								marginBottom: "1.5rem",
							}}
						>
							<div className="flex items-center justify-between mb-2.5">
								<span className="flex items-center gap-2" style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
									<Truck style={{ width: "16px", height: "16px", color: "var(--color-primary)" }} />
									Free shipping progress
								</span>
								<span className="tabular-nums" style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--color-primary)" }}>
									{"\u20A6"}{calculations?.remainingForFreeShipping.toLocaleString()} away
								</span>
							</div>
							{freeShippingRegions.length > 0 && (
								<p className="mb-2.5" style={{ fontSize: "0.72rem", color: "var(--text-hint)" }}>
									Applies to deliveries within {freeShippingRegions.join(", ")}.
								</p>
							)}
							<div
								style={{
									width: "100%",
									height: "8px",
									borderRadius: "4px",
									backgroundColor: "var(--surface-medium)",
									overflow: "hidden",
								}}
							>
								<motion.div
									initial={{ width: 0 }}
									animate={{ width: `${shippingProgress}%` }}
									transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
									style={{
										height: "100%",
										borderRadius: "4px",
										background: `linear-gradient(90deg, var(--color-primary), var(--color-primary-light))`,
									}}
								/>
							</div>
						</motion.div>
					)}

				{/* Qualified for free shipping */}
				{calculations?.hasQualifiedForFreeShipping && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						style={{
							padding: "0.75rem 1.25rem",
							borderRadius: "14px",
							backgroundColor: "var(--surface-paper)",
							border: "1px solid var(--color-primary)",
							boxShadow: "var(--shadow-sm)",
							marginBottom: "1.5rem",
							display: "flex",
							alignItems: "center",
							gap: "0.75rem",
						}}
					>
						<Truck style={{ width: "18px", height: "18px", color: "var(--color-primary)", flexShrink: 0 }} />
						<span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-primary)" }}>
							You have qualified for free shipping!
						</span>
					</motion.div>
				)}

				{/* Main Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Cart Items Column */}
					<div className="lg:col-span-2">
						<AnimatePresence mode="popLayout">
							{items?.map((item, index) => (
								<motion.div
									key={item?.id}
									custom={index}
									variants={itemVariants}
									initial="hidden"
									animate="visible"
									exit="exit"
									layout
									style={{
										backgroundColor: "var(--surface-paper)",
										borderRadius: "16px",
										border: "1px solid var(--border-light)",
										boxShadow: "var(--shadow-sm)",
										marginBottom: "0.75rem",
										overflow: "hidden",
										transition: "box-shadow 0.2s ease",
									}}
									onMouseEnter={(e) => {
										(e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
									}}
									onMouseLeave={(e) => {
										(e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
									}}
								>
									{/* Item Error */}
									{errors[item?.id] && (
										<div
											style={{
												padding: "0.5rem 1rem",
												backgroundColor: "rgba(239, 68, 68, 0.08)",
												borderBottom: "1px solid rgba(239, 68, 68, 0.15)",
												color: "#ef4444",
												fontSize: "0.8rem",
												fontWeight: 500,
											}}
										>
											{errors[item?.id]}
										</div>
									)}

									<div className="p-4 md:p-5">
										<div className="flex gap-4 md:gap-6 items-center">
											{/* Product Image */}
											<div
												style={{
													width: "88px",
													height: "88px",
													borderRadius: "12px",
													overflow: "hidden",
													backgroundColor: "var(--surface-low)",
													flexShrink: 0,
													position: "relative",
												}}
											>
												<Image
													height={88}
													width={88}
													src={getItemImage(item)}
													alt={item?.name}
													style={{
														width: "100%",
														height: "100%",
														objectFit: "cover",
													}}
													onError={(e) => {
														const target = e.target as HTMLImageElement;
														target.src = "/placeholder-product.jpg";
													}}
												/>
											</div>

											{/* Product Info & Controls */}
											<div className="flex-1 min-w-0">
												<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
													{/* Name & Category */}
													<div className="min-w-0">
														<h3
															style={{
																fontWeight: 700,
																fontSize: "1rem",
																color: "var(--text-primary)",
																margin: "0 0 0.25rem 0",
																lineHeight: 1.3,
																overflow: "hidden",
																textOverflow: "ellipsis",
																whiteSpace: "nowrap",
															}}
														>
															{item?.name}
														</h3>
														<p
															style={{
																fontSize: "0.8rem",
																color: "var(--text-hint)",
																margin: 0,
															}}
														>
															{(item as any)?.product?.name || item?.category || ""}
														</p>
														{formatWeight(item?.weightValue, item?.weightUnit) && (
															<p
																style={{
																	fontSize: "0.8rem",
																	color: "var(--text-hint)",
																	margin: "0.15rem 0 0 0",
																}}
															>
																{formatWeight(item?.weightValue, item?.weightUnit)}
															</p>
														)}
														{(() => {
															const availableStock = (item as any).unit ?? (item as any).availableQuantity;
															return availableStock !== undefined && availableStock > 0 && availableStock <= 5 ? (
																<p
																	style={{
																		fontSize: "0.75rem",
																		color: "#f59e0b",
																		fontWeight: 600,
																		margin: "0.25rem 0 0 0",
																	}}
																>
																	Only {availableStock} left in stock
																</p>
															) : null;
														})()}
													</div>

													{/* Quantity + Price + Remove */}
													<div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
														{/* Quantity Controls */}
														<div
															className="flex items-center"
															style={{
																borderRadius: "10px",
																border: "1px solid var(--border-light)",
																backgroundColor: "var(--surface-low)",
																overflow: "hidden",
															}}
														>
															<button
																onClick={() =>
																	handleQuantityChange(
																		item?.id,
																		item?.quantity - 1,
																		Number((item as any).availableQuantity ?? (item as any).unit ?? 99)
																	)
																}
																disabled={
																	isUpdating === item?.id ||
																	item?.quantity <= 1
																}
																className="press-effect"
																aria-label="Decrease quantity"
																style={{
																	display: "flex",
																	alignItems: "center",
																	justifyContent: "center",
																	width: "34px",
																	height: "34px",
																	border: "none",
																	backgroundColor: "transparent",
																	color: "var(--text-secondary)",
																	cursor: "pointer",
																	transition: "background-color 0.15s ease",
																	opacity:
																		isUpdating === item?.id ||
																		item?.quantity <= 1
																			? 0.4
																			: 1,
																}}
																onMouseEnter={(e) => {
																	if (!(isUpdating === item?.id || item?.quantity <= 1)) {
																		e.currentTarget.style.backgroundColor = "var(--surface-medium)";
																	}
																}}
																onMouseLeave={(e) => {
																	e.currentTarget.style.backgroundColor = "transparent";
																}}
															>
																<Minus style={{ width: "14px", height: "14px" }} />
															</button>

															<div
																className="tabular-nums"
																style={{
																	width: "36px",
																	textAlign: "center",
																	fontWeight: 700,
																	fontSize: "0.95rem",
																	color: "var(--text-primary)",
																	userSelect: "none",
																}}
															>
																{isUpdating === item?.id ? (
																	<RefreshCw
																		className="animate-spin"
																		style={{
																			width: "14px",
																			height: "14px",
																			margin: "0 auto",
																			color: "var(--text-hint)",
																		}}
																	/>
																) : (
																	<motion.span
																		key={item?.quantity}
																		initial={{ scale: 1.3, opacity: 0.5 }}
																		animate={{ scale: 1, opacity: 1 }}
																		transition={{ duration: 0.2 }}
																	>
																		{item?.quantity}
																	</motion.span>
																)}
															</div>

															<button
																onClick={() =>
																	handleQuantityChange(
																		item?.id,
																		item?.quantity + 1,
																		Number((item as any).availableQuantity ?? (item as any).unit ?? 99)
																	)
																}
																disabled={
																	isUpdating === item?.id ||
																	(isItemInStock(item) &&
																		item?.quantity >= 10)
																}
																className="press-effect"
																aria-label="Increase quantity"
																style={{
																	display: "flex",
																	alignItems: "center",
																	justifyContent: "center",
																	width: "34px",
																	height: "34px",
																	border: "none",
																	backgroundColor: "transparent",
																	color: "var(--text-secondary)",
																	cursor: "pointer",
																	transition: "background-color 0.15s ease",
																	opacity:
																		isUpdating === item?.id ||
																		(isItemInStock(item) &&
																			item?.quantity >= 10)
																			? 0.4
																			: 1,
																}}
																onMouseEnter={(e) => {
																	if (
																		!(
																			isUpdating === item?.id ||
																			(isItemInStock(item) &&
																				item?.quantity >= 10)
																		)
																	) {
																		e.currentTarget.style.backgroundColor = "var(--surface-medium)";
																	}
																}}
																onMouseLeave={(e) => {
																	e.currentTarget.style.backgroundColor = "transparent";
																}}
															>
																<Plus style={{ width: "14px", height: "14px" }} />
															</button>
														</div>

														{/* Price */}
														<div style={{ textAlign: "right", minWidth: "80px" }}>
															<motion.div
																key={item?.price * item?.quantity}
																initial={{ scale: 1.05, opacity: 0.7 }}
																animate={{ scale: 1, opacity: 1 }}
																transition={{ duration: 0.25 }}
																className="tabular-nums"
																style={{
																	fontWeight: 700,
																	fontSize: "1.05rem",
																	color: "var(--color-primary)",
																	lineHeight: 1.3,
																}}
															>
																{"\u20A6"}{(item?.price * item?.quantity).toLocaleString()}
															</motion.div>
															<div
																className="tabular-nums"
																style={{
																	fontSize: "0.75rem",
																	color: "var(--text-hint)",
																	marginTop: "2px",
																}}
															>
																{"\u20A6"}{item?.price.toLocaleString()} each
															</div>
														</div>

														{/* Remove Button */}
														<button
															onClick={() => handleRemoveItem(item?.id)}
															disabled={isUpdating === item?.id}
															aria-label="Remove item"
															style={{
																display: "flex",
																alignItems: "center",
																justifyContent: "center",
																width: "36px",
																height: "36px",
																borderRadius: "10px",
																border: "none",
																backgroundColor: "transparent",
																color: "var(--text-hint)",
																cursor: "pointer",
																transition: "all 0.2s ease",
																opacity: isUpdating === item?.id ? 0.4 : 1,
															}}
															onMouseEnter={(e) => {
																e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
																e.currentTarget.style.color = "#ef4444";
															}}
															onMouseLeave={(e) => {
																e.currentTarget.style.backgroundColor = "transparent";
																e.currentTarget.style.color = "var(--text-hint)";
															}}
														>
															<Trash2 style={{ width: "16px", height: "16px" }} />
														</button>
													</div>
												</div>
											</div>
										</div>
									</div>
								</motion.div>
							))}
						</AnimatePresence>
					</div>

					{/* Order Summary */}
					<div className="lg:col-span-1">
						<motion.div
							initial="hidden"
							animate="visible"
							variants={fadeUp}
							className="sticky top-24"
							style={{
								backgroundColor: "var(--surface-paper)",
								borderRadius: "16px",
								border: "1px solid var(--border-light)",
								boxShadow: "var(--shadow-md)",
								padding: "1.5rem",
							}}
						>
							<h2
								style={{
									fontSize: "1.15rem",
									fontWeight: 800,
									color: "var(--text-primary)",
									margin: "0 0 1.25rem 0",
									letterSpacing: "-0.01em",
								}}
							>
								Order Summary
							</h2>

							{/* Line Items */}
							<div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
								<div className="flex justify-between items-center">
									<span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
										Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
									</span>
									<motion.span
										key={calculations?.subtotal}
										initial={{ opacity: 0.6, y: -4 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.25 }}
										className="tabular-nums"
										style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}
									>
										{"\u20A6"}{calculations?.subtotal?.toLocaleString()}
									</motion.span>
								</div>

								<div className="flex justify-between items-center">
									<span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
										Shipping
										{calculations?.hasQualifiedForFreeShipping && (
											<span style={{ color: "var(--color-primary)", marginLeft: "4px", fontWeight: 600 }}>
												(Free!)
											</span>
										)}
									</span>
									<motion.span
										key={calculations?.shipping}
										initial={{ opacity: 0.6 }}
										animate={{ opacity: 1 }}
										transition={{ duration: 0.25 }}
										className="tabular-nums"
										style={{
											fontSize: "0.9rem",
											fontWeight: 600,
											color: calculations?.shipping === 0 ? "var(--color-primary)" : "var(--text-primary)",
										}}
									>
										{calculations?.shipping === 0 ? "Free" : `\u20A6${calculations?.shipping?.toLocaleString()}`}
									</motion.span>
								</div>

								<div className="flex justify-between items-center">
									<span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
										Tax ({formatRateAsPercent(calculations.taxRate)})
									</span>
									<motion.span
										key={calculations?.tax}
										initial={{ opacity: 0.6, y: -4 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.25 }}
										className="tabular-nums"
										style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}
									>
										{"\u20A6"}{calculations?.tax?.toLocaleString()}
									</motion.span>
								</div>
							</div>

							{/* Divider */}
							<div
								style={{
									height: "1px",
									backgroundColor: "var(--border-light)",
									margin: "1.25rem 0",
								}}
							/>

							{/* Total */}
							<div className="flex justify-between items-center">
								<span
									style={{
										fontSize: "1rem",
										fontWeight: 700,
										color: "var(--text-primary)",
									}}
								>
									Total
								</span>
								<motion.span
									key={calculations?.finalTotal}
									initial={{ scale: 1.08, opacity: 0.7 }}
									animate={{ scale: 1, opacity: 1 }}
									transition={{ duration: 0.3 }}
									className="tabular-nums"
									style={{
										fontSize: "1.5rem",
										fontWeight: 800,
										color: "var(--color-primary)",
										letterSpacing: "-0.01em",
									}}
								>
									{"\u20A6"}{calculations?.finalTotal?.toLocaleString()}
								</motion.span>
							</div>

							{/* Checkout Button */}
							<div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
								<Link href="/checkout" style={{ display: "block" }}>
									<button
										className="press-effect"
										style={{
											width: "100%",
											padding: "0.875rem 1.5rem",
											backgroundColor: "var(--color-primary)",
											color: "#fff",
											border: "none",
											borderRadius: "12px",
											fontWeight: 700,
											fontSize: "1rem",
											cursor: "pointer",
											transition: "transform 0.2s ease, box-shadow 0.2s ease",
											boxShadow: "0 4px 14px rgba(22, 163, 74, 0.3)",
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.transform = "translateY(-2px)";
											e.currentTarget.style.boxShadow = "0 8px 24px rgba(22, 163, 74, 0.4)";
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.transform = "translateY(0)";
											e.currentTarget.style.boxShadow = "0 4px 14px rgba(22, 163, 74, 0.3)";
										}}
									>
										Proceed to Checkout
									</button>
								</Link>

								<Link href="/products" style={{ display: "block" }}>
									<button
										style={{
											width: "100%",
											padding: "0.75rem 1.5rem",
											backgroundColor: "transparent",
											color: "var(--text-secondary)",
											border: "1px solid var(--border-light)",
											borderRadius: "12px",
											fontWeight: 600,
											fontSize: "0.9rem",
											cursor: "pointer",
											transition: "all 0.2s ease",
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.backgroundColor = "var(--surface-low)";
											e.currentTarget.style.borderColor = "var(--border-medium)";
											e.currentTarget.style.color = "var(--text-primary)";
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.backgroundColor = "transparent";
											e.currentTarget.style.borderColor = "var(--border-light)";
											e.currentTarget.style.color = "var(--text-secondary)";
										}}
									>
										Continue Shopping
									</button>
								</Link>
							</div>

							{/* Security Badge */}
							<div
								style={{
									marginTop: "1.25rem",
									padding: "0.75rem",
									borderRadius: "10px",
									backgroundColor: "var(--surface-low)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									gap: "1.25rem",
								}}
							>
								<div className="flex items-center gap-1.5" style={{ color: "var(--text-hint)", fontSize: "0.7rem" }}>
									<ShieldCheck style={{ width: "14px", height: "14px" }} />
									<span>Secure</span>
								</div>
								<div className="flex items-center gap-1.5" style={{ color: "var(--text-hint)", fontSize: "0.7rem" }}>
									<Lock style={{ width: "14px", height: "14px" }} />
									<span>Encrypted</span>
								</div>
								<div className="flex items-center gap-1.5" style={{ color: "var(--text-hint)", fontSize: "0.7rem" }}>
									<Truck style={{ width: "14px", height: "14px" }} />
									<span>Tracked</span>
								</div>
							</div>
						</motion.div>
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default CartPage;
