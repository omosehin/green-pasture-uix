import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import withAdminAuth from "@/_components/withAdminAuth";
import AdminLayout from "@/_components/AdminLayout";
import { BackButton, DetailHeader, DetailSection, DetailRow } from "@/_UI/DetailField";
import Badge from "@/_UI/Badge";
import Button from "@/_UI/Button";
import { DataTable } from "@/_components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatNumber } from "@/_UI/FormatValue";
import PageLoader from "@/_UI/PageLoader";
import toast from "react-hot-toast";
import axiosInstance from "@/_utils/axiosInstance";
import { BackendItem, BackendReview } from "@/types";
import { Pencil, X, Trash2, Upload, Power, Star } from "lucide-react";
import { FormInput, FormTextarea, FormFileUpload } from "@/_UI/FormField";
import Modal from "@/_UI/Modal";
import FormSelectDropdown from "@/_UI/FormSelect";
import CurrencyInput from "@/_UI/CurrencyInput";
import NumberInput from "@/_UI/NumberInput";
import { useAppDispatch, useAppSelector } from "@/_redux/store";
import { categoryAction } from "@/_redux/actions/category.action";
import RichTextEditor from "@/_UI/RichTextEditor";
import TagPicker from "@/_UI/TagPicker";
import { WEIGHT_UNITS, formatWeight } from "@/_utils/formatWeight";
import SanitizedHtml from "@/_UI/SanitizedHtml";
import { siblingAnchorId } from "@/_utils/siblingAnchorId";
import { variantGroupKey } from "@/_utils/groupVariants";

