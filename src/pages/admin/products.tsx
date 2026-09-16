import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import withAdminAuth from "@/_components/withAdminAuth";
import { Plus, Star } from "lucide-react";
import toast from "react-hot-toast";

import { useAppDispatch, useAppSelector } from "@/_redux/store";
import AdminLayout from "@/_components/AdminLayout";
import { DataTable } from "@/_components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import ActionMenu from "@/_UI/ActionMenu";
import Badge from "@/_UI/Badge";
import Button from "@/_UI/Button";
import Modal from "@/_UI/Modal";
import { productsAction } from "@/_redux/actions";
import { adminAction } from "@/_redux/actions/admin.action";
import { formatCurrency } from "@/_UI/FormatValue";
import { useListParams } from "@/_hooks/useListParams";

const VIEW_ICON = (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);

const DELETE_ICON = (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
);

const STATUS_ICON = (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64A9 9 0 1 1 5.64 5.64"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
);

const AdminProducts: React.FC = () => {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { adminItems, adminItemsLoading, adminItemsPagination } = useAppSelector((state) => state.admin);
	const { page: currentPage, pageSize, search: searchTerm, setPage, setSearch, setPageSize } = useListParams();
	const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [statusTarget, setStatusTarget] = useState<any | null>(null);
	const [publishTarget, setPublishTarget] = useState<any | null>(null);
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

	// Extracted so the toolbar's refresh icon re-runs exactly the fetch the page loads with.
	const refresh = useCallback(() => {
		dispatch(adminAction.fetchAdminItemsAsync({ page: currentPage, limit: pageSize, search: searchTerm || undefined }));
	}, [currentPage, searchTerm, pageSize]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const handleStatusUpdate = async () => {
		if (!statusTarget) return;
		const isActive = statusTarget.status === "A";
		setIsUpdatingStatus(true);
		try {
			await dispatch(adminAction.updateItemStatusAsync({ id: statusTarget.id, activate: !isActive })).unwrap();
			toast.success(`Product ${isActive ? "deactivated" : "activated"} successfully`);
			setStatusTarget(null);
		} catch (error: any) {
			toast.error(error || "Failed to update product status");
		} finally {
			setIsUpdatingStatus(false);
		}
	};

	const handlePublishUpdate = async () => {
		if (!publishTarget) return;
		const isPublished = !!publishTarget.published;
		setIsUpdatingStatus(true);
		try {
			await dispatch(adminAction.updateItemPublishedAsync({ id: publishTarget.id, publish: !isPublished })).unwrap();
			toast.success(`Product ${isPublished ? "unpublished" : "published"} successfully`);
			setPublishTarget(null);
			refresh();
		} catch (error: any) {
			toast.error(error || "Failed to update visibility");
		} finally {
			setIsUpdatingStatus(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			await dispatch(productsAction.deleteItemAsync(deleteTarget.id)).unwrap();
			toast.success("Product deleted successfully");
			dispatch(adminAction.fetchAdminItemsAsync({ page: currentPage, limit: pageSize, search: searchTerm || undefined }));
		} catch (error: any) {
			toast.error(error || "Failed to delete product");
		} finally {
			setIsDeleting(false);
			setDeleteTarget(null);
		}
	};

	const columns: ColumnDef<any, any>[] = [
		{
			accessorKey: "name",
			header: "Product",
			meta: { maxWidth: "280px", truncate: true },
			cell: ({ row }) => (
				<div className="flex items-center gap-3">
					{row.original.photos?.[0]?.url ? (
						<img
							className="h-10 w-10 rounded-radius-sm object-cover"
							style={{ border: "1px solid var(--border-light)" }}
							src={row.original.photos[0].url}
							alt={row.original.name}
						/>
					) : (
						<div
							className="h-10 w-10 rounded-radius-sm flex items-center justify-center text-xs font-bold"
							style={{ background: "var(--surface-medium)", color: "var(--text-hint)" }}
						>
							{row.original.name?.charAt(0)?.toUpperCase() || "?"}
						</div>
					)}
					<span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
						{row.original.name}
					</span>
				</div>
			),
		},
		{
			id: "category",
			accessorKey: "product.name",
			header: "Category",
			enableSorting: false,
			cell: ({ getValue }) => (
				<span className="text-sm" style={{ color: "var(--text-secondary)" }}>
					{(getValue() as string) || "—"}
				</span>
			),
		},
		{
			accessorKey: "price",
			header: "Price",
			cell: ({ getValue }) => (
				<span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
					{formatCurrency(getValue() as number)}
				</span>
			),
		},
		{
			id: "stock",
			accessorKey: "availableQuantity",
			header: "Stock",
			cell: ({ row }) => {
				const qty = Number(row.original.availableQuantity ?? row.original.unit ?? 0);
				return (
					<Badge variant={qty > 0 ? "success" : "error"} dot>
						{qty > 0 ? `${qty} units` : "Out of Stock"}
					</Badge>
				);
			},
		},
		{
			id: "rating",
			accessorKey: "ratingStats",
			header: "Rating",
			enableSorting: false,
			cell: ({ getValue }) => {
				const value: any = getValue();
				const avg = value?.average ?? 0;
				const count = value?.count ?? 0;
				return (
					<div className="flex items-center gap-1.5">
						<Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
						<span className="text-sm" style={{ color: "var(--text-primary)" }}>
							{Number(avg).toFixed(1)}
						</span>
						<span className="text-xs" style={{ color: "var(--text-hint)" }}>({count})</span>
					</div>
				);
			},
		},
		{
			// Storefront visibility — the column an admin actually acts on.
			accessorKey: "published",
			header: "Visibility",
			cell: ({ getValue }) => (
				<Badge variant={getValue() ? "success" : "warning"} dot>
					{getValue() ? "Published" : "Draft"}
				</Badge>
			),
		},
		{
			accessorKey: "status",
			header: "Record",
			cell: ({ getValue }) => (
				<Badge variant={getValue() === "A" ? "success" : "error"} dot>
					{getValue() === "A" ? "Active" : "Inactive"}
				</Badge>
			),
		},
		{
			id: "actions",
			header: "Action",
			enableSorting: false,
			enableHiding: false,
			meta: { width: "50px", align: "center" },
			cell: ({ row }) => (
				<ActionMenu items={[
					{ label: "View", icon: VIEW_ICON, onClick: () => router.push(`/admin/product/${row.original.id}`) },
					{
						label: row.original.published ? "Unpublish" : "Publish",
						icon: STATUS_ICON,
						onClick: () => setPublishTarget(row.original),
					},
					{
						label: row.original.status === "A" ? "Deactivate" : "Activate",
						icon: STATUS_ICON,
						onClick: () => setStatusTarget(row.original),
					},
					{ label: "Delete", icon: DELETE_ICON, onClick: () => setDeleteTarget(row.original), variant: "danger" as const },
				]} />
			),
		},
	];

	return (
		<AdminLayout>
			<div className="animate-page-enter space-y-6">
				<DataTable
					columns={columns}
					data={adminItems}
					isLoading={adminItemsLoading}
					onRefresh={refresh}
					refreshing={adminItemsLoading}
					manualFiltering
					globalFilter={searchTerm}
					onGlobalFilterChange={setSearch}
					searchPlaceholder="Search products..."
					pageIndex={currentPage - 1}
					pageSize={pageSize}
					pageCount={adminItemsPagination?.totalPages ?? 1}
					totalItems={adminItemsPagination?.totalItems}
					onPageChange={(idx) => setPage(idx + 1)}
					onPageSizeChange={setPageSize}
					onRowClick={(row) => router.push(`/admin/product/${row.id}`)}
					toolbar={
						<Button variant="filled" leftIcon={Plus} onClick={() => router.push("/admin/products/new")}>
							Add Product
						</Button>
					}
					emptyMessage="No products found"
				/>

				<Modal
					isOpen={!!deleteTarget}
					onClose={() => setDeleteTarget(null)}
					title="Delete Product"
					size="sm"
				>
					<div className="space-y-4">
						<p className="text-sm text-gray-600 dark:text-gray-300">
							Are you sure you want to delete{" "}
							<span className="font-semibold text-on-surface dark:text-white">{deleteTarget?.name}</span>?
							This action cannot be undone.
						</p>
						<div className="flex justify-end gap-3">
							<Button
								variant="outlined"
								color="secondary"
								size="sm"
								onClick={() => setDeleteTarget(null)}
							>
								Cancel
							</Button>
							<Button
								variant="filled"
								color="error"
								size="sm"
								loading={isDeleting}
								onClick={handleDelete}
							>
								Delete
							</Button>
						</div>
					</div>
				</Modal>

				<Modal
					isOpen={!!statusTarget}
					onClose={() => setStatusTarget(null)}
					title={`${statusTarget?.status === "A" ? "Deactivate" : "Activate"} Product`}
					size="sm"
				>
					<div className="space-y-4">
						<p className="text-sm text-gray-600 dark:text-gray-300">
							Are you sure you want to {statusTarget?.status === "A" ? "deactivate" : "activate"}{" "}
							<span className="font-semibold text-on-surface dark:text-white">{statusTarget?.name}</span>?
						</p>
						<div className="flex justify-end gap-3">
							<Button variant="outlined" color="secondary" size="sm" onClick={() => setStatusTarget(null)}>
								Cancel
							</Button>
							<Button
								variant="filled"
								color={statusTarget?.status === "A" ? "error" : "primary"}
								size="sm"
								loading={isUpdatingStatus}
								onClick={handleStatusUpdate}
							>
								{statusTarget?.status === "A" ? "Deactivate" : "Activate"}
							</Button>
						</div>
					</div>
				</Modal>

				<Modal
					isOpen={!!publishTarget}
					onClose={() => setPublishTarget(null)}
					title={`${publishTarget?.published ? "Unpublish" : "Publish"} Product`}
					size="sm"
				>
					<div className="space-y-4">
						<p className="text-sm text-gray-600 dark:text-gray-300">
							{publishTarget?.published ? (
								<>
									Hide{" "}
									<span className="font-semibold text-on-surface dark:text-white">{publishTarget?.name}</span>{" "}
									from the storefront? The record stays active — only its visibility to
									shoppers changes.
								</>
							) : (
								<>
									Make{" "}
									<span className="font-semibold text-on-surface dark:text-white">{publishTarget?.name}</span>{" "}
									visible to shoppers on the storefront?
								</>
							)}
						</p>
						<div className="flex justify-end gap-3">
							<Button variant="outlined" color="secondary" size="sm" onClick={() => setPublishTarget(null)}>
								Cancel
							</Button>
							<Button
								variant="filled"
								color={publishTarget?.published ? "error" : "primary"}
								size="sm"
								loading={isUpdatingStatus}
								onClick={handlePublishUpdate}
							>
								{publishTarget?.published ? "Unpublish" : "Publish"}
							</Button>
						</div>
					</div>
				</Modal>
			</div>
		</AdminLayout>
	);
};

export default withAdminAuth(AdminProducts);
