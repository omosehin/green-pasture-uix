import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import withAdminAuth from "@/_components/withAdminAuth";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

import { BackendStaff } from "@/types";
import { useAppDispatch, useAppSelector } from "@/_redux/store";
import { adminAction } from "@/_redux/actions/admin.action";
import AdminLayout from "@/_components/AdminLayout";
import { DataTable } from "@/_components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import ActionMenu from "@/_UI/ActionMenu";
import Badge from "@/_UI/Badge";
import Button from "@/_UI/Button";
import Modal from "@/_UI/Modal";
import * as changeCase from "change-case";
import { useListParams } from "@/_hooks/useListParams";

const VIEW_ICON = (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);

const STATUS_ICON = (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
);

const DELETE_ICON = (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
);

const Staff: React.FC = () => {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { staffList, staffLoading, staffPagination } = useAppSelector((state) => state.admin);
	const { page: currentPage, pageSize, search: searchTerm, setPage, setSearch, setPageSize } = useListParams();

	// Status / delete modal state
	const [statusTarget, setStatusTarget] = useState<any>(null);
	const [deleteTarget, setDeleteTarget] = useState<any>(null);
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);


	// Extracted so the toolbar's refresh icon re-runs exactly the fetch the page loads with.
	const refresh = useCallback(() => {
		dispatch(adminAction.fetchStaffAsync({ page: currentPage, limit: pageSize, search: searchTerm || undefined }));
	}, [currentPage, searchTerm, pageSize]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const handleStatusUpdate = async () => {
		if (!statusTarget) return;
		const isActive = statusTarget.status === "ACTIVE";
		setIsUpdatingStatus(true);
		try {
			await dispatch(adminAction.updateStaffStatusAsync({
				id: statusTarget.id,
				activate: !isActive,
			})).unwrap();
			toast.success(`Staff ${isActive ? "deactivated" : "activated"} successfully`);
			setStatusTarget(null);
		} catch (error: any) {
			toast.error(error || "Failed to update staff status");
		} finally {
			setIsUpdatingStatus(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			await dispatch(adminAction.deleteStaffAsync(deleteTarget.id)).unwrap();
			toast.success("Staff deleted successfully");
			setDeleteTarget(null);
		} catch (error: any) {
			toast.error(error || "Failed to delete staff");
		} finally {
			setIsDeleting(false);
		}
	};

	const columns: ColumnDef<BackendStaff, any>[] = [
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
			id: "role",
			accessorKey: "profile.roles",
			header: "Role",
			enableSorting: false,
			cell: ({ row }) => (
				<Badge variant="info">
					{row.original.profile?.roles?.length
						? row.original.profile.roles.map((r) => changeCase.capitalCase(r.name)).join(", ")
						: "Staff"}
				</Badge>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ getValue }) => (
				<Badge variant={String(getValue()) === "ACTIVE" ? "success" : "neutral"} dot>
					{String(getValue())}
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
					{ label: "View", icon: VIEW_ICON, onClick: () => router.push(`/admin/staff/${row.original.id}`) },
					{
						label: row.original.status === "ACTIVE" ? "Deactivate" : "Activate",
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
				{/* Staff Table */}
				<DataTable
					columns={columns}
					data={staffList}
					isLoading={staffLoading}
					onRefresh={refresh}
					refreshing={staffLoading}
					manualFiltering
					globalFilter={searchTerm}
					onGlobalFilterChange={setSearch}
					searchPlaceholder="Search staff..."
					pageIndex={currentPage - 1}
					pageSize={pageSize}
					pageCount={staffPagination?.totalPages ?? 1}
					totalItems={staffPagination?.totalItems}
					onPageChange={(idx) => setPage(idx + 1)}
					onPageSizeChange={setPageSize}
					onRowClick={(row) => router.push(`/admin/staff/${row.id}`)}
					// Staff accounts only come into existence by accepting an invite, so adding one starts there.
					toolbar={
						<Button variant="filled" leftIcon={Plus} onClick={() => router.push("/admin/invitations")}>
							Invite Staff
						</Button>
					}
					emptyMessage="No staff members found"
				/>

				{/* Status Confirmation Modal */}
				<Modal
					isOpen={!!statusTarget}
					onClose={() => setStatusTarget(null)}
					title={`${statusTarget?.status === "ACTIVE" ? "Deactivate" : "Activate"} Staff`}
					size="sm"
				>
					<div className="space-y-4">
						<p className="text-sm text-gray-600 dark:text-gray-300">
							Are you sure you want to {statusTarget?.status === "ACTIVE" ? "deactivate" : "activate"}{" "}
							<span className="font-semibold text-on-surface dark:text-white">
								{statusTarget?.profile?.firstName} {statusTarget?.profile?.lastName}
							</span>?
						</p>
						<div className="flex justify-end gap-3">
							<Button variant="outlined" color="secondary" size="sm" onClick={() => setStatusTarget(null)}>
								Cancel
							</Button>
							<Button
								variant="filled"
								color={statusTarget?.status === "ACTIVE" ? "error" : "primary"}
								size="sm"
								loading={isUpdatingStatus}
								onClick={handleStatusUpdate}
							>
								{statusTarget?.status === "ACTIVE" ? "Deactivate" : "Activate"}
							</Button>
						</div>
					</div>
				</Modal>

				{/* Delete Confirmation Modal */}
				<Modal
					isOpen={!!deleteTarget}
					onClose={() => setDeleteTarget(null)}
					title="Delete Staff"
					size="sm"
				>
					<div className="space-y-4">
						<p className="text-sm text-gray-600 dark:text-gray-300">
							Are you sure you want to delete{" "}
							<span className="font-semibold text-on-surface dark:text-white">
								{deleteTarget?.profile?.firstName} {deleteTarget?.profile?.lastName}
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
			</div>
		</AdminLayout>
	);
};

export default withAdminAuth(Staff);
