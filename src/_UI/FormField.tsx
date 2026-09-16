"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// ── Text Input ──

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	required?: boolean;
	showPasswordToggle?: boolean;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
	({ label, error, required, className = "", showPasswordToggle, type, ...props }, ref) => {
		const [showPassword, setShowPassword] = useState(false);
		const resolvedType = showPasswordToggle ? (showPassword ? "text" : "password") : type;

		return (
			<div className="w-full">
				{label && (
					<label
						className="block text-xs md:text-sm font-semibold mb-1"
						style={{ color: "var(--text-secondary)" }}
					>
						{required ? `${label}` : label}
					</label>
				)}
				<div className="relative">
					<input
						ref={ref}
						type={resolvedType}
						className={`block w-full text-xs md:text-sm rounded-md px-3 py-2.5 bg-transparent placeholder:text-gray-400 dark:placeholder:text-white/25 focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors ${
							error
								? "border border-red-500 focus:ring-red-500/40 focus:border-red-500"
								: "border focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]"
						} ${showPasswordToggle ? "pr-10" : ""} ${className}`}
						style={{
							borderColor: error ? undefined : "var(--border-light)",
							color: "var(--text-primary)",
						}}
						{...props}
					/>
					{showPasswordToggle && (
						<button
							type="button"
							tabIndex={-1}
							onClick={() => setShowPassword((s) => !s)}
							className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
							style={{ color: "var(--text-hint)" }}
						>
							{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
						</button>
					)}
				</div>
				{error && (
					<span className="text-red-500 text-xs mt-1 block">
						{error}
					</span>
				)}
			</div>
		);
	}
);
FormInput.displayName = "FormInput";

// ── Textarea ──

interface FormTextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string;
	error?: string;
	required?: boolean;
}

export const FormTextarea = React.forwardRef<
	HTMLTextAreaElement,
	FormTextareaProps
>(({ label, error, required, className = "", ...props }, ref) => {
	return (
		<div className="w-full">
			{label && (
				<label
					className="block text-xs md:text-sm font-semibold mb-1"
					style={{ color: "var(--text-secondary)" }}
				>
					{required ? `${label}*` : label}
				</label>
			)}
			<textarea
				ref={ref}
				className={`block w-full text-xs md:text-sm rounded-md px-3 py-2.5 bg-transparent placeholder:text-gray-400 dark:placeholder:text-white/25 focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors resize-none ${
					error
						? "border border-red-500 focus:ring-red-500/40 focus:border-red-500"
						: "border focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]"
				} ${className}`}
				style={{
					borderColor: error ? undefined : "var(--border-light)",
					color: "var(--text-primary)",
				}}
				{...props}
			/>
			{error && (
				<span className="text-red-500 text-xs mt-1 block">
					{error}
				</span>
			)}
		</div>
	);
});
FormTextarea.displayName = "FormTextarea";

// ── Select ──

