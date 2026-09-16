import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import withAdminAuth from "@/_components/withAdminAuth";
import AdminLayout from "@/_components/AdminLayout";
import { BackButton, DetailHeader, DetailSection, DetailRow } from "@/_UI/DetailField";
import Badge from "@/_UI/Badge";
import Button from "@/_UI/Button";
import Modal from "@/_UI/Modal";
import { FormInput } from "@/_UI/FormField";
import { formatPhoneDisplay } from "@/_UI/FormatValue";
import PhoneInput, { splitDialCode } from "@/_UI/PhoneInput";
import PageLoader from "@/_UI/PageLoader";
import toast from "react-hot-toast";
import axiosInstance from "@/_utils/axiosInstance";
import { BackendStaff } from "@/types";
import { Pencil, X, Power } from "lucide-react";
import * as changeCase from "change-case";
import { resolveRoleIdsForPatch } from "@/_utils/staffForm";

interface RoleOption {
	id: string;
	name: string;
}

const StaffDetail: React.FC = () => {
	const router = useRouter();
	const { id } = router.query;
	const [staff, setStaff] = useState<BackendStaff | null>(null);
	const [loading, setLoading] = useState(true);
	const [editing, setEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [toggling, setToggling] = useState(false);
	const [statusModalOpen, setStatusModalOpen] = useState(false);
	const [roles, setRoles] = useState<RoleOption[]>([]);

	// Edit form state. phoneNumber holds LOCAL digits only — PhoneInput owns the
	// dial code, and the two are rejoined into E.164 on save.
	const [editForm, setEditForm] = useState({
		firstName: "",
		lastName: "",
		phoneNumber: "",
		roleIds: [] as string[],
	});
	const [phoneCountry, setPhoneCountry] = useState("NG");
	const phoneDialRef = useRef("+234");
	// The roles loaded from the server, so handleSave can tell "admin left the
	// same set checked" apart from "admin never touched the field" and only
	// send roleIds when the set actually changed (see resolveRoleIdsForPatch).
	const [initialRoleIds, setInitialRoleIds] = useState<string[]>([]);

	const fetchStaff = () => {
		if (!id) return;
		setLoading(true);
		axiosInstance
			.get(`staff/${id}`)
			.then((res) => {
				const data = res.data?.data ?? res.data;
				setStaff(data);
				if (data?.profile) {
					const roleIds = (data.profile.roles ?? []).map((r: RoleOption) => String(r.id));
					// PhoneInput works in local digits + a dial code, so split the stored E.164 value.
					const phone = splitDialCode(data.profile.phoneNumber);
					setPhoneCountry(phone.countryCode);
					setEditForm({
						firstName: data.profile.firstName || "",
						lastName: data.profile.lastName || "",
						phoneNumber: phone.local,
						roleIds,
					});
					setInitialRoleIds(roleIds);
				}
			})
			.catch(() => {
				setStaff(null);
				toast.error("Failed to load staff details");
			})
			.finally(() => {
				setLoading(false);
			});
	};

	useEffect(() => {
		if (!router.isReady || !id) return;
		fetchStaff();
	}, [id, router.isReady]);

	// Fetch roles on mount
	useEffect(() => {
		axiosInstance
			.get("role/all")
			.then((res) => {
				const data = res.data?.data;
				if (Array.isArray(data)) {
					setRoles(data.map((r: any) => ({ id: r.id, name: changeCase.capitalCase(r.name) })));
				}
			})
			.catch(() => {});
	}, []);

	const handleSave = async () => {
		if (!id) return;
		if (editForm.roleIds.length === 0) {
			toast.error("Select at least one role");
			return;
		}
		setSaving(true);
		try {
			await axiosInstance.patch(`staff/${id}`, {
				firstName: editForm.firstName.trim(),
				lastName: editForm.lastName.trim(),
				phoneNumber: `${phoneDialRef.current}${editForm.phoneNumber}`,
				roleIds: resolveRoleIdsForPatch(editForm.roleIds, initialRoleIds),
			});
			toast.success("Staff updated successfully");
			setEditing(false);
			fetchStaff();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Failed to update staff");
		} finally {
			setSaving(false);
		}
	};

	const handleCancelEdit = () => {
		setEditing(false);
		if (staff?.profile) {
			const phone = splitDialCode(staff.profile.phoneNumber);
			setPhoneCountry(phone.countryCode);
			setEditForm({
				firstName: staff.profile.firstName || "",
				lastName: staff.profile.lastName || "",
				phoneNumber: phone.local,
				roleIds: (staff.profile.roles ?? []).map((r) => String(r.id)),
			});
			// initialRoleIds is left as-is here — it already reflects the server's
			// value from the last fetch, which is exactly what cancel reverts to.
		}
	};

	const toggleRole = (roleId: string) => {
		setEditForm((f) => ({
			...f,
			roleIds: f.roleIds.includes(roleId) ? f.roleIds.filter((id) => id !== roleId) : [...f.roleIds, roleId],
		}));
	};

	const handleToggleStatus = async () => {
		if (!staff) return;
		setToggling(true);
		const endpoint = staff.status === "ACTIVE" ? "staff/deactivate" : "staff/activate";
		try {
			await axiosInstance.patch(endpoint, { ids: [staff.id] });
			toast.success(staff.status === "ACTIVE" ? "Staff deactivated" : "Staff activated");
			setStatusModalOpen(false);
			fetchStaff();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Failed to update status");
		} finally {
			setToggling(false);
		}
	};

	const inputStyle = {
		border: "1px solid var(--border-light)",
		color: "var(--text-primary)",
		background: "var(--surface-paper)",
	};

	const staffTitle = staff
		? `${staff.profile?.firstName ?? ''} ${staff.profile?.lastName ?? ''}`.trim() || 'Staff Details'
		: 'Staff Details';

	if (loading) {
		return (
			<AdminLayout pageTitle={staffTitle}>
				<PageLoader fullScreen={false} message="Loading staff details..." />
			</AdminLayout>
		);
	}

	if (!staff) {
		return (
			<AdminLayout pageTitle={staffTitle}>
				<div className="max-w-4xl mx-auto space-y-5 animate-page-enter">
					<BackButton />
					<div
						className="rounded-xl px-6 py-16 text-center"
						style={{ background: "var(--surface-paper)", border: "1px solid var(--border-light)" }}
					>
						<p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
							Staff member not found
						</p>
					</div>
				</div>
			</AdminLayout>
		);
	}

	const profile = staff.profile;

	return (
		<AdminLayout pageTitle={staffTitle}>
			<div className="max-w-4xl mx-auto space-y-5 animate-page-enter">
				<div className="flex items-center justify-between">
					<BackButton />
					<div className="flex items-center gap-2">
						<Button
							variant="outlined"
							size="sm"
							color={staff.status === "ACTIVE" ? "error" : "primary"}
							onClick={() => setStatusModalOpen(true)}
							loading={toggling}
							disabled={toggling}
						>
							<Power className="w-4 h-4 mr-1.5" />
							{staff.status === "ACTIVE" ? "Deactivate" : "Activate"}
						</Button>
						{!editing ? (
							<Button variant="outlined" size="sm" onClick={() => setEditing(true)}>
								<Pencil className="w-4 h-4 mr-1.5" />
								Edit
							</Button>
						) : (
							<Button variant="outlined" size="sm" onClick={handleCancelEdit}>
								<X className="w-4 h-4 mr-1.5" />
								Cancel
							</Button>
						)}
					</div>
				</div>

				<DetailHeader
					title={`${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`}
					subtitle="Staff Member"
					status={
						<Badge variant={staff.status === "ACTIVE" ? "success" : "neutral"} dot>
							{staff.status}
						</Badge>
					}
				/>

				{editing ? (
					<DetailSection title="Edit Staff">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
							<FormInput
								label="First Name"
								required
								value={editForm.firstName}
								onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
							/>
							<FormInput
								label="Last Name"
								required
								value={editForm.lastName}
								onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
							/>
							<FormInput
								label="Email"
								type="email"
								value={profile?.email ?? ""}
								disabled
							/>
							<PhoneInput
								label="Phone Number"
								defaultCountry={phoneCountry}
								value={editForm.phoneNumber}
								onChange={(local) => setEditForm((f) => ({ ...f, phoneNumber: local }))}
								onCountryChange={(dial) => (phoneDialRef.current = dial)}
							/>
							<div className="sm:col-span-2">
								<label
									className="block text-xs md:text-sm font-semibold mb-2"
									style={{ color: "var(--text-secondary)" }}
								>
									Roles
								</label>
								<div className="flex flex-wrap gap-x-6 gap-y-2">
									{roles.map((r) => {
										const roleId = String(r.id);
										return (
											<label
												key={roleId}
												className="flex items-center gap-2 text-sm cursor-pointer select-none"
												style={{ color: "var(--text-primary)" }}
											>
												<input
													type="checkbox"
													checked={editForm.roleIds.includes(roleId)}
													onChange={() => toggleRole(roleId)}
													className="w-4 h-4 rounded cursor-pointer"
												/>
												{r.name}
											</label>
										);
									})}
								</div>
								{editForm.roleIds.length === 0 && (
									<p className="mt-1.5 text-xs text-red-500">At least one role is required.</p>
								)}
							</div>
							<div className="sm:col-span-2 flex justify-end">
								<Button
									variant="filled"
									size="md"
									onClick={handleSave}
									loading={saving}
									disabled={saving || editForm.roleIds.length === 0}
								>
									Save Changes
								</Button>
							</div>
						</div>
					</DetailSection>
				) : (
					<DetailSection title="Profile Information">
						<DetailRow label="Email" value={profile?.email} />
						<DetailRow label="Phone" value={formatPhoneDisplay(profile?.phoneNumber)} />
						<DetailRow label="Gender" value={profile?.gender ? changeCase.capitalCase(profile.gender) : "\u2014"} />
						<DetailRow
							label="Role"
							value={
								<Badge variant="info">
									{profile?.roles?.length
										? profile.roles.map((r) => changeCase.capitalCase(r.name)).join(", ")
										: changeCase.capitalCase(profile?.profileType ?? "Staff")}
								</Badge>
							}
						/>
						<DetailRow
							label="Joined"
							value={new Date(staff.createdAt).toLocaleDateString("en-US", {
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						/>
					</DetailSection>
				)}
			</div>

			{/* Status Confirmation Modal */}
			<Modal
				isOpen={statusModalOpen}
				onClose={() => setStatusModalOpen(false)}
				title={`${staff?.status === "ACTIVE" ? "Deactivate" : "Activate"} Staff`}
				size="sm"
			>
				<div className="space-y-4">
					<p className="text-sm text-gray-600 dark:text-gray-300">
						Are you sure you want to {staff?.status === "ACTIVE" ? "deactivate" : "activate"}{" "}
						<span className="font-semibold text-on-surface dark:text-white">
							{profile?.firstName} {profile?.lastName}
						</span>?
					</p>
					<div className="flex justify-end gap-3">
						<Button variant="outlined" color="secondary" size="sm" onClick={() => setStatusModalOpen(false)}>
							Cancel
						</Button>
						<Button
							variant="filled"
							color={staff?.status === "ACTIVE" ? "error" : "primary"}
							size="sm"
							loading={toggling}
							onClick={handleToggleStatus}
						>
							{staff?.status === "ACTIVE" ? "Deactivate" : "Activate"}
						</Button>
					</div>
				</div>
			</Modal>
		</AdminLayout>
	);
};

export default withAdminAuth(StaffDetail);
