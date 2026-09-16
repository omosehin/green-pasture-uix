import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Package } from "lucide-react";
import { uuidv7 } from "uuidv7";

import withAdminAuth from "@/_components/withAdminAuth";
import AdminLayout from "@/_components/AdminLayout";
import { BackButton } from "@/_UI/DetailField";
import { FormInput, FormFileUpload, FormActions } from "@/_UI/FormField";
import RichTextEditor from "@/_UI/RichTextEditor";
import TagPicker from "@/_UI/TagPicker";
import { WEIGHT_UNITS } from "@/_utils/formatWeight";
import FormSelectDropdown from "@/_UI/FormSelect";
import CurrencyInput from "@/_UI/CurrencyInput";
import NumberInput from "@/_UI/NumberInput";
import axiosInstance from "@/_utils/axiosInstance";
import { resolveIdempotencyKey, IdempotencyState } from "@/_utils/idempotencyKey";
import { useAppDispatch, useAppSelector } from "@/_redux/store";
import { categoryAction } from "@/_redux/actions/category.action";

const variantSchema = z
	.object({
		price: z.coerce.number().positive("Selling price must be greater than 0"),
		originalPrice: z.preprocess(
			(val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
			z.number().positive("Original price must be greater than 0").optional(),
		),
		unit: z.coerce.number().int().min(0, "Units must be 0 or more"),
		weightValue: z.preprocess(
			(val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
			z.number().positive("Pack size must be greater than 0").optional(),
		),
		weightUnit: z.string().optional(),
	})
	.refine((data) => !data.originalPrice || data.originalPrice > data.price, {
		message: "Original price must be greater than selling price",
		path: ["originalPrice"],
	})
	// A bare number is meaningless on a shelf — "250" of what? Only enforced in
	// that direction: a unit with no amount is just an unfinished field.
	.refine((data) => !data.weightValue || !!data.weightUnit?.trim(), {
		message: "Pick a unit for the pack size",
		path: ["weightUnit"],
	});

const schema = z
	.object({
		// Category ids are uuidv7 strings, not numbers — coercing to a number
		// yields NaN and the field can never validate.
		productId: z.string().min(1, "Category is required"),
		name: z.string().min(1, "Name is required"),
		description: z.string().optional(),
		variants: z.array(variantSchema).min(1, "Add at least one pack size"),
	})
	// Two rows with the same size would create two identically named items and
	// collide on the unique name constraint — catch it here, not in a 500.
	.refine(
		(data) => {
			const sizes = data.variants.map((v) =>
				// Mirrors the server's variantName: either half missing means the
				// item is named with the bare base name, so two such rows collide.
				!v.weightValue || !v.weightUnit?.trim() ? "" : `${v.weightValue}${v.weightUnit.trim().toLowerCase()}`,
			);
			return new Set(sizes).size === sizes.length;
		},
		{ message: "Each pack size must be different", path: ["variants"] },
	);

type FormData = z.infer<typeof schema>;

const AddProductPage: React.FC = () => {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { productCategories } = useAppSelector((state) => state.category);

	const [images, setImages] = useState<File[]>([]);
	const [previews, setPreviews] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<FormData>({
		resolver: zodResolver(schema) as any,
		defaultValues: { variants: [{ price: 0, unit: 0 }] },
	});

	const { fields, append, remove } = useFieldArray({ control, name: "variants" });

	// Same key on a retry of the same attempt (the create timed out client-side
	// while the server kept going, or an admin double-clicks) — the backend's
	// IdempotencyInterceptor then replays the stored response instead of
	// creating a second product. A fresh key the moment anything in the form
	// actually changes, or the retry would hit "same key, different body".
	const idempotencyStateRef = useRef<IdempotencyState>({ key: undefined, signature: undefined });

	useEffect(() => {
		if (productCategories.length === 0) {
			dispatch(categoryAction.fetchAllCategories());
		}
	}, [dispatch, productCategories.length]);

	const handleImageSelect = (files: File[]) => {
		const valid = files.filter((f) => f.type.startsWith("image/"));
		if (valid.length + images.length > 5) {
			toast.error("Maximum 5 images allowed");
			return;
		}
		setImages((prev) => [...prev, ...valid]);
		valid.forEach((file) => {
			const reader = new FileReader();
			reader.onload = (ev) =>
				setPreviews((prev) => [...prev, ev.target?.result as string]);
			reader.readAsDataURL(file);
		});
	};

	const removeImage = (index: number) => {
		setImages((prev) => prev.filter((_, i) => i !== index));
		setPreviews((prev) => prev.filter((_, i) => i !== index));
	};

	const onSubmit = async (data: FormData) => {
		setIsSubmitting(true);
		try {
			const formData = new FormData();
			formData.append("productId", String(data.productId));
			formData.append("name", data.name);
			if (data.description) formData.append("description", data.description);
			// One JSON field rather than variants[0][price]-style keys: the DTO
			// parses it in a single Transform, and multipart has no native
			// representation for an array of objects.
			formData.append(
				"variants",
				JSON.stringify(
					data.variants.map((v) => ({
						price: v.price,
						originalPrice: v.originalPrice ?? null,
						unit: v.unit,
						weightValue: v.weightValue ?? null,
						weightUnit: v.weightUnit?.trim() || null,
					})),
				),
			);
			// Repeated field, which is how the DTO's transform expects it — a
			// single selection arrives as a bare string and is normalised there.
			selectedTagIds.forEach((id) => formData.append("tagIds", id));
			images.forEach((file) => formData.append("images", file));

			const signature = JSON.stringify({
				productId: data.productId,
				name: data.name,
				description: data.description,
				variants: data.variants,
				tagIds: selectedTagIds,
				images: images.map((f) => `${f.name}:${f.size}:${f.lastModified}`),
			});
			idempotencyStateRef.current = resolveIdempotencyKey(idempotencyStateRef.current, signature, uuidv7);

			await axiosInstance.post("items/bulk", formData, {
				headers: { "Content-Type": "multipart/form-data", "Idempotency-Key": idempotencyStateRef.current.key },
			});
			// This attempt succeeded — a future submit is a new one, not a retry.
			idempotencyStateRef.current = { key: undefined, signature: undefined };
			toast.success(data.variants.length > 1 ? `${data.variants.length} pack sizes created` : "Product created successfully");
			router.push("/admin/products");
		} catch (err: any) {
			const message = err?.response?.data?.message ?? err?.message ?? "Failed to create product";
			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<AdminLayout>
			<div className="animate-page-enter space-y-5">
				<BackButton />

				<div className="flex items-center gap-3">
					<div
						className="w-10 h-10 rounded-lg flex items-center justify-center"
						style={{ background: "rgba(22,163,74,0.08)" }}
					>
						<Package size={20} style={{ color: "var(--color-primary)" }} />
					</div>
					<div>
						<h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
							Add Product
						</h1>
						<p className="text-sm" style={{ color: "var(--text-hint)" }}>
							Fill in the details to create a new product listing
						</p>
					</div>
				</div>

				<div
					className="rounded-xl overflow-hidden"
					style={{
						background: "var(--surface-paper)",
						border: "1px solid var(--border-light)",
						boxShadow: "var(--shadow-sm)",
					}}
				>
					<div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-light)" }}>
						<h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
							Product Details
						</h3>
					</div>

					<form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
						<FormInput
							label="Product Name"
							placeholder="e.g. Brain Super Food"
							required
							{...register("name")}
							error={errors.name?.message}
						/>

						<Controller
							name="productId"
							control={control}
							render={({ field }) => (
								<FormSelectDropdown
									label="Category"
									required
									placeholder="Select a category"
									searchable={productCategories.length > 5}
									options={productCategories.map((c) => ({
										value: c.id,
										label: c.name,
									}))}
									value={field.value}
									onChange={field.onChange}
									error={errors.productId?.message}
								/>
							)}
						/>

						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<label className="block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
									Pack sizes <span style={{ color: "#ef4444" }}>*</span>
								</label>
								<button
									type="button"
									onClick={() => append({ price: 0, unit: 0 } as any)}
									className="text-xs font-semibold"
									style={{ color: "var(--color-primary)" }}
								>
									+ Add size
								</button>
							</div>
							<p className="text-xs" style={{ color: "var(--text-hint)" }}>
								One row per size. Each row becomes its own listing with its own price and stock, grouped as one product in the shop.
							</p>

							{fields.map((field, index) => (
								<div
									key={field.id}
									className="rounded-lg p-4 space-y-4"
									style={{ background: "var(--surface-low)", border: "1px solid var(--border-light)" }}
								>
									<div className="flex items-center justify-between">
										<span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-hint)" }}>
											Size {index + 1}
										</span>
										{/* The first row is the product itself — removing it would
										    leave nothing to create. */}
										{index > 0 && (
											<button
												type="button"
												onClick={() => remove(index)}
												className="text-xs font-medium"
												style={{ color: "#ef4444" }}
												aria-label={`Remove size ${index + 1}`}
											>
												Remove
											</button>
										)}
									</div>

									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<Controller
											name={`variants.${index}.weightValue` as const}
											control={control}
											render={({ field: f }) => (
												<NumberInput
													label="Pack Size"
													placeholder="e.g. 250"
													prefix="Size"
													step="0.01"
													min={0}
													value={(f.value as number | undefined) ?? ""}
													onChange={f.onChange}
													error={(errors as any).variants?.[index]?.weightValue?.message}
												/>
											)}
										/>
										<Controller
											name={`variants.${index}.weightUnit` as const}
											control={control}
											render={({ field: f }) => (
												<FormSelectDropdown
													label="Unit"
													value={f.value ?? ""}
													onChange={f.onChange}
													options={WEIGHT_UNITS.map((u) => ({ value: u, label: u }))}
													placeholder="Select a unit"
													error={(errors as any).variants?.[index]?.weightUnit?.message}
													searchable={false}
												/>
											)}
										/>
									</div>

									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<Controller
											name={`variants.${index}.price` as const}
											control={control}
											render={({ field: f }) => (
												<CurrencyInput
													label="Selling Price"
													required
													placeholder="0.00"
													value={f.value || ""}
													onChange={(val) => f.onChange(parseFloat(val) || 0)}
													error={(errors as any).variants?.[index]?.price?.message}
													showWords
												/>
											)}
										/>
										<Controller
											name={`variants.${index}.originalPrice` as const}
											control={control}
											render={({ field: f }) => (
												<CurrencyInput
													label="Original Price"
													placeholder="0.00 (leave empty if not on sale)"
													value={f.value ?? ""}
													onChange={(val) => f.onChange(val === "" ? undefined : parseFloat(val))}
													error={(errors as any).variants?.[index]?.originalPrice?.message}
												/>
											)}
										/>
									</div>

									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<Controller
											name={`variants.${index}.unit` as const}
											control={control}
											render={({ field: f }) => (
												<NumberInput
													label="Available Units"
													placeholder="0"
													required
													prefix="Qty"
													value={f.value ?? ""}
													onChange={(val) => f.onChange(parseInt(val) || 0)}
													error={(errors as any).variants?.[index]?.unit?.message}
												/>
											)}
										/>
									</div>
								</div>
							))}

							{/* `.root`, not `.message`. Once the rows are mounted,
							    zodResolver sees `variants.0.price` in the field
							    registry and routes an array-level issue to
							    errors.variants.root — reading .message directly
							    renders nothing, so a duplicate-size submit would
							    just silently do nothing. */}
							{(errors as any).variants?.root?.message && (
								<p className="text-xs font-medium" style={{ color: "#ef4444" }}>
									{(errors as any).variants.root.message}
								</p>
							)}
						</div>

						<TagPicker value={selectedTagIds} onChange={setSelectedTagIds} />

						<div>
							<label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
								Description
							</label>
							{/* Stored as HTML so pasted formatting survives; the storefront
							    renders it through SanitizedHtml. */}
							<Controller
								name="description"
								control={control}
								render={({ field }) => (
									<RichTextEditor
										value={field.value ?? ""}
										onChange={field.onChange}
										placeholder="Describe the product benefits, ingredients, etc."
										error={errors.description?.message}
									/>
								)}
							/>
						</div>

						<FormFileUpload
							label="Product Images"
							hint="max 5 — shared by every pack size"
							previews={previews}
							onSelect={handleImageSelect}
							onRemove={removeImage}
							maxFiles={5}
						/>

						<FormActions
							onCancel={() => router.push("/admin/products")}
							submitLabel="Create Product"
							isSubmitting={isSubmitting}
						/>
					</form>
				</div>
			</div>
		</AdminLayout>
	);
};

export default withAdminAuth(AddProductPage);