interface FormSelectProps
	extends React.SelectHTMLAttributes<HTMLSelectElement> {
	label?: string;
	error?: string;
	required?: boolean;
	options: { value: string | number; label: string }[];
	placeholder?: string;
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
	(
		{
			label,
			error,
			required,
			options,
			placeholder,
			className = "",
			...props
		},
		ref
	) => {
		return (
			<div className="w-full">
				{label && (
					<label
						className="block text-xs md:text-sm font-semibold mb-1"
						style={{ color: "var(--text-secondary)" }}
					>
						{required ? `${label}*` : label}
					</label>
				)}
				<select
					ref={ref}
					className={`block w-full text-xs md:text-sm rounded-md px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors cursor-pointer appearance-none ${
						error
							? "border border-red-500 focus:ring-red-500/40 focus:border-red-500"
							: "border focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]"
					} ${className}`}
					style={{
						borderColor: error
							? undefined
							: "var(--border-light)",
						color: "var(--text-primary)",
						background: "var(--surface-low)",
						backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
						backgroundPosition: "right 0.5rem center",
						backgroundRepeat: "no-repeat",
						backgroundSize: "1.5em 1.5em",
						paddingRight: "2.5rem",
					}}
					{...props}
				>
					{placeholder && (
						<option value="">{placeholder}</option>
					)}
					{options.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
				{error && (
					<span className="text-red-500 text-xs mt-1 block">
						{error}
					</span>
				)}
			</div>
		);
	}
);
FormSelect.displayName = "FormSelect";

// ── File Upload ──

interface FormFileUploadProps {
	label?: string;
	hint?: string;
	accept?: string;
	multiple?: boolean;
	previews?: string[];
	onSelect: (files: File[]) => void;
	onRemove?: (index: number) => void;
	maxFiles?: number;
	error?: string;
}

export const FormFileUpload: React.FC<FormFileUploadProps> = ({
	label,
	hint,
	accept = "image/*",
	multiple = true,
	previews = [],
	onSelect,
	onRemove,
	maxFiles = 5,
	error,
}) => {
	const inputRef = React.useRef<HTMLInputElement>(null);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		onSelect(files);
		if (inputRef.current) inputRef.current.value = "";
	};

	return (
		<div className="w-full">
			{label && (
				<label
					className="block text-xs md:text-sm font-semibold mb-1"
					style={{ color: "var(--text-secondary)" }}
				>
					{label}
					{hint && (
						<span
							className="font-normal ml-1"
							style={{ color: "var(--text-disabled)" }}
						>
							({hint})
						</span>
					)}
				</label>
			)}

			{/* Preview grid */}
			{previews.length > 0 && (
				<div className="grid grid-cols-3 gap-2 mb-3 sm:grid-cols-5">
					{previews.map((src, i) => (
						<div
							key={i}
							className="relative aspect-square rounded-lg overflow-hidden group"
							style={{
								border: "1px solid var(--border-light)",
							}}
						>
							<img
								src={src}
								alt={`Preview ${i + 1}`}
								className="w-full h-full object-cover"
							/>
							{onRemove && (
								<button
									type="button"
									onClick={() => onRemove(i)}
									className="absolute top-1 right-1 p-0.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
								>
									<svg
										width="10"
										height="10"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="3"
										strokeLinecap="round"
									>
										<path d="M18 6L6 18M6 6l12 12" />
									</svg>
								</button>
							)}
						</div>
					))}
				</div>
			)}

			{/* Upload area */}
			{previews.length < maxFiles && (
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					className="w-full py-5 rounded-xl border-2 border-dashed flex flex-col items-center gap-1.5 transition-all cursor-pointer"
					style={{
						borderColor: error
							? "#ef4444"
							: "var(--border-light)",
						color: "var(--text-hint)",
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.borderColor =
							"var(--color-primary)";
						e.currentTarget.style.background =
							"rgba(22,163,74,0.04)";
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.borderColor = error
							? "#ef4444"
							: "var(--border-light)";
						e.currentTarget.style.background = "transparent";
					}}
				>
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
						<polyline points="17 8 12 3 7 8" />
						<line x1="12" y1="3" x2="12" y2="15" />
					</svg>
					<span className="text-xs font-medium">
						Click to upload
					</span>
					<span className="text-[0.6rem]">
						PNG, JPG, WebP up to 10MB
					</span>
				</button>
			)}

			{error && (
				<span className="text-red-500 text-xs mt-1 block">
					{error}
				</span>
			)}

			<input
				ref={inputRef}
				type="file"
				accept={accept}
				multiple={multiple}
				onChange={handleChange}
				className="hidden"
			/>
		</div>
	);
};

// ── Form Actions (footer buttons) ──

interface FormActionsProps {
	onCancel: () => void;
	submitLabel?: string;
	cancelLabel?: string;
	isSubmitting?: boolean;
}

export const FormActions: React.FC<FormActionsProps> = ({
	onCancel,
	submitLabel = "Save",
	cancelLabel = "Cancel",
	isSubmitting = false,
}) => {
	return (
		<div
			className="flex justify-end gap-3 pt-4 mt-2"
			style={{ borderTop: "1px solid var(--border-light)" }}
		>
			<button
				type="button"
				onClick={onCancel}
				className="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
				style={{
					border: "1px solid var(--border-medium)",
					color: "var(--text-secondary)",
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.background = "var(--surface-low)";
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.background = "transparent";
				}}
			>
				{cancelLabel}
			</button>
			<button
				type="submit"
				disabled={isSubmitting}
				className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed press-effect"
				style={{
					background: "var(--color-primary)",
					boxShadow: "var(--shadow-sm)",
				}}
			>
				{isSubmitting ? (
					<span className="flex items-center gap-2">
						<svg
							className="animate-spin w-4 h-4"
							viewBox="0 0 24 24"
							fill="none"
						>
							<circle
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="3"
								strokeDasharray="31.4"
								strokeDashoffset="10"
								strokeLinecap="round"
							/>
						</svg>
						Saving...
					</span>
				) : (
					submitLabel
				)}
			</button>
		</div>
	);
};
