import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import withAdminAuth from "@/_components/withAdminAuth";
import { parseAsString } from "nuqs";
import toast from "react-hot-toast";

import { BackendCustomer } from "@/types";
import { useAppDispatch, useAppSelector } from "@/_redux/store";
import { adminAction } from "@/_redux/actions/admin.action";
import AdminLayout from "@/_components/AdminLayout";
import { DataTable, FilterDef } from "@/_components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import ActionMenu from "@/_UI/ActionMenu";
import Badge from "@/_UI/Badge";
import Button from "@/_UI/Button";
import Modal from "@/_UI/Modal";
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

const CUSTOMER_STATUS_FILTERS: FilterDef[] = [
	{
		key: "filter",
		label: "Status",
		options: [
			{ value: "A", label: "Active" },
			{ value: "I", label: "Inactive" },
		],
	},
];

const AdminCustomers: React.FC = () => {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { customers, customersLoading, customersPagination } = useAppSelector((state) => state.admin);
	const {
		page: currentPage,
		pageSize,
		search: searchTerm,
		filterValues,
		setPage,
		setSearch,
		setPageSize,
		setFilter,
	} = useListParams({ extraFilters: { filter: parseAsString.withDefault("") } });
	const [deleteTarget, setDeleteTarget] = useState<BackendCustomer | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [statusTarget, setStatusTarget] = useState<BackendCustomer | null>(null);
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

	// Extracted so the toolbar's refresh icon re-runs exactly the fetch the page loads with.
	const refresh = useCallback(() => {
		dispatch(adminAction.fetchCustomersAsync({
			page: currentPage,
			limit: pageSize,
			search: searchTerm || undefined,
			filter: filterValues.filter || undefined,
		}));
	}, [currentPage, searchTerm, filterValues.filter, pageSize]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			await dispatch(adminAction.deleteCustomerAsync((deleteTarget as any).id)).unwrap();
			toast.success("Customer deleted successfully");
			setDeleteTarget(null);
		} catch (error: any) {
			toast.error(error || "Failed to delete customer");
		} finally {
			setIsDeleting(false);
		}
	};

	const handleStatusUpdate = async () => {
		if (!statusTarget) return;
		const isActive = (statusTarget as any).status === "A";
		setIsUpdatingStatus(true);
		try {
			await dispatch(adminAction.updateCustomerStatusAsync({
				id: (statusTarget as any).id,
				activate: !isActive,
			})).unwrap();
			toast.success(`Customer ${isActive ? "deactivated" : "activated"} successfully`);
			setStatusTarget(null);
		} catch (error: any) {
			toast.error(error || "Failed to update customer status");
		} finally {
			setIsUpdatingStatus(false);
		}
	};

	const columns: ColumnDef<BackendCustomer, any>[] = [
		{
			id: "name",
			accessorKey: "profile",
			header: "Name",
			enableSorting: false,
			cell: ({ row }) => (
				<span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
					{row.original.profile?.firstName} {row.original.profile?.lastName}
				</span>
			),
		},
		{
			id: "email",
			accessorKey: "profile.email",
			header: "Email",
			enableSorting: false,
			meta: { maxWidth: "240px", truncate: true },
			cell: ({ row }) => (
				<span className="text-sm" style={{ color: "var(--text-secondary)" }}>{row.original.profile?.email}</span>
			),
		},
		{
			id: "phone",
			accessorKey: "profile.phoneNumber",
			header: "Phone",
			enableSorting: false,
			cell: ({ row }) => (
				<span className="text-sm" style={{ color: "var(--text-secondary)" }}>{row.original.profile?.phoneNumber ?? "N/A"}</span>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ getValue }) => (
				<Badge variant={getValue() === "A" ? "success" : "error"} dot>
					{getValue() === "A" ? "Active" : "Inactive"}
				</Badge>
			),
		},
		{
			accessorKey: "createdAt",
			header: "Joined",
			cell: ({ getValue }) => (
				<span className="text-sm text-gray-500 dark:text-gray-400">
					{new Date(getValue() as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
				</span>
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
					{ label: "View", icon: VIEW_ICON, onClick: () => router.push(`/admin/customer/${row.original.id}`) },
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
					data={customers ?? []}
					isLoading={customersLoading}
					onRefresh={refresh}
					refreshing={customersLoading}
					manualFiltering
					globalFilter={searchTerm}
					onGlobalFilterChange={setSearch}
					searchPlaceholder="Search customers..."
					filters={CUSTOMER_STATUS_FILTERS}
					filterValues={filterValues}
					onFilterChange={setFilter}
					pageIndex={currentPage - 1}
					pageSize={pageSize}
					pageCount={customersPagination?.totalPages ?? 1}
					totalItems={customersPagination?.totalItems}
					onPageChange={(idx) => setPage(idx + 1)}
					onPageSizeChange={setPageSize}
					onRowClick={(row) => router.push(`/admin/customer/${row.id}`)}
					emptyMessage="No customers found"
				/>

				{/* Delete Confirmation Modal */}
				<Modal
					isOpen={!!deleteTarget}
					onClose={() => setDeleteTarget(null)}
					title="Delete Customer"
					size="sm"
				>
					<div className="space-y-4">
						<p className="text-sm text-gray-600 dark:text-gray-300">
							Are you sure you want to delete{" "}
							<span className="font-semibold text-on-surface dark:text-white">
								{(deleteTarget as any)?.profile?.firstName} {(deleteTarget as any)?.profile?.lastName}
							</span>?
							This action cannot be undone.
						</p>
						<div className="flex justify-end gap-3">
							<Button variant="outlined" color="secondary" size="sm" onClick={() => setDeleteTarget(null)}>
								Cancel
							</Button>
							<Button variant="filled" color="error" size="sm" loading={isDeleting} onClick={handleDelete}>
								Delete
							</Button>
						</div>
					</div>
				</Modal>

				{/* Status Update Confirmation Modal */}
				<Modal
					isOpen={!!statusTarget}
					onClose={() => setStatusTarget(null)}
					title={`${(statusTarget as any)?.status === "A" ? "Deactivate" : "Activate"} Customer`}
					size="sm"
				>
					<div className="space-y-4">
						<p className="text-sm text-gray-600 dark:text-gray-300">
							Are you sure you want to {(statusTarget as any)?.status === "A" ? "deactivate" : "activate"}{" "}
							<span className="font-semibold text-on-surface dark:text-white">
								{(statusTarget as any)?.profile?.firstName} {(statusTarget as any)?.profile?.lastName}
							</span>?
						</p>
						<div className="flex justify-end gap-3">
							<Button variant="outlined" color="secondary" size="sm" onClick={() => setStatusTarget(null)}>
								Cancel
							</Button>
							<Button
								variant="filled"
								color={(statusTarget as any)?.status === "A" ? "error" : "primary"}
								size="sm"
								loading={isUpdatingStatus}
								onClick={handleStatusUpdate}
							>
								{(statusTarget as any)?.status === "A" ? "Deactivate" : "Activate"}
							</Button>
						</div>
					</div>
				</Modal>
			</div>
		</AdminLayout>
	);
};

export default withAdminAuth(AdminCustomers);
