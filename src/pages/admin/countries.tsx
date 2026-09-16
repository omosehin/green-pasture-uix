import React, { useCallback, useEffect, useState } from "react";
import withAdminAuth from "@/_components/withAdminAuth";
import { ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";

import { BackendCountry } from "@/types";
import AdminLayout from "@/_components/AdminLayout";
import { DataTable } from "@/_components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import ActionMenu from "@/_UI/ActionMenu";
import Badge from "@/_UI/Badge";
import Button from "@/_UI/Button";
import Modal from "@/_UI/Modal";
import { FormInput } from "@/_UI/FormField";
import NumberInput from "@/_UI/NumberInput";
import axiosInstance from "@/_utils/axiosInstance";
import { useListParams } from "@/_hooks/useListParams";
import { isPlausiblePriceFactor } from "@/_utils/priceFactor";

const EDIT_ICON = (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
);

const NAIRA_SAMPLE = 10000;

/** "₦10,000 shows as $6.20" — the storefront effect of a rate, spelled out so a typo is obvious. */
function previewEffect(factor: number, currencyCode: string): string {
	if (!Number.isFinite(factor) || factor <= 0) return "";
	const converted = factor * NAIRA_SAMPLE;
	let convertedStr: string;
	try {
		convertedStr = new Intl.NumberFormat(undefined, { style: "currency", currency: currencyCode || "USD" }).format(converted);
	} catch {
		convertedStr = `${converted.toFixed(2)} ${currencyCode}`;
	}
	return `₦${NAIRA_SAMPLE.toLocaleString()} shows as ${convertedStr}`;
}

const Countries: React.FC = () => {
	const [countries, setCountries] = useState<BackendCountry[]>([]);
	const [loading, setLoading] = useState(true);
	const [pagination, setPagination] = useState<any>(null);
	const { page: currentPage, pageSize, search: searchTerm, setPage, setSearch, setPageSize } = useListParams();

	const [editTarget, setEditTarget] = useState<BackendCountry | null>(null);
	const [currencyCode, setCurrencyCode] = useState("");
	const [priceFactor, setPriceFactor] = useState("");
	const [shippingEnabled, setShippingEnabled] = useState(true);
	const [saving, setSaving] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const fetchCountries = useCallback(() => {
		setLoading(true);
		const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : "";
		axiosInstance
			.get(`country?page=${currentPage}&limit=${pageSize}${searchParam}`)
			.then((res) => {
				const data = res.data?.data ?? res.data;
				setCountries(data?.items ?? data ?? []);
				setPagination(data?.meta ?? null);
			})
			.catch(() => {
				toast.error("Failed to load countries");
			})
			.finally(() => {
				setLoading(false);
			});
	}, [currentPage, searchTerm, pageSize]);

	useEffect(() => {
		fetchCountries();
	}, [fetchCountries]);

	// NGN is the app's base currency — useCurrency does priceInNaira * priceFactor,
	// so this row's rate must stay exactly 1 or every other country's price is off.
	const isBaseCurrency = editTarget?.currencyCode === "NGN";

	const openEdit = (country: BackendCountry) => {
		setEditTarget(country);
		setCurrencyCode(country.currencyCode);
		setPriceFactor(String(Number(country.priceFactor)));
		setShippingEnabled(country.shippingEnabled);
		setFormError(null);
	};

	const closeEdit = () => {
		setEditTarget(null);
		setFormError(null);
	};

	const handleSave = async () => {
		if (!editTarget) return;
		const code = currencyCode.trim().toUpperCase();
		if (!/^[A-Z]{3}$/.test(code)) {
			setFormError("Currency code must be exactly 3 letters (e.g. USD).");
			return;
		}
		const factor = Number(priceFactor);
		if (isBaseCurrency) {
			if (factor !== 1) {
				setFormError("Nigeria is the base currency — its price factor must stay 1.");
				return;
			}
		} else if (!isPlausiblePriceFactor(factor)) {
			setFormError("Price factor must be a number greater than 0 and less than 1 (e.g. 0.00062 for USD).");
			return;
		}

		setSaving(true);
		setFormError(null);
		try {
			await axiosInstance.put(`country/modify/${editTarget.id}`, {
				currencyCode: code,
				priceFactor: factor,
				shippingEnabled,
			});
			toast.success("Country updated successfully");
			closeEdit();
			fetchCountries();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Failed to update country");
		} finally {
			setSaving(false);
		}
	};

	const columns: ColumnDef<BackendCountry, any>[] = [
		{
			accessorKey: "name",
			header: "Name",
			cell: ({ getValue }) => (
				<span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{String(getValue())}</span>
			),
		},
		{
			accessorKey: "code",
			header: "Code",
			cell: ({ getValue }) => (
				<span className="text-sm" style={{ color: "var(--text-secondary)" }}>{String(getValue())}</span>
			),
		},
		{
			accessorKey: "currencyCode",
			header: "Currency",
			cell: ({ getValue }) => <Badge variant="info">{String(getValue())}</Badge>,
		},
		{
			accessorKey: "priceFactor",
			header: "Price Factor",
			cell: ({ getValue }) => (
				<span className="text-sm font-mono" style={{ color: "var(--text-primary)" }}>{Number(getValue()).toFixed(6)}</span>
			),
		},
		{
			accessorKey: "shippingEnabled",
			header: "Shipping",
			cell: ({ getValue }) => (
				<Badge variant={getValue() ? "success" : "neutral"} dot>
					{getValue() ? "Ships" : "Blocked"}
				</Badge>
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
					{ label: "Edit", icon: EDIT_ICON, onClick: () => openEdit(row.original) },
				]} />
			),
		},
	];

	return (
		<AdminLayout>
			<div className="animate-page-enter space-y-6">
				<DataTable
					columns={columns}
					data={countries}
					isLoading={loading}
					onRefresh={fetchCountries}
					refreshing={loading}
					manualFiltering
					globalFilter={searchTerm}
					onGlobalFilterChange={setSearch}
					searchPlaceholder="Search countries..."
					pageIndex={currentPage - 1}
					pageSize={pageSize}
					pageCount={pagination?.totalPages ?? 1}
					totalItems={pagination?.totalItems}
					onPageChange={(idx) => setPage(idx + 1)}
					onPageSizeChange={setPageSize}
					onRowClick={(row) => openEdit(row)}
					emptyMessage="No countries found"
				/>

				{/* Edit Country Modal */}
				<Modal
					isOpen={!!editTarget}
					onClose={closeEdit}
					title={editTarget ? `Edit ${editTarget.name}` : ""}
					subtitle={editTarget ? `Country code ${editTarget.code}` : undefined}
					size="md"
				>
					<div className="space-y-4 pb-2">
						<FormInput
							label="Currency Code"
							placeholder="USD"
							required
							maxLength={3}
							value={currencyCode}
							disabled={isBaseCurrency}
							onChange={(e: any) => setCurrencyCode(e.target.value.toUpperCase())}
						/>
						{isBaseCurrency && (
							<p className="text-xs -mt-3" style={{ color: "var(--text-hint)" }}>
								Nigeria's currency is fixed as NGN — the store's base currency.
							</p>
						)}

						<div>
							{isBaseCurrency ? (
								<FormInput
									label="Price Factor"
									value="1.000000"
									disabled
								/>
							) : (
								<NumberInput
									label="Price Factor"
									placeholder="0.00062"
									required
									value={priceFactor}
									onChange={setPriceFactor}
									hint="The NGN → this currency rate used to price the storefront. Must be greater than 0 and less than 1."
								/>
							)}
							{isBaseCurrency && (
								<p className="text-xs mt-1.5" style={{ color: "var(--text-hint)" }}>
									Nigeria is the base currency — its rate is fixed at 1 and cannot be changed.
								</p>
							)}
							{!isBaseCurrency && previewEffect(Number(priceFactor), currencyCode) && (
								<p className="text-xs mt-1.5 font-medium" style={{ color: "var(--color-primary)" }}>
									{previewEffect(Number(priceFactor), currencyCode)}
								</p>
							)}
						</div>

						<div
							className="flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between"
							style={{ border: "1px solid var(--border-light)", background: "var(--surface-low)" }}
						>
							<div className="min-w-0">
								<label htmlFor="shippingEnabled" className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
									Accept shipping to this country
								</label>
								<p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>
									Turning this off blocks checkout to this destination. It does not hide the
									country from browsing — visitors can still see the storefront, just not ship here.
								</p>
							</div>
							<button
								id="shippingEnabled"
								type="button"
								role="switch"
								aria-checked={shippingEnabled}
								onClick={() => setShippingEnabled((v) => !v)}
								className="flex shrink-0 cursor-pointer items-center gap-2 self-start rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:self-auto"
								style={{
									background: shippingEnabled ? "rgba(154,202,60,0.14)" : "var(--surface-medium)",
									color: shippingEnabled ? "var(--color-primary)" : "var(--text-hint)",
								}}
							>
								{shippingEnabled ? (
									<ToggleRight className="h-5 w-5" aria-hidden="true" />
								) : (
									<ToggleLeft className="h-5 w-5" aria-hidden="true" />
								)}
								{shippingEnabled ? "On" : "Off"}
							</button>
						</div>

						{formError && (
							<p className="text-xs" style={{ color: "#ef4444" }}>{formError}</p>
						)}

						<div className="flex justify-end gap-3 pt-2" style={{ borderTop: "1px solid var(--border-light)" }}>
							<Button variant="outlined" color="secondary" size="sm" onClick={closeEdit}>
								Cancel
							</Button>
							<Button variant="filled" size="sm" loading={saving} disabled={saving} onClick={handleSave}>
								Save Changes
							</Button>
						</div>
					</div>
				</Modal>
			</div>
		</AdminLayout>
	);
};

export default withAdminAuth(Countries);
