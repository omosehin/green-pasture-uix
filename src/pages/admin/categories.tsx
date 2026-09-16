import React, { useEffect, useState, useCallback } from "react";
import withAdminAuth from "@/_components/withAdminAuth";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

import { useAppDispatch, useAppSelector } from "@/_redux/store";
import AdminLayout from "@/_components/AdminLayout";
import AddCategory from "@/_components/Modals/AddCategory";
import { selectCategory } from "@/_redux/reducers/admin.reducer";
import { DataTable } from "@/_components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import ActionMenu from "@/_UI/ActionMenu";
import Button from "@/_UI/Button";
import Modal from "@/_UI/Modal";
import { ProductCategory } from "@/types";
import { categoryAction } from "@/_redux/actions/category.action";
import { useListParams } from "@/_hooks/useListParams";
import SanitizedHtml from "@/_UI/SanitizedHtml";
import { htmlToText } from "@/_utils/htmlToText";

const VIEW_ICON = (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);

const EDIT_ICON = (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
);

const DELETE_ICON = (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
);

const AdminCategories: React.FC = () => {
	const dispatch = useAppDispatch();
	const categories = useAppSelector((state) => state.category.productCategories);
	const isFetchingCategories = useAppSelector((state) => state.category.isFetchingAllCategories);
	const isDeletingCategory = useAppSelector((state) => state.category.isDeletingCategory);
	const pagination = useAppSelector((state) => (state.category as any).pagination ?? null);
	const { page: currentPage, pageSize, search: searchTerm, setPage, setSearch, setPageSize } = useListParams();
	const [deleteTarget, setDeleteTarget] = useState<ProductCategory | null>(null);
	const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
	const [viewingCategory, setViewingCategory] = useState<ProductCategory | null>(null);

	// Extracted so the toolbar's refresh icon re-runs exactly the fetch the page loads with.
	const refresh = useCallback(() => {
		dispatch(categoryAction.fetchAllCategories({ page: currentPage, limit: pageSize, search: searchTerm || undefined }));
	}, [currentPage, searchTerm, pageSize]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const handleDelete = async () => {
		if (!deleteTarget) return;
		try {
			await dispatch(categoryAction.deleteCategory(deleteTarget.id)).unwrap();
			toast.success("Category deleted successfully");
			setDeleteTarget(null);
			dispatch(categoryAction.fetchAllCategories({ page: currentPage, limit: pageSize, search: searchTerm || undefined }));
		} catch (error) {
			toast.error(error as string);
		}
	};

	const columns: ColumnDef<ProductCategory, any>[] = [
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
			accessorKey: "description",
			header: "Description",
			meta: { maxWidth: "400px", truncate: true },
			cell: ({ row }) => (
				<span className="text-sm" style={{ color: "var(--text-secondary)" }}>
					{htmlToText(row.original.description)}
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
					{ label: "View", icon: VIEW_ICON, onClick: () => setViewingCategory(row.original) },
					{ label: "Edit", icon: EDIT_ICON, onClick: () => setEditingCategory(row.original) },
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
					data={categories ?? []}
					isLoading={isFetchingCategories}
					onRefresh={refresh}
					refreshing={isFetchingCategories}
					manualFiltering
					globalFilter={searchTerm}
					onGlobalFilterChange={setSearch}
					searchPlaceholder="Search categories..."
					pageIndex={currentPage - 1}
					pageSize={pageSize}
					pageCount={pagination?.totalPages ?? 1}
					totalItems={pagination?.totalItems}
					onPageChange={(idx) => setPage(idx + 1)}
					onPageSizeChange={setPageSize}
					toolbar={
						<AddCategory
							title="add category"
							className="inline-flex"
						>
							<Button variant="filled" leftIcon={Plus}>
								Add Category
							</Button>
						</AddCategory>
					}
					emptyMessage="No categories found"
				/>

				{/* View Category Modal */}
				<Modal
					isOpen={!!viewingCategory}
					onClose={() => setViewingCategory(null)}
					title="View Category"
					size="md"
				>
					{viewingCategory && (
						<div className="space-y-4 max-h-[80vh]">
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name: {viewingCategory.name}</label>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description:</label>
								<SanitizedHtml
									html={viewingCategory.description}
									className="mt-1 text-sm"
									fallback={<p className="mt-1 text-sm text-gray-900 dark:text-white">No description</p>}
								/>
							</div>
							<div className="flex justify-end">
								<Button
									variant="outlined"
									color="secondary"
									size="sm"
									onClick={() => setViewingCategory(null)}
								>
									Close
								</Button>
							</div>
						</div>
					)}
				</Modal>

				{/* Delete Confirmation Modal */}
				<Modal
					isOpen={!!deleteTarget}
					onClose={() => setDeleteTarget(null)}
					title="Delete Category"
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
								loading={isDeletingCategory}
								onClick={handleDelete}
							>
								Delete
							</Button>
						</div>
					</div>
				</Modal>

				{/* Edit Category Modal */}
				<AddCategory
					category={editingCategory || undefined}
					isOpen={!!editingCategory}
					onClose={() => {
						setEditingCategory(null);
						dispatch(categoryAction.fetchAllCategories({ page: currentPage, limit: pageSize, search: searchTerm || undefined }));
					}}
					title="Edit Category" children={undefined}
				/>
			</div>
		</AdminLayout>
	);
};

export default withAdminAuth(AdminCategories);
