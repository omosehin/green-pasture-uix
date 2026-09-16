import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { CheckCircle, Package, MapPin, Calendar, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

import Layout from "@/_components/Layout";
import { useAppDispatch, useAppSelector } from "@/_redux/store";
import { orderAction } from "@/_redux/actions/order.action";
import { appConstants } from "@/_redux/constants";
import Badge from "@/_UI/Badge";
import Button from "@/_UI/Button";
import PageLoader from "@/_UI/PageLoader";
import Card from "@/_UI/Card";
import { formatCurrency } from "@/_UI/FormatValue";
import { formatWeight } from "@/_utils/formatWeight";
import { BackendOrder, BackendOrderItem } from "@/types";

const getStatusVariant = (status: string): "success" | "warning" | "error" | "info" | "neutral" => {
	switch (status?.toUpperCase()) {
		case "PENDING":
			return "warning";
		case "PROCESSING":
			return "info";
		case "SHIPPED":
			return "info";
		case "DELIVERED":
		case "COMPLETED":
			return "success";
		case "CANCELLED":
		case "REFUNDED":
			return "error";
		default:
			return "neutral";
	}
};

const getEstimatedDelivery = (createdAt: string): string => {
	const orderDate = new Date(createdAt);
	const deliveryDate = new Date(orderDate);
	deliveryDate.setDate(deliveryDate.getDate() + 7);
	return deliveryDate.toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
};

const OrderConfirmationPage: React.FC = () => {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { isAuthenticated, user } = useAppSelector((state) => state.auth);
	const isAdmin = appConstants.ADMIN_ROLES.includes(user?.profileType?.toUpperCase() as any || "");

	const [order, setOrder] = useState<BackendOrder | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!isAuthenticated) {
			router.replace("/login");
			return;
		}
		if (isAdmin) {
			router.replace("/");
			return;
		}
	}, [isAuthenticated, isAdmin, router]);

	useEffect(() => {
		if (!router.isReady || !router.query.id) return;
		if (!isAuthenticated || isAdmin) return;

		const orderReference = router.query.id as string;

		setLoading(true);
		dispatch(orderAction.fetchMyOrderDetailAsync(orderReference))
			.unwrap()
			.then((res: any) => {
				setOrder(res?.data ?? res);
			})
			.catch(() => {
				setOrder(null);
			})
			.finally(() => {
				setLoading(false);
			});
	}, [router.isReady, router.query.id, isAuthenticated, isAdmin, dispatch]);

	if (!isAuthenticated || isAdmin) {
		return (
			<Layout pageTitle="Order Confirmation">
				<PageLoader message="Redirecting..." />
			</Layout>
		);
	}

	if (loading) {
		return (
			<Layout pageTitle="Order Confirmation">
				<PageLoader fullScreen={false} message="Loading order details..." />
			</Layout>
		);
	}

	if (!order) {
		return (
			<Layout pageTitle="Order Confirmation">
				<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
					<Card padding="lg">
						<p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
							Order not found
						</p>
						<div className="mt-6">
							<Button variant="filled" onClick={() => router.push("/products")}>
								Continue Shopping
							</Button>
						</div>
					</Card>
				</div>
			</Layout>
		);
	}

	const subtotal = (order.items ?? []).reduce(
		(sum: number, item: BackendOrderItem) => sum + item.unitPrice * item.quantity,
		0,
	);
	const taxAndShipping = order.totalAmount - subtotal;
	const tax = taxAndShipping > 0 ? taxAndShipping : 0;

	return (
		<Layout pageTitle="Order Confirmed">
			<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-page-enter">
				{/* Success Header */}
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="text-center py-8"
				>
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
						className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full"
						style={{ background: "rgba(22,163,74,0.1)" }}
					>
						<div
							className="flex h-14 w-14 items-center justify-center rounded-full"
							style={{ background: "var(--color-primary)" }}
						>
							<CheckCircle size={28} className="text-white" strokeWidth={2.5} />
						</div>
					</motion.div>

					<motion.h1
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.25 }}
						className="text-2xl md:text-3xl font-bold mb-2"
						style={{ color: "var(--text-primary)" }}
					>
						Order Confirmed!
					</motion.h1>
					<motion.p
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.35 }}
						className="text-sm"
						style={{ color: "var(--text-secondary)" }}
					>
						Thank you for your purchase. Your order has been placed successfully.
					</motion.p>
				</motion.div>

				{/* Order Reference & Status */}
				<Card padding="md">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
						<div>
							<p className="text-xs font-medium mb-1" style={{ color: "var(--text-hint)" }}>
								Order Reference
							</p>
							<p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
								#{order.orderReference}
							</p>
						</div>
						<Badge variant={getStatusVariant(order.orderStatus)} dot>
							{order.orderStatus}
						</Badge>
					</div>
				</Card>

				{/* Items Ordered */}
				<Card padding="none">
					<div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-light)" }}>
						<h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
							<Package size={16} style={{ color: "var(--color-primary)" }} />
							Items Ordered
						</h2>
					</div>
					<div className="divide-y" style={{ borderColor: "var(--border-light)" }}>
						{(order.items ?? []).map((orderItem: BackendOrderItem) => {
							const imgSrc = (orderItem.item as any)?.photos?.[0]?.url || "";
							return (
								<div key={orderItem.id} className="flex items-center gap-4 px-5 py-4">
									<div
										className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg"
										style={{ background: "var(--surface-low)" }}
									>
										{imgSrc ? (
											<Image
												height={56}
												width={56}
												src={imgSrc}
												alt={orderItem.item?.name ?? ""}
												className="h-full w-full object-cover"
											/>
										) : (
											<div
												className="flex h-full w-full items-center justify-center text-xs"
												style={{ color: "var(--text-secondary)" }}
											>
												No img
											</div>
										)}
									</div>
									<div className="flex-1 min-w-0">
										<h4
											className="text-sm font-medium truncate"
											style={{ color: "var(--text-primary)" }}
										>
											{orderItem.itemName ?? orderItem.item?.name ?? "Unknown Item"}
										</h4>
										<p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
											{[
												formatWeight(orderItem.weightValue ?? orderItem.item?.weightValue, orderItem.weightUnit ?? orderItem.item?.weightUnit),
												`Qty: ${orderItem.quantity} x ${formatCurrency(orderItem.unitPrice)}`,
											]
												.filter(Boolean)
												.join(" · ")}
										</p>
									</div>
									<span
										className="text-sm font-semibold tabular-nums shrink-0"
										style={{ color: "var(--text-primary)" }}
									>
										{formatCurrency(orderItem.quantity * orderItem.unitPrice)}
									</span>
								</div>
							);
						})}
					</div>
				</Card>

				{/* Pricing Breakdown */}
				<Card padding="md">
					<h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
						<ShoppingBag size={16} style={{ color: "var(--color-primary)" }} />
						Pricing Summary
					</h2>
					<div className="space-y-2.5">
						<div className="flex justify-between text-sm">
							<span style={{ color: "var(--text-secondary)" }}>Subtotal</span>
							<span className="font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>
								{formatCurrency(subtotal)}
							</span>
						</div>
						{tax > 0 && (
							<div className="flex justify-between text-sm">
								<span style={{ color: "var(--text-secondary)" }}>Tax & Shipping</span>
								<span className="font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>
									{formatCurrency(tax)}
								</span>
							</div>
						)}
						<div className="h-px w-full" style={{ background: "var(--border-light)" }} />
						<div className="flex justify-between items-center pt-1">
							<span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
								Total
							</span>
							<span className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
								{formatCurrency(order.totalAmount)}
							</span>
						</div>
					</div>
				</Card>

				{/* Shipping Address */}
				{(order as any).shippingAddress && (
					<Card padding="md">
						<h2
							className="text-sm font-semibold mb-3 flex items-center gap-2"
							style={{ color: "var(--text-primary)" }}
						>
							<MapPin size={16} style={{ color: "var(--color-primary)" }} />
							Shipping Address
						</h2>
						<p className="text-sm" style={{ color: "var(--text-secondary)" }}>
							{typeof (order as any).shippingAddress === "object"
								? [
										(order as any).shippingAddress.street || (order as any).shippingAddress.houseAddress,
										(order as any).shippingAddress.city,
										(order as any).shippingAddress.state,
										(order as any).shippingAddress.country,
										(order as any).shippingAddress.postalCode,
								  ]
										.filter(Boolean)
										.join(", ")
								: (order as any).shippingAddress}
						</p>
					</Card>
				)}

				{/* Estimated Delivery */}
				<Card padding="md">
					<h2
						className="text-sm font-semibold mb-3 flex items-center gap-2"
						style={{ color: "var(--text-primary)" }}
					>
						<Calendar size={16} style={{ color: "var(--color-primary)" }} />
						Estimated Delivery
					</h2>
					<p className="text-sm" style={{ color: "var(--text-secondary)" }}>
						{getEstimatedDelivery(order.createdAt)}
					</p>
				</Card>

				{/* Action Buttons */}
				<div className="flex flex-col sm:flex-row gap-3 pt-2 pb-8">
					<Button
						variant="filled"
						size="lg"
						fullWidth
						onClick={() => router.push("/products")}
					>
						Continue Shopping
					</Button>
					<Button
						variant="outlined"
						size="lg"
						fullWidth
						onClick={() => router.push("/my-orders")}
					>
						View My Orders
					</Button>
				</div>
			</div>
		</Layout>
	);
};

export default OrderConfirmationPage;
