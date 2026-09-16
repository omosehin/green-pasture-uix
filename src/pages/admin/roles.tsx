import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import withAdminAuth from '@/_components/withAdminAuth';
import { Plus } from 'lucide-react';

import { BackendRole } from '@/types';
import AdminLayout from '@/_components/AdminLayout';
import { DataTable, FilterDef } from '@/_components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import ActionMenu from '@/_UI/ActionMenu';
import Badge from '@/_UI/Badge';
import Button from '@/_UI/Button';
import Modal from '@/_UI/Modal';
import toast from 'react-hot-toast';
import axiosInstance from '@/_utils/axiosInstance';
import { parseAsString } from 'nuqs';
import { useListParams } from '@/_hooks/useListParams';

const VIEW_ICON = (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);

const STATUS_ICON = (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
);

const DELETE_ICON = (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
);

const ROLE_STATUS_FILTERS: FilterDef[] = [
	{
		key: 'filter',
		label: 'Status',
		options: [
			{ value: 'A', label: 'Active' },
			{ value: 'I', label: 'Inactive' },
		],
	},
];

const Roles: React.FC = () => {
	const router = useRouter();
	const [roles, setRoles] = useState<BackendRole[]>([]);
	const [loading, setLoading] = useState(true);
	const [pagination, setPagination] = useState<any>(null);
	const {
		page: currentPage,
		pageSize,
		search: searchTerm,
		filterValues,
		setPage,
		setSearch,
		setPageSize,
		setFilter,
	} = useListParams({ extraFilters: { filter: parseAsString.withDefault('') } });
	const [statusTarget, setStatusTarget] = useState<BackendRole | null>(null);
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<BackendRole | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const fetchRoles = useCallback(() => {
		setLoading(true);
		const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
		const filterParam = filterValues.filter ? `&filter=${encodeURIComponent(filterValues.filter)}` : '';
		axiosInstance
			.get(`role?page=${currentPage}&limit=${pageSize}${searchParam}${filterParam}`)
			.then((res) => {
				const data = res.data?.data ?? res.data;
				setRoles(data?.items ?? data ?? []);
				setPagination(data?.meta ?? null);
			})
			.catch(() => {
				toast.error('Failed to load roles');
			})
			.finally(() => {
				setLoading(false);
			});
	}, [currentPage, searchTerm, filterValues.filter, pageSize]);

	useEffect(() => {
		fetchRoles();
	}, [fetchRoles]);

	const handleStatusUpdate = async () => {
		if (!statusTarget) return;
		const isActive = statusTarget.status === 'A';
		setIsUpdatingStatus(true);
		try {
			const endpoint = isActive ? 'role/deactivate' : 'role/activate';
			await axiosInstance.patch(endpoint, [statusTarget.id]);
			toast.success(`Role ${isActive ? 'deactivated' : 'activated'} successfully`);
			setStatusTarget(null);
			fetchRoles();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || 'Failed to update role status');
		} finally {
			setIsUpdatingStatus(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			await axiosInstance.delete(`role/${deleteTarget.id}`);
			toast.success('Role deleted successfully');
			setDeleteTarget(null);
			fetchRoles();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || 'Failed to delete role');
		} finally {
			setIsDeleting(false);
		}
	};

	const columns: ColumnDef<BackendRole, any>[] = [
		{
			accessorKey: 'name',
			header: 'Name',
			cell: ({ getValue }) => (
				<span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
					{String(getValue()).replace(/_/g, ' ')}
				</span>
			),
		},
		{
			accessorKey: 'permissions',
			header: 'Permissions',
			enableSorting: false,
			cell: ({ getValue }) => {
				const value = getValue();
				return <Badge variant="info">{Array.isArray(value) ? value.length : 0}</Badge>;
			},
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ getValue }) => (
				<Badge variant={getValue() === 'A' ? 'success' : 'error'} dot>
					{getValue() === 'A' ? 'Active' : 'Inactive'}
				</Badge>
			),
		},
		{
			accessorKey: 'createdAt',
			header: 'Created',
			cell: ({ getValue }) => (
				<span className="text-sm text-gray-500 dark:text-gray-400">
					{getValue() ? new Date(getValue() as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
				</span>
			),
		},
		{
			id: 'actions',
			header: 'Action',
			enableSorting: false,
			enableHiding: false,
			meta: { width: '50px', align: 'center' },
			cell: ({ row }) => (
				<ActionMenu items={[
					{ label: 'View', icon: VIEW_ICON, onClick: () => router.push(`/admin/role/${row.original.id}`) },
					{
						label: row.original.status === 'A' ? 'Deactivate' : 'Activate',
						icon: STATUS_ICON,
						onClick: () => setStatusTarget(row.original),
					},
					{ label: 'Delete', icon: DELETE_ICON, onClick: () => setDeleteTarget(row.original), variant: 'danger' as const },
				]} />
			),
		},
	];

	return (
		<AdminLayout>
			<div className="animate-page-enter space-y-6">
				<DataTable
					columns={columns}
					data={roles}
					isLoading={loading}
					onRefresh={fetchRoles}
					refreshing={loading}
					manualFiltering
					globalFilter={searchTerm}
					onGlobalFilterChange={setSearch}
					searchPlaceholder="Search roles..."
					pageIndex={currentPage - 1}
					pageSize={pageSize}
					pageCount={pagination?.totalPages ?? 1}
					totalItems={pagination?.totalItems}
					onPageChange={(idx) => setPage(idx + 1)}
					onPageSizeChange={setPageSize}
					onRowClick={(row) => router.push(`/admin/role/${row.id}`)}
					filters={ROLE_STATUS_FILTERS}
					filterValues={filterValues}
					onFilterChange={setFilter}
					toolbar={
						<Button variant="filled" leftIcon={Plus} onClick={() => router.push('/admin/roles/new')}>
							Create Role
						</Button>
					}
					emptyMessage="No roles found"
				/>

				{/* Status Confirmation Modal */}
				<Modal
					isOpen={!!statusTarget}
					onClose={() => setStatusTarget(null)}
					title={`${statusTarget?.status === 'A' ? 'Deactivate' : 'Activate'} Role`}
					size="sm"
				>
					<div className="space-y-4">
						<p className="text-sm text-gray-600 dark:text-gray-300">
							Are you sure you want to {statusTarget?.status === 'A' ? 'deactivate' : 'activate'}{' '}
							<span className="font-semibold text-on-surface dark:text-white">
								{statusTarget?.name?.replace(/_/g, ' ')}
							</span>?
						</p>
						<div className="flex justify-end gap-3">
							<Button variant="outlined" color="secondary" size="sm" onClick={() => setStatusTarget(null)}>
								Cancel
							</Button>
							<Button
								variant="filled"
								color={statusTarget?.status === 'A' ? 'error' : 'primary'}
								size="sm"
								loading={isUpdatingStatus}
								onClick={handleStatusUpdate}
							>
								{statusTarget?.status === 'A' ? 'Deactivate' : 'Activate'}
							</Button>
						</div>
					</div>
				</Modal>

				{/* Delete Confirmation Modal */}
				<Modal
					isOpen={!!deleteTarget}
					onClose={() => setDeleteTarget(null)}
					title="Delete Role"
					size="sm"
				>
					<div className="space-y-4">
						<p className="text-sm text-gray-600 dark:text-gray-300">
							Are you sure you want to delete{' '}
							<span className="font-semibold text-on-surface dark:text-white">
								{deleteTarget?.name?.replace(/_/g, ' ')}
							</span>? This action cannot be undone.
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

export default withAdminAuth(Roles);
