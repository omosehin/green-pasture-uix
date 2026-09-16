import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import withAdminAuth from "@/_components/withAdminAuth";
import AdminLayout from "@/_components/AdminLayout";
import { BackButton, DetailHeader, DetailSection, DetailRow } from "@/_UI/DetailField";
import Badge from "@/_UI/Badge";
import Button from "@/_UI/Button";
import Modal from "@/_UI/Modal";
import { FormInput } from "@/_UI/FormField";
import { formatPhoneDisplay } from "@/_UI/FormatValue";
import PageLoader from "@/_UI/PageLoader";
import toast from "react-hot-toast";
import axiosInstance from "@/_utils/axiosInstance";
import { BackendCustomer } from "@/types";
import { Pencil, X, Power } from "lucide-react";
import * as changeCase from "change-case";

const CustomerDetail: React.FC = () => {
	const router = useRouter();
	const { id } = router.query;
	const [customer, setCustomer] = useState<BackendCustomer | null>(null);
	const [loading, setLoading] = useState(true);
	const [editing, setEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [toggling, setToggling] = useState(false);
	const [statusModalOpen, setStatusModalOpen] = useState(false);
	const [editForm, setEditForm] = useState({
		firstName: "",
		lastName: "",
		phoneNumber: "",
	});

	const fetchCustomer = () => {
		if (!id) return;
		setLoading(true);
		axiosInstance
			.get(`customers/${id}`)
			.then((res) => {
				const data = res.data?.data ?? res.data;
				setCustomer(data);
				if (data?.profile) {
					setEditForm({
						firstName: data.profile.firstName || "",
						lastName: data.profile.lastName || "",
						phoneNumber: data.profile.phoneNumber || "",
					});
				}
			})
			.catch(() => {
				setCustomer(null);
				toast.error("Failed to load customer");
			})
			.finally(() => {
				setLoading(false);
			});
	};

	useEffect(() => {
		if (!router.isReady || !id) return;
		fetchCustomer();
	}, [id, router.isReady]);

	const handleSave = async () => {
		if (!customer) return;
		setSaving(true);
		try {
			await axiosInstance.patch(`customers/${(customer as any).id}`, {
				firstName: editForm.firstName.trim(),
				lastName: editForm.lastName.trim(),
				phoneNumber: editForm.phoneNumber.trim(),
			});
			toast.success("Customer updated successfully");
			setEditing(false);
			fetchCustomer();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Failed to update customer");
		} finally {
			setSaving(false);
		}
	};

	const handleCancelEdit = () => {
		setEditing(false);
		if (customer?.profile) {
			setEditForm({
				firstName: (customer.profile as any).firstName || "",
				lastName: (customer.profile as any).lastName || "",
				phoneNumber: customer.profile.phoneNumber || "",
			});
		}
	};

	const handleToggleStatus = async () => {
		if (!customer) return;
		const isActive = (customer as any).status === "A";
		setToggling(true);
		try {
			await axiosInstance.patch(isActive ? "customers/deactivate" : "customers/activate", {
				ids: [(customer as any).id],
			});
			toast.success(isActive ? "Customer deactivated successfully" : "Customer activated successfully");
			setStatusModalOpen(false);
			fetchCustomer();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Failed to update customer status");
		} finally {
			setToggling(false);
		}
	};

	const customerTitle = customer
		? `${customer.profile?.firstName ?? ''} ${customer.profile?.lastName ?? ''}`.trim() || 'Customer Details'
		: 'Customer Details';

	if (loading) {
		return (
			<AdminLayout pageTitle={customerTitle}>
				<PageLoader fullScreen={false} message="Loading customer details..." />
			</AdminLayout>
		);
	}

	if (!customer) {
		return (
			<AdminLayout pageTitle={customerTitle}>
				<div className="max-w-4xl mx-auto space-y-5 animate-page-enter">
					<BackButton />
					<div
						className="rounded-xl px-6 py-16 text-center"
						style={{ background: "var(--surface-paper)", border: "1px solid var(--border-light)" }}
					>
						<p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
							Customer not found
						</p>
					</div>
				</div>
			</AdminLayout>
		);
	}

	const profile = customer.profile;
	const address = profile?.address;
	const status = (customer as any).status;

	return (
		<AdminLayout pageTitle={customerTitle}>
			<div className="max-w-4xl mx-auto space-y-5 animate-page-enter">
				<div className="flex items-center justify-between">
					<BackButton />
					<div className="flex items-center gap-2">
						<Button
							variant="outlined"
							size="sm"
							color={status === "A" ? "error" : "primary"}
							onClick={() => setStatusModalOpen(true)}
							loading={toggling}
							disabled={toggling}
						>
							<Power className="w-4 h-4 mr-1.5" />
							{status === "A" ? "Deactivate" : "Activate"}
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
					subtitle={profile?.email}
					status={
						<Badge variant={status === "A" ? "success" : "neutral"} dot>
							{status === "A" ? "Active" : "Inactive"}
						</Badge>
					}
				/>

				{editing ? (
					<DetailSection title="Edit Customer">
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
							<FormInput
								label="Phone Number"
								value={editForm.phoneNumber}
								onChange={(e) => setEditForm((f) => ({ ...f, phoneNumber: e.target.value }))}
							/>
							<div className="sm:col-span-2 flex justify-end">
								<Button variant="filled" size="md" onClick={handleSave} loading={saving} disabled={saving}>
									Save Changes
								</Button>
							</div>
						</div>
					</DetailSection>
				) : (
					<>
						<DetailSection title="Profile Information">
							<DetailRow label="Email" value={profile?.email} />
							<DetailRow label="Phone" value={formatPhoneDisplay(profile?.phoneNumber)} />
							<DetailRow label="Gender" value={profile?.gender ? changeCase.capitalCase(profile.gender) : "—"} />
							<DetailRow
								label="Joined Date"
								value={new Date(customer.createdAt).toLocaleDateString("en-US", {
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							/>
						</DetailSection>

						{address && (
							<DetailSection title="Address">
								<DetailRow label="Street" value={address.street} />
								<DetailRow label="City" value={address.city} />
								<DetailRow label="State" value={address.state} />
								<DetailRow label="Country" value={address.country} />
								<DetailRow label="Postal Code" value={address.postalCode} />
							</DetailSection>
						)}
					</>
				)}
			</div>

			{/* Status Confirmation Modal */}
			<Modal
				isOpen={statusModalOpen}
				onClose={() => setStatusModalOpen(false)}
				title={`${status === "A" ? "Deactivate" : "Activate"} Customer`}
				size="sm"
			>
				<div className="space-y-4">
					<p className="text-sm text-gray-600 dark:text-gray-300">
						Are you sure you want to {status === "A" ? "deactivate" : "activate"}{" "}
						<span className="font-semibold text-on-surface dark:text-white">
							{profile?.firstName} {profile?.lastName}
						</span>?
					</p>
					<div className="flex justify-end gap-3">
						<Button
							variant="outlined"
							color="secondary"
							size="sm"
							onClick={() => setStatusModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							variant="filled"
							color={status === "A" ? "error" : "primary"}
							size="sm"
							loading={toggling}
							onClick={handleToggleStatus}
						>
							{status === "A" ? "Deactivate" : "Activate"}
						</Button>
					</div>
				</div>
			</Modal>
		</AdminLayout>
	);
};

export default withAdminAuth(CustomerDetail);