const ProductDetail: React.FC = () => {
	const router = useRouter();
	const { id } = router.query;
	const [item, setItem] = useState<BackendItem | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [editing, setEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [toggling, setToggling] = useState(false);
	const [statusModalOpen, setStatusModalOpen] = useState(false);
	const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
	const [settingThumbnailId, setSettingThumbnailId] = useState<string | null>(null);
	const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
	const [newImages, setNewImages] = useState<File[]>([]);
	const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
	const [uploadingImages, setUploadingImages] = useState(false);

	const dispatch = useAppDispatch();
	const { productCategories } = useAppSelector((state) => state.category);

	useEffect(() => {
		dispatch(categoryAction.fetchAllCategories());
	}, [dispatch]);

	// Edit form state
	const [editForm, setEditForm] = useState({
		name: "",
		description: "",
		price: "",
		originalPrice: "",
		unit: "",
		category: "",
		status: "A",
		weightValue: "",
		weightUnit: "",
		variantOfItemId: "",
	});
	const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

	// Deliberately not the shared state.product.products slice: the storefront
	// grids read that and expect published items only, while this picker needs
	// unpublished siblings too. Local state keeps the two from colliding.
	const [anchorCandidates, setAnchorCandidates] = useState<any[]>([]);

	useEffect(() => {
		let cancelled = false;
		axiosInstance
			.get("items?page=1&limit=100")
			.then((res) => {
				if (!cancelled) setAnchorCandidates(res.data?.data?.items ?? []);
			})
			.catch(() => {
				// A failed load leaves the picker empty rather than blocking the
				// rest of the edit form — grouping is not the main job here.
			});
		return () => {
			cancelled = true;
		};
	}, []);

	// Any other item can be the anchor, except this one — an item cannot be a
	// size variant of itself, and the API rejects it anyway.
	//
	// The leading empty option is what makes detaching possible at all.
	// FormSelectDropdown renders only the options it is handed and has no
	// clear control of its own — `placeholder` is just the text shown while
	// the value is already empty. Without a selectable "" entry, an item could
	// be grouped through this picker but never ungrouped.
	//
	// ponytail: first 100 items only. The catalogue is far short of that,
	// and the real fix when it isn't is a server-side search on this
	// endpoint, not a bigger number here.
	const anchorOptions = [
		{ value: "", label: "Not a size variant" },
		...anchorCandidates
			.filter((candidate: any) => String(candidate.id) !== String(id))
			.map((candidate: any) => ({ value: candidate.id, label: candidate.name })),
	];

	// Every pack size of this product, smallest first — the same order the
	// storefront chips use. Reuses anchorCandidates rather than fetching again:
	// the picker already loaded the list this filters over.
	const siblingSizes = item
		? anchorCandidates
				.filter((candidate: any) => variantGroupKey(candidate) === variantGroupKey(item))
				.sort((a: any, b: any) => Number(a.weightValue ?? 0) - Number(b.weightValue ?? 0))
		: [];

	// `silent` refreshes in place: the toolbar icon spins but the page keeps its
	// content, instead of collapsing back into the full-page loader.
	const fetchItem = (silent = false) => {
		if (!id) return Promise.resolve();
		silent ? setRefreshing(true) : setLoading(true);
		return axiosInstance
			.get(`items/${id}`)
			.then((res) => {
				const data = res.data?.data ?? res.data;
				setItem(data);
				if (data) {
					setEditForm({
						name: data.name || "",
						description: data.description || "",
						price: String(data.price || ""),
						originalPrice: data.originalPrice ? String(data.originalPrice) : "",
						unit: String(data.unit ?? data.availableQuantity ?? ""),
						category: String(data.product?.id ?? data.category ?? ""),
						status: data.status ?? "A",
						weightValue: data.weightValue ? String(data.weightValue) : "",
						weightUnit: data.weightUnit ?? "",
						variantOfItemId: siblingAnchorId(data, anchorCandidates),
					});
					setSelectedTagIds((data.tags ?? []).map((t: any) => t.id));
				}
			})
			.catch(() => {
				setItem(null);
				toast.error("Failed to load product");
			})
			.finally(() => {
				setLoading(false);
				setRefreshing(false);
			});
	};

	useEffect(() => {
		if (!router.isReady || !id) return;
		fetchItem();
	}, [id, router.isReady]);

	// The candidate list is fetched in parallel with the item, so the hydration
	// above often runs before it lands and the picker shows nothing for a
	// grouped item. Fill it in when the list arrives, without a second fetch.
	useEffect(() => {
		if (!(item as any)?.variantGroupId) return;
		setEditForm((f) => (f.variantOfItemId ? f : { ...f, variantOfItemId: siblingAnchorId(item, anchorCandidates) }));
	}, [anchorCandidates, item]);

	const handleToggleStatus = async () => {
		if (!item) return;
		const isActive = item.status === "A";
		setToggling(true);
		try {
			await axiosInstance.patch(isActive ? "items/deactivate" : "items/activate", { ids: [id] });
			toast.success(isActive ? "Product deactivated successfully" : "Product activated successfully");
			setStatusModalOpen(false);
			fetchItem();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Failed to update product status");
		} finally {
			setToggling(false);
		}
	};

	const handleSave = async () => {
		if (!id) return;
		setSaving(true);
		try {
			const payload: any = {
				name: editForm.name,
				description: editForm.description,
				price: Number(editForm.price),
				originalPrice: editForm.originalPrice !== "" ? Number(editForm.originalPrice) : null,
				unit: Number(editForm.unit),
				weightValue: editForm.weightValue !== "" ? Number(editForm.weightValue) : null,
				weightUnit: editForm.weightUnit.trim() || null,
				// Always sent, so clearing every tag actually clears them. The
				// API treats an absent tagIds as "leave alone" and [] as "clear".
				tagIds: selectedTagIds,
			};

			// Only the picker can detach. If we could not resolve this item's
			// current grouping — the candidates fetch failed, or the sibling sits
			// past the limit — leave the grouping alone rather than asking the API
			// to dissolve it. Absent means "don't touch"; null means detach, and
			// for a group owner that now clears every sibling.
			const groupingResolved = !(item as any)?.variantGroupId || !!siblingAnchorId(item, anchorCandidates);
			if (editForm.variantOfItemId || groupingResolved) {
				payload.variantOfItemId = editForm.variantOfItemId || null;
			}

			if (editForm.category) {
				payload.productId = editForm.category;
			}

			await axiosInstance.patch(`items/${id}`, payload);

			if (editForm.status !== item?.status) {
				const endpoint = editForm.status === "A" ? "items/activate" : "items/deactivate";
				await axiosInstance.patch(endpoint, { ids: [id] });
			}

			toast.success("Product updated");

			// Upload new images if any
			if (newImages.length > 0) {
				await uploadNewImages();
			} else {
				// Only fetch if no images to upload (uploadNewImages calls fetch internally)
				await fetchItem();
			}

			setEditing(false);
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Failed to update");
		} finally {
			setSaving(false);
		}
	};

	const handleDeleteImage = async (imageId: string) => {
		if (!id) return;
		setDeletingImageId(imageId);
		try {
			await axiosInstance.delete(`items/${id}/images/${imageId}`);
			toast.success("Image deleted");
			fetchItem();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Failed to delete image");
		} finally {
			setDeletingImageId(null);
		}
	};

	// Promotes one of the already-uploaded images. Not an upload of its own —
	// the thumbnail is always one of the product's existing shots.
	const handleSetThumbnail = async (imageId: string) => {
		if (!id) return;
		setSettingThumbnailId(imageId);
		try {
			await axiosInstance.patch(`items/${id}/images/${imageId}/thumbnail`);
			toast.success("Thumbnail updated");
			await fetchItem(true);
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Failed to set thumbnail");
		} finally {
			setSettingThumbnailId(null);
		}
	};

	const handleSetDefault = async (itemId: string) => {
		setSettingDefaultId(itemId);
		try {
			await axiosInstance.patch(`items/${itemId}`, { isDefault: true });
			toast.success("Default size updated");
			const res = await axiosInstance.get("items?page=1&limit=100");
			setAnchorCandidates(res.data?.data?.items ?? []);
			if (String(itemId) === String(id)) await fetchItem(true);
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Failed to set default size");
		} finally {
			setSettingDefaultId(null);
		}
	};

	const handleNewImageSelect = (files: File[]) => {
		const valid = files.filter((f) => f.type.startsWith("image/"));
		const maxNewImages = 5 - (item?.photos?.length || 0);
		if (valid.length + newImages.length > maxNewImages) {
			toast.error(`Maximum ${maxNewImages} additional images allowed`);
			return;
		}
		setNewImages((prev) => [...prev, ...valid]);
		valid.forEach((file) => {
			const reader = new FileReader();
			reader.onload = (ev) =>
				setNewImagePreviews((prev) => [...prev, ev.target?.result as string]);
			reader.readAsDataURL(file);
		});
	};

	const removeNewImage = (index: number) => {
		setNewImages((prev) => prev.filter((_, i) => i !== index));
		setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
	};

	const uploadNewImages = async () => {
		if (newImages.length === 0 || !id) return;
		setUploadingImages(true);
		try {
			const formData = new FormData();
			newImages.forEach((file) => formData.append("images", file));
			await axiosInstance.post(`items/${id}/images`, formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			toast.success("Images uploaded successfully");
			setNewImages([]);
			setNewImagePreviews([]);
			fetchItem();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Failed to upload images");
		} finally {
			setUploadingImages(false);
		}
	};

	const handleCancelEdit = () => {
		setEditing(false);
		if (item) {
			setEditForm({
				name: item.name || "",
				description: item.description || "",
				price: String(item.price || ""),
				originalPrice: item.originalPrice ? String(item.originalPrice) : "",
				unit: String(item.unit ?? (item as any).availableQuantity ?? ""),
				category: String(item.product?.id ?? item.category ?? ""),
				status: item.status ?? "A",
				weightValue: (item as any).weightValue ? String((item as any).weightValue) : "",
				weightUnit: (item as any).weightUnit ?? "",
				variantOfItemId: siblingAnchorId(item, anchorCandidates),
			});
			setSelectedTagIds(((item as any).tags ?? []).map((t: any) => t.id));
		}
		setNewImages([]);
		setNewImagePreviews([]);
	};

	const reviewColumns: ColumnDef<BackendReview, any>[] = [
		{
			accessorKey: "rating",
			header: "Rating",
			cell: ({ getValue }) => (
				<span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
					{getValue() as number} / 5
				</span>
			),
		},
		{
			accessorKey: "comment",
			header: "Comment",
			cell: ({ getValue }) => (
				<span className="text-sm" style={{ color: "var(--text-primary)" }}>
					{(getValue() as string) ?? "\u2014"}
				</span>
			),
		},
		{
			accessorKey: "createdAt",
			header: "Date",
			cell: ({ getValue }) => (
				<span className="text-sm" style={{ color: "var(--text-hint)" }}>
					{new Date(getValue() as string).toLocaleDateString()}
				</span>
			),
		},
	];

	const inputStyle = {
		border: "1px solid var(--border-light)",
		color: "var(--text-primary)",
		background: "var(--surface-paper)",
	};

	const itemTitle = item?.name ?? 'Product Details';

	if (loading) {
		return (
			<AdminLayout pageTitle={itemTitle}>
				<PageLoader fullScreen={false} message="Loading product details..." />
			</AdminLayout>
		);
	}

	if (!item) {
		return (
			<AdminLayout pageTitle={itemTitle}>
				<div className="max-w-4xl mx-auto space-y-5 animate-page-enter">
					<BackButton />
					<div
						className="rounded-xl px-6 py-16 text-center"
						style={{ background: "var(--surface-paper)", border: "1px solid var(--border-light)" }}
					>
						<p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
							Product not found
						</p>
					</div>
				</div>
			</AdminLayout>
		);
	}

	const available = item.unit ?? 0;
	const avgRating = item.ratingStats?.average ?? 0;
	const reviewCount = item.ratingStats?.count ?? 0;

	return (
		<AdminLayout pageTitle={itemTitle}>
			<div className="max-w-4xl mx-auto space-y-5 animate-page-enter">
				<div className="flex items-center justify-between">
					<BackButton />
					<div className="flex items-center gap-2">
						<Button
							variant="outlined"
							size="sm"
							color={item.status === "A" ? "error" : "primary"}
							onClick={() => setStatusModalOpen(true)}
							loading={toggling}
							disabled={toggling}
						>
							<Power className="w-4 h-4 mr-1.5" />
							{item.status === "A" ? "Deactivate" : "Activate"}
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
					title={item.name}
					// subtitle={item.product?.name ?? "\u2014"}
					metrics={[
						{ label: "Selling Price (\u20A6)", value: formatCurrency(item.price) },
						...(item.originalPrice ? [{ label: "Original Price (\u20A6)", value: formatCurrency(item.originalPrice) }] : []),
						{ label: "Available Stock", value: formatNumber(available) },
						{ label: "Avg Rating", value: avgRating > 0 ? `${avgRating.toFixed(1)} (${reviewCount})` : "\u2014" },
					]}
				/>

				{editing ? (
					<DetailSection title="Edit Product">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
							<FormInput
								label="Name"
								required
								value={editForm.name}
								onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
							/>
							<CurrencyInput
								label="Selling Price"
								required
								value={editForm.price}
								onChange={(val) => setEditForm((f) => ({ ...f, price: val }))}
								showWords
							/>
							<CurrencyInput
								label="Original price"
								placeholder="Leave empty if not on sale"
								value={editForm.originalPrice}
								onChange={(val) => setEditForm((f) => ({ ...f, originalPrice: val }))}
							/>
							<NumberInput
								label="Available Units"
								required
								value={editForm.unit}
								onChange={(val) => setEditForm((f) => ({ ...f, unit: val }))}
								prefix="Qty"
								min={0}
							/>
							<FormSelectDropdown
								label="Category"
								value={editForm.category}
								onChange={(val) => setEditForm((f) => ({ ...f, category: val }))}
								options={productCategories.map((cat) => ({ value: String(cat.id), label: cat.name }))}
								placeholder="Select category"
							/>
							<FormSelectDropdown
								label="Status"
								value={editForm.status}
								onChange={(val) => setEditForm((f) => ({ ...f, status: val }))}
								options={[
									{ value: "A", label: "Active" },
									{ value: "I", label: "Inactive" },
								]}
								searchable={false}
							/>
							<NumberInput
								label="Pack Size"
								value={editForm.weightValue}
								onChange={(val) => setEditForm((f) => ({ ...f, weightValue: val }))}
								prefix="Size"
								min={0}
							/>
							<FormSelectDropdown
								label="Unit"
								value={editForm.weightUnit}
								onChange={(val) => setEditForm((f) => ({ ...f, weightUnit: val }))}
								options={WEIGHT_UNITS.map((u) => ({ value: u, label: u }))}
								placeholder="Select a unit"
								searchable={false}
							/>

							<div className="sm:col-span-2">
								<FormSelectDropdown
									label="Same product as"
									placeholder="Not a size variant"
									searchable
									value={editForm.variantOfItemId}
									onChange={(val) => setEditForm((f) => ({ ...f, variantOfItemId: val }))}
									options={anchorOptions}
								/>
								<p className="mt-1.5 text-xs" style={{ color: "var(--text-hint)" }}>
									Pick another listing to group this one with it as a pack size of the same product. They will share one card in the shop.
								</p>
							</div>

							<div className="sm:col-span-2">
								<TagPicker value={selectedTagIds} onChange={setSelectedTagIds} />
							</div>

							<div className="sm:col-span-2">
								<label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
									Description
								</label>
								<RichTextEditor
									value={editForm.description}
									onChange={(html) => setEditForm((f) => ({ ...f, description: html }))}
									placeholder="Describe the product benefits, ingredients, etc."
								/>
							</div>

							{/* Image Upload Section */}
							<div className="sm:col-span-2">
								<label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
									Add New Images
								</label>
								<FormFileUpload
									hint={`max ${5 - (item?.photos?.length || 0)} additional images`}
									previews={newImagePreviews}
									onSelect={handleNewImageSelect}
									onRemove={removeNewImage}
									maxFiles={5 - (item?.photos?.length || 0)}
								/>
							</div>

							<div className="sm:col-span-2 flex justify-end">
								<Button variant="filled" size="md" onClick={handleSave} loading={saving || uploadingImages} disabled={saving || uploadingImages}>
									Save Changes
								</Button>
							</div>
						</div>
					</DetailSection>
				) : (
					<DetailSection title="Product Information">
						<DetailRow label="Name" value={item.name} />
						<DetailRow
							label="Description"
							value={
								item.description ? (
									<SanitizedHtml html={item.description} />
								) : (
									"\u2014"
								)
							}
						/>
						<DetailRow label="Category" value={item.product?.name ?? item.category ?? "\u2014"} />
						<DetailRow label="Selling Price" value={formatCurrency(item.price)} />
						<DetailRow label="Original Price" value={item.originalPrice ? formatCurrency(item.originalPrice) : "—"} />
						<DetailRow label="Available" value={formatNumber(available)} />
						<DetailRow
							label="Pack Size"
							value={formatWeight((item as any).weightValue, (item as any).weightUnit) || "\u2014"}
						/>
						<DetailRow
							label="Tags"
							value={
								(item as any).tags?.length ? (
									<div className="flex flex-wrap gap-1.5">
										{(item as any).tags.map((tag: any) => (
											<span
												key={tag.id}
												className="rounded-full px-2 py-0.5 text-[0.65rem] font-medium"
												style={{ background: "rgba(154,202,60,0.16)", color: "var(--color-primary)" }}
											>
												{tag.name}
											</span>
										))}
									</div>
								) : (
									"\u2014"
								)
							}
						/>
						<DetailRow
							label="Status"
							value={
								<Badge variant={item.status === "A" ? "success" : "error"} dot>
									{item.status === "A" ? "Active" : "Inactive"}
								</Badge>
							}
						/>
					</DetailSection>
				)}

				{/* Only worth a panel once there is more than one size — for a lone
				    product the Pack Size row above already says everything. */}
				{siblingSizes.length > 1 && (
					<DetailSection title="Pack sizes">
						<p className="px-5 pt-4 text-xs" style={{ color: "var(--text-hint)" }}>
							These sell as one product on the storefront — one card, with the size chosen on the
							product page. Each size keeps its own price and stock, and is edited on its own page.
						</p>
						<div className="space-y-2 p-5">
							{siblingSizes.map((size: any) => {
								const isCurrent = String(size.id) === String(id);
								return (
									<div
										key={size.id}
										role="button"
										tabIndex={isCurrent ? -1 : 0}
										onClick={() => !isCurrent && router.push(`/admin/product/${size.id}`)}
										onKeyDown={(e) => {
											if (e.target !== e.currentTarget) return;
											if (e.key === " ") e.preventDefault();
											if (!isCurrent && (e.key === "Enter" || e.key === " ")) router.push(`/admin/product/${size.id}`);
										}}
										className={`flex w-full flex-wrap items-center gap-x-4 gap-y-1 rounded-lg px-3.5 py-2.5 text-left transition-opacity ${
											isCurrent ? "cursor-default" : "cursor-pointer hover:opacity-80"
										}`}
										style={{
											background: isCurrent ? "rgba(154,202,60,0.12)" : "var(--surface-low)",
											border: `1px solid ${isCurrent ? "var(--color-primary)" : "var(--border-light)"}`,
										}}
									>
										<span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
											{formatWeight(size.weightValue, size.weightUnit) || "No size set"}
										</span>
										<span className="text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
											{formatCurrency(size.price)}
										</span>
										<span className="text-xs tabular-nums" style={{ color: "var(--text-hint)" }}>
											{formatNumber(Number(size.availableQuantity ?? size.unit ?? 0))} in stock
										</span>
										<span className="ml-auto flex items-center gap-2">
											<Badge variant={size.published ? "success" : "warning"} dot>
												{size.published ? "Published" : "Draft"}
											</Badge>
											{size.isDefault ? (
												<span
													className="inline-flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em]"
													style={{ color: "var(--color-primary)" }}
												>
													<Star className="w-3 h-3 fill-current" />
													Default
												</span>
											) : (
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														handleSetDefault(size.id);
													}}
													disabled={settingDefaultId === size.id}
													className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.65rem] font-semibold disabled:opacity-50"
													style={{ background: "var(--surface-base)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}
												>
													<Star className="w-3 h-3" />
													{settingDefaultId === size.id ? "Setting…" : "Set default"}
												</button>
											)}
											{isCurrent && (
												<span
													className="text-[0.65rem] font-semibold uppercase tracking-[0.12em]"
													style={{ color: "var(--color-primary)" }}
												>
													Editing
												</span>
											)}
										</span>
									</div>
								);
							})}
						</div>
					</DetailSection>
				)}

				{item.photos && item.photos.length > 0 && (
					<DetailSection title="Images">
						<p className="px-5 pt-4 text-xs" style={{ color: "var(--text-hint)" }}>
							The thumbnail is the single image used wherever the product appears in a
							smaller format — cards, listings, search results, cart lines.
						</p>
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-5">
							{/* Existing images */}
							{item.photos.map((photo) => (
								<div
									key={photo.id}
									className="relative group aspect-square rounded-lg overflow-hidden"
									style={{
										border: photo.isThumbnail
											? "2px solid var(--color-primary)"
											: "1px solid var(--border-light)",
									}}
								>
									<img src={photo.url} alt={item.name} className="w-full h-full object-cover" />

									{photo.isThumbnail ? (
										<span
											className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.6rem] font-semibold"
											style={{ background: "var(--color-primary)", color: "#fff" }}
										>
											<Star className="w-3 h-3 fill-current" />
											Thumbnail
										</span>
									) : (
										<button
											onClick={() => handleSetThumbnail(photo.id)}
											disabled={settingThumbnailId === photo.id}
											className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.6rem] font-semibold disabled:opacity-50"
											style={{ background: "rgba(255,255,255,0.92)", color: "var(--color-primary)" }}
										>
											<Star className="w-3 h-3" />
											{settingThumbnailId === photo.id ? "Setting…" : "Make thumbnail"}
										</button>
									)}

									{editing && (
										<button
											onClick={() => handleDeleteImage(photo.id)}
											disabled={deletingImageId === photo.id}
											className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
										>
											<Trash2 className="w-3.5 h-3.5" />
										</button>
									)}
								</div>
							))}

							{/* New images preview (only in edit mode) */}
							{editing && newImagePreviews.map((preview, index) => (
								<div
									key={`new-${index}`}
									className="relative group aspect-square rounded-lg overflow-hidden"
									style={{ border: "1px solid var(--border-light)" }}
								>
									<img src={preview} alt={`New image ${index + 1}`} className="w-full h-full object-cover" />
									<div className="absolute top-2 right-2 p-1.5 rounded-full bg-blue-600 text-white">
										<Upload className="w-3.5 h-3.5" />
									</div>
									<button
										onClick={() => removeNewImage(index)}
										className="absolute top-2 left-2 p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700"
									>
										<Trash2 className="w-3.5 h-3.5" />
									</button>
								</div>
							))}
						</div>
					</DetailSection>
				)}

				{item.reviews && item.reviews.length > 0 && (
					<DetailSection title="Reviews">
						<DataTable
							columns={reviewColumns}
							data={item.reviews}
							manualPagination={false}
							onRefresh={() => fetchItem(true)}
							refreshing={refreshing}
							emptyMessage="No reviews yet"
						/>
					</DetailSection>
				)}
			</div>

			{/* Status Confirmation Modal */}
			<Modal
				isOpen={statusModalOpen}
				onClose={() => setStatusModalOpen(false)}
				title={`${item?.status === "A" ? "Deactivate" : "Activate"} Product`}
				size="sm"
			>
				<div className="space-y-4">
					<p className="text-sm text-gray-600 dark:text-gray-300">
						Are you sure you want to {item?.status === "A" ? "deactivate" : "activate"}{" "}
						<span className="font-semibold text-on-surface dark:text-white">{item?.name}</span>?
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
							color={item?.status === "A" ? "error" : "primary"}
							size="sm"
							loading={toggling}
							onClick={handleToggleStatus}
						>
							{item?.status === "A" ? "Deactivate" : "Activate"}
						</Button>
					</div>
				</div>
			</Modal>
		</AdminLayout>
	);
};

export default withAdminAuth(ProductDetail);
