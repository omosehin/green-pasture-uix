import React, { useCallback, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import * as changeCase from "change-case";
import type { ColumnDef } from "@tanstack/react-table";

import withAdminAuth from "@/_components/withAdminAuth";
import AdminLayout from "@/_components/AdminLayout";
import { DataTable } from "@/_components/DataTable";
import ActionMenu from "@/_UI/ActionMenu";
import Badge from "@/_UI/Badge";
import Button from "@/_UI/Button";
import Modal from "@/_UI/Modal";
import { FormInput } from "@/_UI/FormField";
import PhoneInput from "@/_UI/PhoneInput";
import axiosInstance from "@/_utils/axiosInstance";
import { useListParams } from "@/_hooks/useListParams";

const RESEND_ICON = (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
);

const REVOKE_ICON = (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.9" y1="4.9" x2="19.1" y2="19.1"/></svg>
);

interface RoleOption {
	id: string;
	name: string;
}

interface Invitation {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	roles: RoleOption[];
	status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
	sentAt: string;
	expiresAt: string;
	acceptedAt: string | null;
}

const STATUS_VARIANT: Record<Invitation["status"], "success" | "warning" | "error" | "neutral"> = {
	PENDING: "warning",
	ACCEPTED: "success",
	REVOKED: "neutral",
	EXPIRED: "error",
};

const EMPTY_FORM = { firstName: "", lastName: "", email: "", phoneNumber: "", roleIds: [] as string[] };

const Invitations: React.FC = () => {
	const { page: currentPage, pageSize, search: searchTerm, setPage, setSearch, setPageSize } = useListParams();

	const [invitations, setInvitations] = useState<Invitation[]>([]);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [loading, setLoading] = useState(true);
	const [loadFailed, setLoadFailed] = useState(false);
	// First load shows the skeleton; a manual refresh keeps the rows on screen and
	// only spins the toolbar icon — same split react-query gives ogaryde via
	// isLoading vs isFetching.
	const isFirstLoad = loading && invitations.length === 0;

	const [roles, setRoles] = useState<RoleOption[]>([]);
	const [showInvite, setShowInvite] = useState(false);
	const [inviting, setInviting] = useState(false);
	const [form, setForm] = useState(EMPTY_FORM);
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	// PhoneInput hands back local digits only; the dial code arrives separately and
	// the two are joined into E.164 at submit time (same contract as signup).
	const phoneDialRef = useRef("+234");

	// Which row is mid-action, so the confirm modal knows what it is confirming.
	const [revokeTarget, setRevokeTarget] = useState<Invitation | null>(null);
	const [busyId, setBusyId] = useState<string | null>(null);

	const fetchInvitations = useCallback(() => {
		setLoading(true);
		axiosInstance
			.get("staff-invitations", { params: { page: currentPage, limit: pageSize, search: searchTerm || undefined } })
			.then((res) => {
				const data = res.data?.data;
				setInvitations(data?.items ?? []);
				setTotalPages(data?.meta?.totalPages ?? 1);
				setTotalItems(data?.meta?.totalItems ?? 0);
				setLoadFailed(false);
			})
			.catch((err) => {
				setLoadFailed(true);
				toast.error(err?.response?.data?.message || "Failed to load invitations");
			})
			.finally(() => setLoading(false));
	}, [currentPage, pageSize, searchTerm]);

	useEffect(() => {
		fetchInvitations();
	}, [fetchInvitations]);

	useEffect(() => {
		axiosInstance
			.get("role/all")
			.then((res) => {
				const data = res.data?.data;
				if (Array.isArray(data)) setRoles(data.map((r: any) => ({ id: String(r.id), name: changeCase.capitalCase(r.name) })));
			})
			.catch(() => {});
	}, []);

	const toggleRole = (roleId: string) =>
		setForm((f) => ({
			...f,
			roleIds: f.roleIds.includes(roleId) ? f.roleIds.filter((id) => id !== roleId) : [...f.roleIds, roleId],
		}));

	const validate = () => {
		const errors: Record<string, string> = {};
		if (!form.firstName.trim()) errors.firstName = "First name is required";
		if (!form.lastName.trim()) errors.lastName = "Last name is required";
		if (!form.email.trim()) errors.email = "Email is required";
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Invalid email address";
		if (!form.phoneNumber.trim()) errors.phoneNumber = "Phone number is required";
		else if (form.phoneNumber.replace(/\D/g, "").length < 7) errors.phoneNumber = "Phone number is too short";
		if (form.roleIds.length === 0) errors.roleIds = "Select at least one role";
		setFormErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const closeInvite = () => {
		setShowInvite(false);
		setForm(EMPTY_FORM);
		setFormErrors({});
	};

	const handleInvite = async () => {
		if (!validate()) return;
		setInviting(true);
		try {
			await axiosInstance.post("staff-invitations", {
				firstName: form.firstName.trim(),
				lastName: form.lastName.trim(),
				email: form.email.trim(),
				phoneNumber: `${phoneDialRef.current}${form.phoneNumber}`,
				roleIds: form.roleIds,
			});
			toast.success("Invitation sent");
			closeInvite();
			fetchInvitations();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Failed to send invitation");
		} finally {
			setInviting(false);
		}
	};

	const handleResend = async (invitation: Invitation) => {
		if (busyId) return; // the menu has no disabled state, so guard the double-click here
		setBusyId(invitation.id);
		try {
			await axiosInstance.post(`staff-invitations/${invitation.id}/resend`);
			toast.success(`Invitation resent to ${invitation.email}`);
			fetchInvitations();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Failed to resend invitation");
		} finally {
			setBusyId(null);
		}
	};

	const handleRevoke = async () => {
		if (!revokeTarget) return;
		setBusyId(revokeTarget.id);
		try {
			await axiosInstance.post(`staff-invitations/${revokeTarget.id}/revoke`);
			toast.success("Invitation revoked");
			setRevokeTarget(null);
			fetchInvitations();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Failed to revoke invitation");
		} finally {
			setBusyId(null);
		}
	};

	const columns: ColumnDef<Invitation, any>[] = [
		{
			id: "name",
			header: "Name",
			enableSorting: false,
			cell: ({ row }) => (
				<span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
					{row.original.firstName} {row.original.lastName}
				</span>
			),
		},
		{
			accessorKey: "email",
			header: "Email",
			enableSorting: false,
			meta: { maxWidth: "240px", truncate: true },
			cell: ({ getValue }) => (
				<span className="text-sm" style={{ color: "var(--text-secondary)" }}>{String(getValue())}</span>
			),
		},
		{
			id: "roles",
			header: "Roles",
			enableSorting: false,
			cell: ({ row }) => (
				<Badge variant="info">
					{row.original.roles?.length ? row.original.roles.map((r) => changeCase.capitalCase(r.name)).join(", ") : "—"}
				</Badge>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<Badge variant={STATUS_VARIANT[row.original.status] ?? "neutral"} dot>
					{row.original.status}
				</Badge>
			),
		},
		{
			accessorKey: "sentAt",
			header: "Sent",
			cell: ({ getValue }) => (
				<span className="text-sm text-gray-500 dark:text-gray-400">
					{new Date(getValue() as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
				</span>
			),
		},
		{
			accessorKey: "expiresAt",
			header: "Expires",
			cell: ({ row }) => (
				<span className="text-sm text-gray-500 dark:text-gray-400">
					{row.original.status === "PENDING"
						? new Date(row.original.expiresAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
						: "—"}
				</span>
			),
		},
		{
			id: "actions",
			header: "Action",
			enableSorting: false,
			enableHiding: false,
			meta: { width: "50px", align: "center" },
			cell: ({ row }) => {
				// Resend rescues an expired link; revoke only makes sense while the invite is live.
				const canResend = row.original.status === "PENDING" || row.original.status === "EXPIRED";
				const canRevoke = row.original.status === "PENDING" || row.original.status === "EXPIRED";
				if (!canResend && !canRevoke) return null;
				return (
					<ActionMenu
						items={[
							...(canResend
								? [{ label: "Resend invite", icon: RESEND_ICON, onClick: () => handleResend(row.original) }]
								: []),
							...(canRevoke
								? [{ label: "Revoke", icon: REVOKE_ICON, onClick: () => setRevokeTarget(row.original), variant: "danger" as const }]
								: []),
						]}
					/>
				);
			},
		},
	];

	return (
		<AdminLayout>
			<div className="animate-page-enter space-y-6">
				<DataTable
					columns={columns}
					data={invitations}
					isLoading={isFirstLoad}
					isError={loadFailed}
					onRetry={fetchInvitations}
					onRefresh={fetchInvitations}
					refreshing={loading}
					manualFiltering
					globalFilter={searchTerm}
					onGlobalFilterChange={setSearch}
					searchPlaceholder="Search invitations..."
					pageIndex={currentPage - 1}
					pageSize={pageSize}
					pageCount={totalPages}
					totalItems={totalItems}
					onPageChange={(idx: number) => setPage(idx + 1)}
					onPageSizeChange={setPageSize}
					toolbar={
						<Button variant="filled" leftIcon={Plus} onClick={() => setShowInvite(true)}>
							Invite Staff
						</Button>
					}
					emptyMessage="No invitations yet"
				/>

				<Modal
					isOpen={showInvite}
					onClose={closeInvite}
					title="Invite Staff Member"
					subtitle="They'll get an email link to set a password and activate their account"
					size="md"
				>
					<div className="space-y-4 pb-56">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<FormInput
								label="First Name"
								placeholder="Enter first name"
								required
								value={form.firstName}
								onChange={(e: any) => setForm((f) => ({ ...f, firstName: e.target.value }))}
								error={formErrors.firstName}
							/>
							<FormInput
								label="Last Name"
								placeholder="Enter last name"
								required
								value={form.lastName}
								onChange={(e: any) => setForm((f) => ({ ...f, lastName: e.target.value }))}
								error={formErrors.lastName}
							/>
						</div>
						<FormInput
							label="Email"
							type="email"
							placeholder="staff@example.com"
							required
							value={form.email}
							onChange={(e: any) => setForm((f) => ({ ...f, email: e.target.value }))}
							error={formErrors.email}
						/>
						<PhoneInput
							label="Phone Number"
							required
							value={form.phoneNumber}
							onChange={(local) => setForm((f) => ({ ...f, phoneNumber: local }))}
							onCountryChange={(dial) => (phoneDialRef.current = dial)}
							error={formErrors.phoneNumber}
						/>

						<div>
							<label className="block text-xs md:text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
								Roles <span className="text-red-500">*</span>
							</label>
							<div className="flex flex-wrap gap-x-6 gap-y-2">
								{roles.map((r) => (
									<label
										key={r.id}
										className="flex items-center gap-2 text-sm cursor-pointer select-none"
										style={{ color: "var(--text-primary)" }}
									>
										<input
											type="checkbox"
											checked={form.roleIds.includes(r.id)}
											onChange={() => toggleRole(r.id)}
											className="w-4 h-4 rounded cursor-pointer"
										/>
										{r.name}
									</label>
								))}
							</div>
							{formErrors.roleIds && <p className="mt-1.5 text-xs text-red-500">{formErrors.roleIds}</p>}
						</div>

						<div className="flex justify-end gap-3 pt-4" style={{ borderTop: "1px solid var(--border-light)" }}>
							<Button variant="outlined" color="secondary" size="sm" onClick={closeInvite}>
								Cancel
							</Button>
							<Button variant="filled" size="sm" onClick={handleInvite} loading={inviting} disabled={inviting}>
								Send Invitation
							</Button>
						</div>
					</div>
				</Modal>

				<Modal
					isOpen={!!revokeTarget}
					onClose={() => setRevokeTarget(null)}
					title="Revoke invitation"
					subtitle={revokeTarget ? `${revokeTarget.email} will no longer be able to use their link` : undefined}
					size="sm"
				>
					<div className="flex justify-end gap-3 pt-2">
						<Button variant="outlined" color="secondary" size="sm" onClick={() => setRevokeTarget(null)}>
							Cancel
						</Button>
						<Button
							variant="filled"
							color="error"
							size="sm"
							onClick={handleRevoke}
							loading={busyId === revokeTarget?.id}
							disabled={busyId === revokeTarget?.id}
						>
							Revoke
						</Button>
					</div>
				</Modal>
			</div>
		</AdminLayout>
	);
};

export default withAdminAuth(Invitations);
