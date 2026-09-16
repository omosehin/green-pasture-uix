import React, { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import type { ColumnDef } from "@tanstack/react-table";

import withAdminAuth from "@/_components/withAdminAuth";
import AdminLayout from "@/_components/AdminLayout";
import { DataTable } from "@/_components/DataTable";
import AddTag from "@/_components/Modals/AddTag";
import ActionMenu from "@/_UI/ActionMenu";
import Button from "@/_UI/Button";
import Modal from "@/_UI/Modal";
import { useAppDispatch, useAppSelector } from "@/_redux/store";
import { tagAction } from "@/_redux/actions/tag.action";
import { useListParams } from "@/_hooks/useListParams";
import type { Tag } from "@/types";

const EDIT_ICON = (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
);

const DELETE_ICON = (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
);

const POWER_ICON = (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 11-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
);

const AdminTags: React.FC = () => {
	const dispatch = useAppDispatch();
	const { tableTags, tableMeta, isFetchingTags } = useAppSelector((state) => state.tag);
	const { page: currentPage, pageSize, search: searchTerm, setPage, setSearch, setPageSize } = useListParams();

	const [editingTag, setEditingTag] = useState<Tag | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
	const [statusTarget, setStatusTarget] = useState<Tag | null>(null);
	const [busy, setBusy] = useState(false);

	const refresh = useCallback(() => {
		dispatch(tagAction.fetchTagTable({ page: currentPage, limit: pageSize, search: searchTerm || undefined }));
	}, [dispatch, currentPage, pageSize, searchTerm]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setBusy(true);
		try {
			await dispatch(tagAction.deleteTag(deleteTarget.id)).unwrap();
			toast.success("Tag deleted");
			setDeleteTarget(null);
			// The assign control reads the active list, which just changed.
			dispatch(tagAction.fetchTags());
			refresh();
		} catch (error) {
			toast.error((error as string) || "Failed to delete tag");
		} finally {
			setBusy(false);
		}
	};

	const handleToggleStatus = async () => {
		if (!statusTarget) return;
		const activate = statusTarget.status !== "A";
		setBusy(true);
		try {
			await dispatch(tagAction.setTagStatus({ id: statusTarget.id, activate })).unwrap();
			toast.success(`Tag ${activate ? "activated" : "deactivated"}`);
			setStatusTarget(null);
			dispatch(tagAction.fetchTags());
			refresh();
		} catch (error) {
			toast.error((error as string) || "Failed to update tag");
		} finally {
			setBusy(false);
		}
	};

	const columns: ColumnDef<Tag, any>[] = [
		{
			accessorKey: "name",
			header: "Name",
			meta: { width: "200px" },
			cell: ({ row }) => (
				<span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
					{row.original.name}
				</span>
			),
		},
		{
			accessorKey: "slug",
			header: "Slug",
			meta: { width: "180px" },
			cell: ({ row }) => (
				<code className="text-xs" style={{ color: "var(--text-hint)" }}>
					{row.original.slug}
				</code>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			meta: { width: "110px" },
			cell: ({ row }) => {
				const active = row.original.status === "A";
				return (
					<span
						className="rounded-full px-2.5 py-1 text-[0.65rem] font-semibold"
						style={{
							background: active ? "rgba(154,202,60,0.16)" : "var(--surface-medium)",
							color: active ? "var(--color-primary)" : "var(--text-hint)",
						}}
					>
						{active ? "Active" : "Inactive"}
					</span>
				);
			},
		},
		{
			id: "actions",
			header: "Action",
			enableSorting: false,
			enableHiding: false,
			meta: { width: "50px", align: "center" },
			cell: ({ row }) => (
				<ActionMenu
					items={[
						{ label: "Edit", icon: EDIT_ICON, onClick: () => setEditingTag(row.original) },
						{
							label: row.original.status === "A" ? "Deactivate" : "Activate",
							icon: POWER_ICON,
							onClick: () => setStatusTarget(row.original),
						},
						{ label: "Delete", icon: DELETE_ICON, onClick: () => setDeleteTarget(row.original), variant: "danger" as const },
					]}
				/>
			),
		},
	];

	return (
		<AdminLayout>
			<div className="animate-page-enter space-y-6">
				<DataTable
					columns={columns}
					data={tableTags ?? []}
					isLoading={isFetchingTags}
					onRefresh={refresh}
					refreshing={isFetchingTags}
					manualFiltering
					globalFilter={searchTerm}
					onGlobalFilterChange={setSearch}
					searchPlaceholder="Search tags..."
					pageIndex={currentPage - 1}
					pageSize={pageSize}
					pageCount={tableMeta?.totalPages ?? 1}
					totalItems={tableMeta?.totalItems}
					onPageChange={(idx) => setPage(idx + 1)}
					onPageSizeChange={setPageSize}
					toolbar={
						<AddTag onSaved={refresh} className="inline-flex">
							<Button variant="filled" leftIcon={Plus}>
								Add Tag
							</Button>
						</AddTag>
					}
				/>

				{editingTag && (
					<AddTag
						tag={editingTag}
						openInitially
						onClose={() => setEditingTag(null)}
						onSaved={() => {
							setEditingTag(null);
							refresh();
						}}
					/>
				)}

				<Modal
					isOpen={!!deleteTarget}
					onClose={() => setDeleteTarget(null)}
					title="Delete Tag"
					size="sm"
				>
					<div className="space-y-4">
						<p className="text-sm" style={{ color: "var(--text-secondary)" }}>
							Delete <span className="font-semibold">{deleteTarget?.name}</span>? It will be removed
							from every product that carries it. The products themselves are not affected.
						</p>
						<div className="flex justify-end gap-2">
							<Button variant="outlined" color="secondary" onClick={() => setDeleteTarget(null)}>
								Cancel
							</Button>
							<Button variant="filled" color="error" onClick={handleDelete} loading={busy} disabled={busy}>
								Delete
							</Button>
						</div>
					</div>
				</Modal>

				<Modal
					isOpen={!!statusTarget}
					onClose={() => setStatusTarget(null)}
					title={`${statusTarget?.status === "A" ? "Deactivate" : "Activate"} Tag`}
					size="sm"
				>
					<div className="space-y-4">
						<p className="text-sm" style={{ color: "var(--text-secondary)" }}>
							{statusTarget?.status === "A"
								? "A deactivated tag stops appearing in the storefront filter and can no longer be assigned. Existing assignments are kept."
								: "This tag will be assignable and shoppers will be able to filter by it again."}
						</p>
						<div className="flex justify-end gap-2">
							<Button variant="outlined" color="secondary" onClick={() => setStatusTarget(null)}>
								Cancel
							</Button>
							<Button
								variant="filled"
								color={statusTarget?.status === "A" ? "error" : "primary"}
								onClick={handleToggleStatus}
								loading={busy}
								disabled={busy}
							>
								{statusTarget?.status === "A" ? "Deactivate" : "Activate"}
							</Button>
						</div>
					</div>
				</Modal>
			</div>
		</AdminLayout>
	);
};

export default withAdminAuth(AdminTags);
