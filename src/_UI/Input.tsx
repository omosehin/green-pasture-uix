"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helperText?: string;
	leftIcon?: LucideIcon;
	rightIcon?: LucideIcon;
	rightElement?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	(
		{
			label,
			error,
			helperText,
			leftIcon: LeftIcon,
			rightIcon: RightIcon,
			rightElement,
			className = "",
			id,
			...props
		},
		ref,
	) => {
		const inputId = id || props.name || undefined;

		return (
			<div className={className}>
				{label && (
					<label
						htmlFor={inputId}
						className="block text-xs md:text-sm font-bold mb-1"
						style={{ color: "var(--text-secondary)" }}
					>
						{label}
					</label>
				)}
				<div className="relative">
					{LeftIcon && (
						<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
							<LeftIcon
								size={18}
								style={{ color: "var(--text-hint)" }}
							/>
						</div>
					)}
					<input
						ref={ref}
						id={inputId}
						className={[
							"w-full px-3 py-2.5 rounded-md text-xs md:text-sm bg-transparent transition-colors outline-none",
							LeftIcon ? "pl-10" : "",
							RightIcon || rightElement ? "pr-10" : "",
							error
								? "border border-red-500 focus:ring-2 focus:ring-red-500/40 focus:border-red-500"
								: "border focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]",
						]
							.filter(Boolean)
							.join(" ")}
						style={{
							borderColor: error ? undefined : "var(--border-medium)",
							color: "var(--text-primary)",
						}}
						{...props}
					/>
					{(RightIcon || rightElement) && (
						<div className="absolute inset-y-0 right-0 flex items-center pr-3">
							{rightElement ? (
								rightElement
							) : RightIcon ? (
								<RightIcon
									size={18}
									style={{ color: "var(--text-hint)" }}
								/>
							) : null}
						</div>
					)}
				</div>
				{error && (
					<p className="text-xs text-red-500 mt-1">{error}</p>
				)}
				{!error && helperText && (
					<p
						className="text-xs mt-1"
						style={{ color: "var(--text-hint)" }}
					>
						{helperText}
					</p>
				)}
			</div>
		);
	},
);

Input.displayName = "Input";

export default Input;
