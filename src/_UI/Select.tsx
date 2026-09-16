"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
	label?: string;
	error?: string;
	helperText?: string;
	options: Array<{ value: string; label: string }>;
	placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
	(
		{
			label,
			error,
			helperText,
			options,
			placeholder,
			className = "",
			id,
			...props
		},
		ref,
	) => {
		const selectId = id || props.name || undefined;

		return (
			<div className={className}>
				{label && (
					<label
						htmlFor={selectId}
						className="block text-sm font-medium text-on-surface dark:text-gray-200 mb-1.5"
					>
						{label}
					</label>
				)}
				<div className="relative">
					<select
						ref={ref}
						id={selectId}
						className={[
							"w-full px-3 py-2.5 rounded-radius-md border bg-white dark:bg-white/[0.04] text-on-surface dark:text-white appearance-none transition-colors outline-none pr-10",
							error
								? "border-error-600 focus:border-error-600 focus:ring-2 focus:ring-error-600/20"
								: "border-outline dark:border-white/15 focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 dark:focus:ring-primary-400/20",
						]
							.filter(Boolean)
							.join(" ")}
						{...props}
					>
						{placeholder && (
							<option value="" disabled>
								{placeholder}
							</option>
						)}
						{options.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
					<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
						<ChevronDown
							size={18}
							className="text-gray-400 dark:text-gray-500"
						/>
					</div>
				</div>
				{error && (
					<p className="text-sm text-error-600 mt-1">{error}</p>
				)}
				{!error && helperText && (
					<p className="text-sm text-on-surface-variant dark:text-gray-400 mt-1">
						{helperText}
					</p>
				)}
			</div>
		);
	},
);

Select.displayName = "Select";

export default Select;
