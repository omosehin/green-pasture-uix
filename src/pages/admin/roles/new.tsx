import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import withAdminAuth from '@/_components/withAdminAuth';
import AdminLayout from '@/_components/AdminLayout';
import { BackButton } from '@/_UI/DetailField';
import Button from '@/_UI/Button';
import { FormInput, FormTextarea } from '@/_UI/FormField';
import PageLoader from '@/_UI/PageLoader';
import toast from 'react-hot-toast';
import axiosInstance from '@/_utils/axiosInstance';
import { BackendPermission } from '@/types';
import { Search, Shield } from 'lucide-react';

const formatPermissionName = (name: string) => {
	return name
		.replace(/_/g, ' ')
		.toLowerCase()
		.replace(/\b\w/g, (c) => c.toUpperCase());
};

const inputStyle: React.CSSProperties = {
	background: 'var(--surface-base)',
	border: '1px solid var(--border-light)',
	color: 'var(--text-primary)',
};

const RoleForm: React.FC = () => {
	const router = useRouter();
	const editId = router.query.id as string | undefined;
	const isEditMode = !!editId;

	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [allPermissions, setAllPermissions] = useState<BackendPermission[]>([]);
	const [selectedPermissions, setSelectedPermissions] = useState<BackendPermission[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [search, setSearch] = useState('');
	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		if (!router.isReady) return;

		const fetchData = async () => {
			setLoading(true);
			try {
				const permRes = await axiosInstance.get('permission?page=1&limit=200');
				const permData = permRes.data?.data ?? permRes.data;
				const perms: BackendPermission[] = permData?.items ?? permData ?? [];
				setAllPermissions(perms);

				if (editId) {
					const roleRes = await axiosInstance.post(`role/details/${editId}`);
					const roleData = roleRes.data?.data ?? roleRes.data;
					setName(roleData.name ?? '');
					setDescription(roleData.description ?? '');
					setSelectedPermissions(roleData.permissions ?? []);
				}
			} catch {
				toast.error('Failed to load data');
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [router.isReady, editId]);

	const selectedIds = useMemo(() => new Set(selectedPermissions.map((p) => p.id)), [selectedPermissions]);

	const filtered = useMemo(() => {
		if (!search) return allPermissions;
		const q = search.toLowerCase();
		return allPermissions.filter((p) => formatPermissionName(p.name).toLowerCase().includes(q));
	}, [allPermissions, search]);

	const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));

	const togglePermission = (perm: BackendPermission) => {
		setSelectedPermissions((prev) =>
			selectedIds.has(perm.id) ? prev.filter((p) => p.id !== perm.id) : [...prev, perm]
		);
	};

	const toggleAll = () => {
		if (allFilteredSelected) {
			setSelectedPermissions((prev) => prev.filter((p) => !filtered.find((f) => f.id === p.id)));
		} else {
			const toAdd = filtered.filter((p) => !selectedIds.has(p.id));
			setSelectedPermissions((prev) => [...prev, ...toAdd]);
		}
	};

	const validate = () => {
		const newErrors: Record<string, string> = {};
		if (!name.trim()) newErrors.name = 'Role name is required';
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async () => {
		if (!validate()) return;
		setSaving(true);
		try {
			const payload = {
				name: name.trim(),
				description: description.trim(),
				permissions: selectedPermissions.map((p) => ({ id: p.id, name: p.name })),
			};

			if (isEditMode) {
				await axiosInstance.patch(`role/modify/${editId}`, payload);
				toast.success('Role updated successfully');
			} else {
				await axiosInstance.post('role/create', payload);
				toast.success('Role created successfully');
			}
			router.push('/admin/roles');
		} catch (err: any) {
			toast.error(err?.response?.data?.message ?? `Failed to ${isEditMode ? 'update' : 'create'} role`);
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<AdminLayout>
				<PageLoader fullScreen={false} message={isEditMode ? 'Loading role...' : 'Loading permissions...'} />
			</AdminLayout>
		);
	}

	return (
		<AdminLayout>
			<div className="animate-page-enter space-y-5">
				<BackButton />

				<div className="flex items-center gap-3">
					<div
						className="w-10 h-10 rounded-lg flex items-center justify-center"
						style={{ background: 'rgba(22,163,74,0.08)' }}
					>
						<Shield size={20} style={{ color: 'var(--color-primary)' }} />
					</div>
					<div>
						<h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
							{isEditMode ? 'Edit Role' : 'Create Role'}
						</h1>
						<p className="text-sm" style={{ color: 'var(--text-hint)' }}>
							{isEditMode ? 'Update role details and privileges' : 'Define a new role with privileges'}
						</p>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Left Column — Role Details */}
					<div className="lg:col-span-1">
						<div
							className="rounded-xl overflow-hidden"
							style={{
								background: 'var(--surface-paper)',
								border: '1px solid var(--border-light)',
								boxShadow: 'var(--shadow-sm)',
							}}
						>
							<div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-light)' }}>
								<h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
									Role Details
								</h3>
							</div>
							<div className="p-5 space-y-4">
								<FormInput
									label="Role Name"
									required
									value={name}
									onChange={(e) => {
										setName(e.target.value);
										if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
									}}
									placeholder="e.g. INVENTORY_MANAGER"
									error={errors.name}
								/>
								<FormTextarea
									label="Description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Brief description of this role"
									rows={3}
								/>

								<div
									className="rounded-lg px-3 py-2.5 text-sm"
									style={{ background: 'var(--surface-low)', color: 'var(--text-secondary)' }}
								>
									<span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
										{selectedPermissions.length}
									</span>{' '}
									privilege{selectedPermissions.length !== 1 ? 's' : ''} selected
								</div>

								<div className="flex gap-3 pt-2">
									<Button variant="outlined" onClick={() => router.push('/admin/roles')} className="flex-1">
										Cancel
									</Button>
									<Button variant="filled" onClick={handleSubmit} loading={saving} className="flex-1">
										{isEditMode ? 'Update Role' : 'Create Role'}
									</Button>
								</div>
							</div>
						</div>
					</div>

					{/* Right Column — Assign Privileges */}
					<div className="lg:col-span-2">
						<div
							className="rounded-xl overflow-hidden flex flex-col"
							style={{
								background: 'var(--surface-paper)',
								border: '1px solid var(--border-light)',
								boxShadow: 'var(--shadow-sm)',
							}}
						>
							{/* Header */}
							<div
								className="px-5 py-4 flex items-center justify-between"
								style={{ borderBottom: '1px solid var(--border-light)' }}
							>
								<h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
									Assign Privileges
								</h3>
								{selectedPermissions.length > 0 && (
									<span
										className="text-xs font-medium px-2 py-0.5 rounded-full"
										style={{
											background: 'rgba(22,163,74,0.1)',
											color: 'var(--color-primary)',
										}}
									>
										{selectedPermissions.length} selected
									</span>
								)}
							</div>

							{/* Search + Select All */}
							<div className="px-4 py-3 space-y-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
								<div className="relative">
									<Search
										size={14}
										className="absolute left-2.5 top-1/2 -translate-y-1/2"
										style={{ color: 'var(--text-hint)' }}
									/>
									<input
										type="text"
										value={search}
										onChange={(e) => setSearch(e.target.value)}
										placeholder="Search privileges..."
										className="w-full rounded-md pl-8 pr-3 py-1.5 text-xs outline-none transition-colors"
										style={inputStyle}
										onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
										onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; }}
									/>
								</div>
								<label className="flex items-center gap-2 cursor-pointer select-none">
									<input
										type="checkbox"
										checked={allFilteredSelected}
										onChange={toggleAll}
										className="shrink-0 w-3.5 h-3.5 rounded cursor-pointer"
										style={{ accentColor: 'var(--color-primary)' }}
									/>
									<span className="text-xs" style={{ color: 'var(--text-hint)' }}>
										Select All {search ? `(${filtered.length} visible)` : ''}
									</span>
								</label>
							</div>

							{/* Permissions list */}
							<div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
								{filtered.length === 0 ? (
									<div className="flex items-center justify-center py-12">
										<span className="text-xs" style={{ color: 'var(--text-hint)' }}>
											No privileges found
										</span>
									</div>
								) : (
									filtered.map((perm) => {
										const checked = selectedIds.has(perm.id);
										return (
											<label
												key={perm.id}
												className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
												style={{
													borderBottom: '1px solid var(--border-light)',
													background: checked ? 'rgba(22,163,74,0.04)' : 'transparent',
												}}
												onMouseEnter={(e) => {
													if (!checked) e.currentTarget.style.background = 'var(--surface-low)';
												}}
												onMouseLeave={(e) => {
													e.currentTarget.style.background = checked ? 'rgba(22,163,74,0.04)' : 'transparent';
												}}
											>
												<input
													type="checkbox"
													checked={checked}
													onChange={() => togglePermission(perm)}
													className="shrink-0 w-3.5 h-3.5 rounded cursor-pointer"
													style={{ accentColor: 'var(--color-primary)' }}
												/>
												<span
													className="text-xs"
													style={{ color: checked ? 'var(--color-primary)' : 'var(--text-primary)' }}
												>
													{formatPermissionName(perm.name)}
												</span>
											</label>
										);
									})
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</AdminLayout>
	);
};

export default withAdminAuth(RoleForm);
