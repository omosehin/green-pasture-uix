import React, { useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import withAdminAuth from "@/_components/withAdminAuth";

import { useAppDispatch, useAppSelector } from "@/_redux/store";
import { adminAction } from "@/_redux/actions/admin.action";
import AdminLayout from "@/_components/AdminLayout";
import { DataTable } from "@/_components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import ActionMenu from "@/_UI/ActionMenu";
import Badge from "@/_UI/Badge";
import PageLoader from "@/_UI/PageLoader";
import { useListParams } from "@/_hooks/useListParams";

const VIEW_ICON = (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);

interface UserRecord {
	id: number;
	profile: {
		firstName: string;
		lastName: string;
		email: string;
		phoneNumber?: string;
		profileType?: string;
	};
	status: string;
	createdAt: string;
}

const Users: React.FC = () => {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { customers, customersLoading, customersPagination } = useAppSelector((state) => state.admin);
	const { page: currentPage, search: searchTerm, setPage, setSearch } = useListParams();

	// Extracted so the toolbar's refresh icon re-runs exactly the fetch the page loads with.
	const refresh = useCallback(() => {
		dispatch(adminAction.fetchCustomersAsync({ page: currentPage, limit: 50, search: searchTerm || undefined }));
	}, [currentPage, searchTerm]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const columns: ColumnDef<UserRecord, any>[] = [
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
			accessorKey: "profile.profileType",
			header: "Role",
			enableSorting: false,
			cell: ({ row }) => (
				<Badge variant="info">
					{row.original.profile?.profileType ?? "User"}
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
					{ label: "View", icon: VIEW_ICON, onClick: () => router.push(`/admin/customer/${row.original.id}`) },
				]} />
			),
		},
	];

	if (customersLoading && !customers?.length) {
		return (
			<AdminLayout>
				<PageLoader fullScreen={false} message="Loading users..." />
			</AdminLayout>
		);
	}

	return (
		<AdminLayout>
			<div className="animate-page-enter space-y-6">
				{/* Users Table */}
				<DataTable
					columns={columns}
					data={customers as unknown as UserRecord[]}
					isLoading={customersLoading}
					onRefresh={refresh}
					refreshing={customersLoading}
					manualFiltering
					globalFilter={searchTerm}
					onGlobalFilterChange={setSearch}
					searchPlaceholder="Search users..."
					pageIndex={currentPage - 1}
					pageSize={50}
					pageCount={customersPagination?.totalPages ?? 1}
					totalItems={customersPagination?.totalItems}
					onPageChange={(idx) => setPage(idx + 1)}
					emptyMessage="No users found"
				/>
			</div>
		</AdminLayout>
	);
};

export default withAdminAuth(Users);
