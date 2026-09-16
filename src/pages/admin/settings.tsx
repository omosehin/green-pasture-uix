import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import withAdminAuth from "@/_components/withAdminAuth";
import { Store, User, Shield, Truck, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

import { useAppSelector } from "@/_redux/store";
import { useHasPrivilege } from "@/_hooks/usePrivilege";
import AdminLayout from "@/_components/AdminLayout";
import axiosInstance from "@/_utils/axiosInstance";
import { FormInput, FormActions } from "@/_UI/FormField";
import PageLoader from "@/_UI/PageLoader";
import CurrencyInput from "@/_UI/CurrencyInput";
import { rateToPercent, percentToRate } from "@/_utils/rate";
import NumberInput from "@/_UI/NumberInput";
import ChipAutocomplete from "@/_UI/ChipAutocomplete";
import { NIGERIAN_STATES } from "@/_utils/nigerianStates";
import PhoneInput from "@/_UI/PhoneInput";

// ── Schemas ──

const storeSchema = z.object({
	name: z.string().min(1, "Store name is required"),
	houseAddress: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	country: z.string().optional(),
	postalCode: z.string().optional(),
});

const orderShippingSchema = z.object({
	// Entered as a percentage (7.5), persisted as a fraction (0.075). The bound
	// matters: this field used to show the raw fraction next to a "%" suffix, so
	// "0.075 %" invited an admin to "correct" it to 7.5 — which saved a rate of
	// 7.5 and charged 750% tax.
	taxRate: z
		.string()
		.min(1, "Tax rate is required")
		.refine((v) => !Number.isNaN(Number(v)), "Enter a number")
		.refine((v) => Number(v) >= 0 && Number(v) <= 100, "Must be between 0 and 100"),
	freeShippingThreshold: z.string().min(1, "Required"),
});

type OrderShippingFormData = z.infer<typeof orderShippingSchema>;

interface ShippingMethod {
	// Stable React key / update-remove handle — never changes after creation,
	// unlike `id` which is re-derived from the name while the method is new.
	key: string;
	id: string;
	name: string;
	baseCost: string;
	estimatedDays: string;
	enabled: boolean;
	// True only for methods added in this session, so `id` keeps mirroring the
	// name as the admin types. Methods loaded from the store keep whatever id
	// they were saved with — renaming an already-saved method must not change
	// its id out from under checkout.
	autoId: boolean;
}

// "Next Day Delivery" -> "next-day-delivery". Falls back to the caller's
// existing id when the name has no sluggable characters (e.g. empty, or
// symbols only) so an id is never blanked out.
const slugify = (value: string): string =>
	value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

const profileSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	phoneNumber: z.string().optional(),
});

const passwordSchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: z
			.string()
			.min(8, "Minimum 8 characters")
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
				"Must contain an uppercase letter, a lowercase letter, and a number"
			),
		confirmPassword: z.string().min(1, "Please confirm"),
	})
	.refine((d) => d.newPassword === d.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

type StoreFormData = z.infer<typeof storeSchema>;
type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const CARD =
	"rounded-xl bg-white dark:bg-white/[0.04] border border-[rgba(22,163,74,0.06)] dark:border-white/8 shadow-sm dark:shadow-none transition-all duration-300";

const AdminSettings: React.FC = () => {
	const { user } = useAppSelector((state) => state.auth);
	const hasPrivilege = useHasPrivilege();
	// Store Settings and Order & Shipping are store-scoped; a STAFF user without
	// MANAGE_STORES still needs My Profile and Security, so those two tabs hide
	// instead of the whole nav item (see modules.ts for the ungated nav entry).
	const canManageStores = hasPrivilege("MANAGE_STORES");
	const [activeTab, setActiveTab] = useState(() => (canManageStores ? "store" : "profile"));
	const [loading, setLoading] = useState(true);
	const [storeId, setStoreId] = useState<string | null>(null);
	const [storeData, setStoreData] = useState<any>(null);
	const [savingStore, setSavingStore] = useState(false);
	const [savingProfile, setSavingProfile] = useState(false);
	const [savingPassword, setSavingPassword] = useState(false);

	const [savingOrderShipping, setSavingOrderShipping] = useState(false);
	// Storefront sale-treatment kill-switch. Defaults on so an existing store
	// with no saved flag keeps showing the discounts it already had live.
	const [showDiscountBadges, setShowDiscountBadges] = useState(true);
	const [freeShippingRegions, setFreeShippingRegions] = useState<string[]>([]);
	// Multi-currency kill-switch. Defaults OFF so an existing store with no
	// saved flag keeps showing everyone NGN — exactly today's behaviour —
	// until an admin deliberately opts in.
	const [multiCurrencyEnabled, setMultiCurrencyEnabled] = useState(false);
	const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([
		{ key: "standard", id: "standard", name: "Standard Shipping", baseCost: "0", estimatedDays: "5-7 business days", enabled: true, autoId: true },
	]);

	const tabs = [
		{ id: "store", name: "Store Settings", icon: Store },
		{ id: "order", name: "Order & Shipping", icon: Truck },
		{ id: "profile", name: "My Profile", icon: User },
		{ id: "security", name: "Security", icon: Shield },
	].filter((tab) => canManageStores || (tab.id !== "store" && tab.id !== "order"));

	const storeForm = useForm<StoreFormData>({ resolver: zodResolver(storeSchema) });
	const orderShippingForm = useForm<OrderShippingFormData>({ resolver: zodResolver(orderShippingSchema) });
	const profileForm = useForm<ProfileFormData>({ resolver: zodResolver(profileSchema) });
	const passwordForm = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

	// ── Fetch data on mount ──
	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				// Fetch store
				try {
					const storeRes = await axiosInstance.get("store/settings");
					const s = storeRes.data?.data;
					if (s) {
						setStoreData(s);
						setStoreId(s.id);
						storeForm.reset({
							name: s.name || "",
							houseAddress: s.address?.houseAddress || "",
							city: s.address?.city || "",
							state: s.address?.state || "",
							country: s.address?.country || "",
							postalCode: s.address?.postalCode || "",
						});
						orderShippingForm.reset({
							taxRate: String(rateToPercent(Number(s.orderSettings?.taxRate ?? 0))),
							freeShippingThreshold: String(s.orderSettings?.freeShippingThreshold ?? "0"),
						});
						setShowDiscountBadges(s.orderSettings?.showDiscountBadges !== false);
						setFreeShippingRegions(s.orderSettings?.freeShippingRegions ?? []);
						setMultiCurrencyEnabled(s.orderSettings?.multiCurrencyEnabled === true);
						if (s.shippingConfig?.methods?.length > 0) {
							setShippingMethods(
								s.shippingConfig.methods.map((m: any, index: number) => {
									// Backfill once for legacy rows saved without an id — not
									// auto-synced afterward, so editing the name later can't
									// change the id of a method that's already live.
									const id = m.id || slugify(m.name || "") || `method-${index}-${Date.now()}`;
									return {
										key: id,
										id,
										name: m.name || "",
										baseCost: String(m.baseCost ?? "0"),
										estimatedDays: m.estimatedDays || "",
										enabled: m.enabled !== false,
										autoId: false,
									};
								})
							);
						}
					}
				} catch { /* store may not exist yet */ }

				// Fetch profile
				try {
					const profileRes = await axiosInstance.get("profile");
					const p = profileRes.data?.data;
					if (p) {
						profileForm.reset({
							firstName: p.firstName || "",
							lastName: p.lastName || "",
							phoneNumber: p.phoneNumber || "",
						});
					}
				} catch {
					if (user) {
						profileForm.reset({
							firstName: user.firstName || "",
							lastName: user.lastName || "",
							phoneNumber: user.phoneNumber || "",
						});
					}
				}
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// ── Save handlers ──
	const onSaveStore = async (data: StoreFormData) => {
		setSavingStore(true);
		try {
			const payload = {
				name: data.name,
				address: {
					houseAddress: data.houseAddress || "",
					city: data.city || "",
					state: data.state || "",
					country: data.country || "",
					postalCode: data.postalCode || "",
					latitude: storeData?.address?.latitude || "0",
					longitude: storeData?.address?.longitude || "0",
					region: data.state || "",
				},
			};
			if (storeId) {
				await axiosInstance.patch(`store/update/${storeId}`, payload);
				toast.success("Store settings updated");
			} else {
				const res = await axiosInstance.post("store/create", payload);
				const createdStore = res.data?.data;
				setStoreId(createdStore?.id);
				setStoreData(createdStore);
				toast.success("Store created successfully");
			}
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Failed to save");
		} finally {
			setSavingStore(false);
		}
	};

	const onSaveOrderShipping = async (data: OrderShippingFormData) => {
		if (!storeId) {
			toast.error("Please create a store first in Store Settings.");
			return;
		}
		if (shippingMethods.length === 0) {
			toast.error("Add at least one shipping method.");
			return;
		}
		setSavingOrderShipping(true);
		try {
			await axiosInstance.patch(`store/update/${storeId}`, {
				orderSettings: {
					...storeData?.orderSettings,
					taxRate: percentToRate(Number(data.taxRate)),
					freeShippingThreshold: Number(data.freeShippingThreshold),
					freeShippingRegions,
					showDiscountBadges,
					multiCurrencyEnabled,
				},
				shippingConfig: {
					...storeData?.shippingConfig,
					methods: shippingMethods.map((m) => ({
						id: m.id,
						name: m.name,
						baseCost: Number(m.baseCost),
						estimatedDays: m.estimatedDays,
						enabled: m.enabled,
					})),
				},
			});
			toast.success("Order & shipping settings updated");
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Failed to save");
		} finally {
			setSavingOrderShipping(false);
		}
	};

	const toggleDiscountBadges = useCallback(() => {
		setShowDiscountBadges((prev) => !prev);
	}, []);

	const toggleMultiCurrency = useCallback(() => {
		setMultiCurrencyEnabled((prev) => !prev);
	}, []);

	const addShippingMethod = () => {
		const key = `method-${Date.now()}`;
		setShippingMethods((prev) => [
			...prev,
			{ key, id: key, name: "", baseCost: "0", estimatedDays: "", enabled: true, autoId: true },
		]);
	};

	const removeShippingMethod = (key: string) => {
		setShippingMethods((prev) => prev.filter((m) => m.key !== key));
	};

	const updateShippingMethod = (key: string, field: keyof ShippingMethod, value: any) => {
		setShippingMethods((prev) =>
			prev.map((m) => {
				if (m.key !== key) return m;
				const updated = { ...m, [field]: value };
				// Keep a still-new method's id mirroring its name as the admin types.
				if (field === "name" && m.autoId) {
					updated.id = slugify(String(value)) || m.id;
				}
				return updated;
			})
		);
	};

	const onSaveProfile = async (data: ProfileFormData) => {
		setSavingProfile(true);
		try {
			await axiosInstance.patch("profile", data);
			toast.success("Profile updated");
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Failed to update");
		} finally {
			setSavingProfile(false);
		}
	};

	const onChangePassword = async (data: PasswordFormData) => {
		setSavingPassword(true);
		try {
			await axiosInstance.post("auth/change-password", {
				currentPassword: data.currentPassword,
				newPassword: data.newPassword,
			});
			toast.success("Password updated");
			passwordForm.reset();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Failed to change password");
		} finally {
			setSavingPassword(false);
		}
	};

	if (loading) {
		return (
			<AdminLayout>
				<PageLoader fullScreen={false} message="Loading settings..." />
			</AdminLayout>
		);
	}

	return (
		<AdminLayout>
			<div className="animate-page-enter space-y-6">
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
					{/* Sidebar Tabs */}
					<div className="lg:col-span-1">
						<div className={`${CARD} p-2`}>
							<nav className="space-y-1">
								{tabs.map((tab) => {
									const Icon = tab.icon;
									const isActive = activeTab === tab.id;
									return (
										<button
											key={tab.id}
											onClick={() => setActiveTab(tab.id)}
											className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer"
											style={{
												background: isActive ? "rgba(22,163,74,0.08)" : "transparent",
												color: isActive ? "var(--color-primary)" : "var(--text-secondary)",
											}}
											onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--surface-low)"; }}
											onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
										>
											<Icon className="mr-3 h-4 w-4" />
											{tab.name}
										</button>
									);
								})}
							</nav>
						</div>
					</div>

					{/* Content */}
					<div className="lg:col-span-3">
						{/* ── Store Settings ── */}
						{activeTab === "store" && (
							<div className={CARD}>
								<div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-light)" }}>
									<h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Store Settings</h3>
									<p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Manage your store information and address</p>
								</div>
								<form onSubmit={storeForm.handleSubmit(onSaveStore)} className="p-6 space-y-4">
									<FormInput label="Store Name" placeholder="Green Pasture Organics" required {...storeForm.register("name")} error={storeForm.formState.errors.name?.message} />
									<FormInput label="Street Address" placeholder="123 Main Street" {...storeForm.register("houseAddress")} />
									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<FormInput label="City" placeholder="Lagos" {...storeForm.register("city")} />
										<FormInput label="State" placeholder="Lagos" {...storeForm.register("state")} />
									</div>
									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<FormInput label="Country" placeholder="Nigeria" {...storeForm.register("country")} />
										<FormInput label="Postal Code" placeholder="100001" {...storeForm.register("postalCode")} />
									</div>
									<FormActions onCancel={() => storeForm.reset()} cancelLabel="Reset" submitLabel={storeId ? "Update Store" : "Create Store"} isSubmitting={savingStore} />
								</form>
							</div>
						)}

						{/* ── Order & Shipping Settings ── */}
						{activeTab === "order" && (
							<div className={CARD}>
								<div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-light)" }}>
									<h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Order & Shipping</h3>
									<p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Configure tax, shipping fees, and free shipping threshold</p>
								</div>
								<form onSubmit={orderShippingForm.handleSubmit(onSaveOrderShipping)} className="p-6 space-y-5">
									<div>
										<h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-hint)" }}>Tax</h4>
										<NumberInput
											label="Tax Rate"
											placeholder="7.5"
											required
											suffix="%"
											value={orderShippingForm.watch("taxRate")}
											onChange={(val) => orderShippingForm.setValue("taxRate", val)}
											error={orderShippingForm.formState.errors.taxRate?.message}
											hint="Enter the percentage itself — 7.5 means 7.5% VAT. Applied to the order subtotal."
										/>
									</div>

									<div className="h-px w-full" style={{ background: "var(--border-light)" }} />

									<div>
										<h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-hint)" }}>Shipping</h4>
										<div className="space-y-4">
											<CurrencyInput
												label="Free Shipping Threshold"
												placeholder="50,000"
												required
												value={orderShippingForm.watch("freeShippingThreshold")}
												onChange={(val) => orderShippingForm.setValue("freeShippingThreshold", val)}
												error={orderShippingForm.formState.errors.freeShippingThreshold?.message}
											/>
											<p className="text-xs -mt-2" style={{ color: "var(--text-hint)" }}>
												Orders at or above this amount qualify for free shipping. Set to 0 to always charge shipping.
											</p>

											<ChipAutocomplete
												label="Free Shipping Regions"
												placeholder="Search states…"
												options={NIGERIAN_STATES}
												value={freeShippingRegions}
												onChange={setFreeShippingRegions}
												hint="States where the threshold actually earns free delivery, matched against the delivery address. Leave empty to apply it everywhere."
												emptyMessage="No matching state"
											/>
										</div>
									</div>

									<div className="h-px w-full" style={{ background: "var(--border-light)" }} />

									{/* Promotions — storefront sale-treatment kill-switch */}
									<div>
										<h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-hint)" }}>Promotions</h4>
										<div
											className="flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between"
											style={{ border: "1px solid var(--border-light)", background: "var(--surface-low)" }}
										>
											<div className="min-w-0">
												<label htmlFor="showDiscountBadges" className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
													Show discount badges &amp; slashed prices
												</label>
												<p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>
													Displays the <b>-%</b> badge and the struck-through original price wherever
													products appear. Turning this off hides the effect storefront-wide without
													erasing any product&apos;s original price, so you can switch it back on unchanged.
												</p>
											</div>
											<button
												id="showDiscountBadges"
												type="button"
												role="switch"
												aria-checked={showDiscountBadges}
												onClick={toggleDiscountBadges}
												data-testid="toggle-discount-badges"
												className="flex shrink-0 cursor-pointer items-center gap-2 self-start rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:self-auto"
												style={{
													background: showDiscountBadges ? "rgba(154,202,60,0.14)" : "var(--surface-medium)",
													color: showDiscountBadges ? "var(--color-primary)" : "var(--text-hint)",
												}}
											>
												{showDiscountBadges ? (
													<ToggleRight className="h-5 w-5" aria-hidden="true" />
												) : (
													<ToggleLeft className="h-5 w-5" aria-hidden="true" />
												)}
												{showDiscountBadges ? "On" : "Off"}
											</button>
										</div>
									</div>

									<div className="h-px w-full" style={{ background: "var(--border-light)" }} />

									{/* Multi-currency — server-resolved-country display kill-switch */}
									<div>
										<h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-hint)" }}>Currency</h4>
										<div
											className="flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between"
											style={{ border: "1px solid var(--border-light)", background: "var(--surface-low)" }}
										>
											<div className="min-w-0">
												<label htmlFor="multiCurrencyEnabled" className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
													Show foreign visitors prices in their own currency
												</label>
												<p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>
													When on, visitors outside Nigeria see prices converted to their local currency
													based on their detected country. Payment still happens in Naira — this only
													changes what price is displayed. Leave off to show everyone NGN regardless of country.
												</p>
											</div>
											<button
												id="multiCurrencyEnabled"
												type="button"
												role="switch"
												aria-checked={multiCurrencyEnabled}
												onClick={toggleMultiCurrency}
												data-testid="toggle-multi-currency"
												className="flex shrink-0 cursor-pointer items-center gap-2 self-start rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:self-auto"
												style={{
													background: multiCurrencyEnabled ? "rgba(154,202,60,0.14)" : "var(--surface-medium)",
													color: multiCurrencyEnabled ? "var(--color-primary)" : "var(--text-hint)",
												}}
											>
												{multiCurrencyEnabled ? (
													<ToggleRight className="h-5 w-5" aria-hidden="true" />
												) : (
													<ToggleLeft className="h-5 w-5" aria-hidden="true" />
												)}
												{multiCurrencyEnabled ? "On" : "Off"}
											</button>
										</div>
									</div>

									<div className="h-px w-full" style={{ background: "var(--border-light)" }} />

									<div>
										<div className="flex items-center justify-between mb-3">
											<h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-hint)" }}>Shipping Methods</h4>
											<button
												type="button"
												onClick={addShippingMethod}
												className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
												style={{ color: "var(--color-primary)", background: "rgba(22,163,74,0.08)" }}
											>
												<Plus className="h-3.5 w-3.5" />
												Add Method
											</button>
										</div>

										<div className="space-y-3">
											{shippingMethods.map((method, index) => (
												<div
													key={method.key}
													className="rounded-lg p-4 space-y-3"
													style={{
														border: "1px solid var(--border-light)",
														background: method.enabled ? "var(--surface-low)" : "var(--surface-medium)",
														opacity: method.enabled ? 1 : 0.6,
													}}
												>
													<div className="flex items-center justify-between">
														<span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
															Method {index + 1}
														</span>
														<div className="flex items-center gap-2">
															<button
																type="button"
																onClick={() => updateShippingMethod(method.key, "enabled", !method.enabled)}
																className="cursor-pointer"
																title={method.enabled ? "Disable" : "Enable"}
															>
																{method.enabled ? (
																	<ToggleRight className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
																) : (
																	<ToggleLeft className="h-5 w-5" style={{ color: "var(--text-hint)" }} />
																)}
															</button>
															{shippingMethods.length > 1 && (
																<button
																	type="button"
																	onClick={() => removeShippingMethod(method.key)}
																	className="cursor-pointer p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
																	title="Remove method"
																>
																	<Trash2 className="h-3.5 w-3.5" style={{ color: "#ef4444" }} />
																</button>
															)}
														</div>
													</div>
													<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
														<FormInput
															label="Name"
															placeholder="Standard Shipping"
															value={method.name}
															onChange={(e: any) => updateShippingMethod(method.key, "name", e.target.value)}
														/>
														<CurrencyInput
															label="Cost"
															placeholder="2,500"
															value={method.baseCost}
															onChange={(val) => updateShippingMethod(method.key, "baseCost", val)}
														/>
														<FormInput
															label="Estimated Delivery"
															placeholder="5-7 business days"
															value={method.estimatedDays}
															onChange={(e: any) => updateShippingMethod(method.key, "estimatedDays", e.target.value)}
														/>
													</div>
												</div>
											))}
										</div>
									</div>

									<FormActions onCancel={() => orderShippingForm.reset()} cancelLabel="Reset" submitLabel="Update Settings" isSubmitting={savingOrderShipping} />
								</form>
							</div>
						)}

						{/* ── Profile Settings ── */}
						{activeTab === "profile" && (
							<div className={CARD}>
								<div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-light)" }}>
									<h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>My Profile</h3>
									<p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Update your personal information</p>
								</div>
								<form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="p-6 space-y-4">
									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<FormInput label="First Name" required {...profileForm.register("firstName")} error={profileForm.formState.errors.firstName?.message} />
										<FormInput label="Last Name" required {...profileForm.register("lastName")} error={profileForm.formState.errors.lastName?.message} />
									</div>
									<PhoneInput
										label="Phone Number"
										value={profileForm.watch("phoneNumber") || ""}
										onChange={(val) => profileForm.setValue("phoneNumber", val)}
									/>
									<FormInput label="Email" value={user?.email || ""} disabled />
									<FormInput label="Role" value={user?.profileType || "STAFF"} disabled />
									<FormActions onCancel={() => profileForm.reset()} cancelLabel="Reset" submitLabel="Update Profile" isSubmitting={savingProfile} />
								</form>
							</div>
						)}

						{/* ── Security ── */}
						{activeTab === "security" && (
							<div className={CARD}>
								<div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-light)" }}>
									<h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Change Password</h3>
									<p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Update your account password</p>
								</div>
								<form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="p-6 space-y-4 max-w-md">
									<FormInput label="Current Password" type="password" placeholder="Enter current password" required showPasswordToggle {...passwordForm.register("currentPassword")} error={passwordForm.formState.errors.currentPassword?.message} />
									<FormInput label="New Password" type="password" placeholder="Enter new password" required showPasswordToggle {...passwordForm.register("newPassword")} error={passwordForm.formState.errors.newPassword?.message} />
									<FormInput label="Confirm New Password" type="password" placeholder="Confirm new password" required showPasswordToggle {...passwordForm.register("confirmPassword")} error={passwordForm.formState.errors.confirmPassword?.message} />
									<FormActions onCancel={() => passwordForm.reset()} cancelLabel="Cancel" submitLabel="Update Password" isSubmitting={savingPassword} />
								</form>
							</div>
						)}
					</div>
				</div>
			</div>
		</AdminLayout>
	);
};

export default withAdminAuth(AdminSettings);
