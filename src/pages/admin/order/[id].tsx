import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import withAdminAuth from "@/_components/withAdminAuth";
import AdminLayout from "@/_components/AdminLayout";
import { BackButton, DetailHeader, DetailSection, DetailRow } from "@/_UI/DetailField";
import Badge from "@/_UI/Badge";
import Button from "@/_UI/Button";
import { DataTable } from "@/_components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { formatCurrency } from "@/_UI/FormatValue";
import { formatWeight } from "@/_utils/formatWeight";
import { FormInput, FormSelect } from "@/_UI/FormField";
import PageLoader from "@/_UI/PageLoader";
import toast from "react-hot-toast";
import axiosInstance from "@/_utils/axiosInstance";
import { BackendOrder, BackendOrderItem } from "@/types";

const getStatusBadgeVariant = (status: string): "success" | "warning" | "error" | "info" | "neutral" => {
	switch (status?.toUpperCase()) {
		case "PENDING":
			return "warning";
		case "PROCESSING":
		case "ON_HOLD":
			return "info";
		case "COMPLETED":
		case "DELIVERED":
			return "success";
		case "CANCELLED":
		case "FAILED":
			return "error";
		default:
			return "neutral";
	}
};

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
	PENDING: ["PROCESSING", "CANCELLED", "ON_HOLD"],
	PROCESSING: ["COMPLETED", "CANCELLED", "ON_HOLD"],
	COMPLETED: ["DELIVERED", "RETURNED"],
	ON_HOLD: ["PROCESSING", "CANCELLED"],
	DELIVERED: ["RETURNED", "EXCHANGED"],
};

const OrderDetail: React.FC = () => {
	const router = useRouter();
	const { id } = router.query;
	const [order, setOrder] = useState<BackendOrder | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [selectedStatus, setSelectedStatus] = useState("");
	const [statusNote, setStatusNote] = useState("");
	const [updatingStatus, setUpdatingStatus] = useState(false);

	// `silent` refreshes in place: the toolbar icon spins but the page keeps its
	// content, instead of collapsing back into the full-page loader.
	const fetchOrder = (silent = false) => {
		if (!id) return;
		silent ? setRefreshing(true) : setLoading(true);
		axiosInstance
			.get(`order/admin/ref/${id}`)
			.then((res) => {
				setOrder(res.data?.data ?? res.data);
			})
			.catch(() => {
				setOrder(null);
				toast.error("Failed to load order");
			})
			.finally(() => {
				setLoading(false);
				setRefreshing(false);
			});
	};

	useEffect(() => {
		if (!router.isReady || !id) return;
		fetchOrder();
	}, [id, router.isReady]);

	const allowedNextStatuses = useMemo(() => {
		if (!order?.orderStatus) return [];
		return ALLOWED_TRANSITIONS[order.orderStatus] || [];
	}, [order?.orderStatus]);

	const handleStatusUpdate = async () => {
		if (!selectedStatus || !id) return;
		setUpdatingStatus(true);
		try {
			const res = await axiosInstance.patch(`order/status/${order?.id}`, {
				status: selectedStatus,
				...(statusNote.trim() && { note: statusNote.trim() }),
			});
			setOrder(res.data?.data ?? res.data);
			setSelectedStatus("");
			setStatusNote("");
			toast.success("Order status updated");
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Failed to update status");
		} finally {
			setUpdatingStatus(false);
		}
	};

	const itemColumns: ColumnDef<BackendOrderItem, any>[] = [
		{
			id: "item",
			accessorKey: "item",
			header: "Item Name",
			enableSorting: false,
			cell: ({ row }) => {
				const name = row.original.itemName ?? row.original.item?.name ?? "\u2014";
				const size = formatWeight(row.original.weightValue ?? row.original.item?.weightValue, row.original.weightUnit ?? row.original.item?.weightUnit);
				return (
					<div>
						<span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
							{name}
						</span>
						{size && (
							<div className="text-xs" style={{ color: "var(--text-secondary)" }}>
								{size}
							</div>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: "quantity",
			header: "Quantity",
			cell: ({ getValue }) => (
				<span className="text-sm" style={{ color: "var(--text-primary)" }}>
					{getValue() as number}
				</span>
			),
		},
		{
			accessorKey: "unitPrice",
			header: "Unit Price",
			cell: ({ getValue }) => (
				<span className="text-sm tabular-nums" style={{ color: "var(--text-primary)" }}>
					{formatCurrency(getValue() as number)}
				</span>
			),
		},
		{
			id: "subtotal",
			header: "Subtotal",
			enableSorting: false,
			cell: ({ row }) => (
				<span className="text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
					{formatCurrency(row.original.quantity * row.original.unitPrice)}
				</span>
			),
		},
	];

	const orderTitle = order ? `Order #${order.orderReference}` : 'Order Details';

	if (loading) {
		return (
			<AdminLayout pageTitle={orderTitle}>
				<PageLoader fullScreen={false} message="Loading order details..." />
			</AdminLayout>
		);
	}

	if (!order) {
		return (
			<AdminLayout pageTitle={orderTitle}>
				<div className="max-w-4xl mx-auto space-y-5 animate-page-enter">
					<BackButton />
					<div
						className="rounded-xl px-6 py-16 text-center"
						style={{ background: "var(--surface-paper)", border: "1px solid var(--border-light)" }}
					>
						<p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
							Order not found
						</p>
					</div>
				</div>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout pageTitle={orderTitle}>
			<div className="max-w-4xl mx-auto space-y-5 animate-page-enter">
				<BackButton />

				<DetailHeader
					title={`Order #${order.orderReference}`}
					subtitle={new Date(order.createdAt).toLocaleDateString("en-US", {
						year: "numeric",
						month: "long",
						day: "numeric",
					})}
					status={
						<Badge variant={getStatusBadgeVariant(order.orderStatus)} dot>
							{order.orderStatus}
						</Badge>
					}
					metrics={[
						{ label: "Total Amount", value: formatCurrency(order.totalAmount) },
						{ label: "Items Count", value: order.items?.length ?? 0 },
					]}
				/>

				<DetailSection title="Order Information">
					<DetailRow label="Order Reference" value={`#${order.orderReference}`} />
					<DetailRow
						label="Status"
						value={
							<Badge variant={getStatusBadgeVariant(order.orderStatus)} dot>
								{order.orderStatus}
							</Badge>
						}
					/>
					<DetailRow label="Total Amount" value={formatCurrency(order.totalAmount)} />
					<DetailRow
						label="Created Date"
						value={new Date(order.createdAt).toLocaleDateString("en-US", {
							year: "numeric",
							month: "long",
							day: "numeric",
							hour: "2-digit",
							minute: "2-digit",
						})}
					/>
				</DetailSection>

				{/* Status Update Section */}
				{allowedNextStatuses.length > 0 && (
					<DetailSection title="Update Status">
						<div className="flex flex-wrap gap-3 items-end p-5">
							<div className="flex-1 min-w-[180px]">
								<FormSelect
									label="New Status"
									value={selectedStatus}
									onChange={(e: any) => setSelectedStatus(e.target.value)}
									options={allowedNextStatuses.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
									placeholder="Select status..."
								/>
							</div>
							<div className="flex-1 min-w-[180px]">
								<FormInput
									label="Note (optional)"
									value={statusNote}
									onChange={(e) => setStatusNote(e.target.value)}
									placeholder="Add a note..."
								/>
							</div>
							<Button
								variant="filled"
								size="md"
								onClick={handleStatusUpdate}
								loading={updatingStatus}
								disabled={!selectedStatus || updatingStatus}
							>
								Update
							</Button>
						</div>
					</DetailSection>
				)}

				{order.customer && (
					<DetailSection title="Customer">
						<DetailRow
							label="Name"
							value={`${order.customer.profile?.firstName ?? ""} ${order.customer.profile?.lastName ?? ""}`}
						/>
						<DetailRow label="Email" value={order.customer.profile?.email} />
						<DetailRow label="Phone" value={order.customer.profile?.phoneNumber ?? "\u2014"} />
					</DetailSection>
				)}

				<DetailSection title="Order Items">
					<DataTable
						columns={itemColumns}
						data={order.items ?? []}
						manualPagination={false}
						onRefresh={() => fetchOrder(true)}
						refreshing={refreshing}
						emptyMessage="No items in this order"
					/>
				</DetailSection>
			</div>
		</AdminLayout>
	);
};

export default withAdminAuth(OrderDetail);
