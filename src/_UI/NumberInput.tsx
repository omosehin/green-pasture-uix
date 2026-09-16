import React, { useState, useCallback } from "react";

interface NumberInputProps {
	label?: string;
	required?: boolean;
	placeholder?: string;
	value?: string | number;
	onChange?: (value: string) => void;
	error?: string;
	className?: string;
	name?: string;
	suffix?: string;
	prefix?: string;
	step?: string;
	min?: number;
	max?: number;
	hint?: string;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
	(
		{
			label,
			required,
			placeholder = "0",
			value,
			onChange,
			error,
			className = "",
			name,
			suffix,
			prefix,
			step,
			min,
			max,
			hint,
		},
		ref
	) => {
		const [focused, setFocused] = useState(false);

		const handleChange = useCallback(
			(e: React.ChangeEvent<HTMLInputElement>) => {
				const raw = e.target.value;
				// Allow empty, digits, single decimal point, and minus
				if (raw === "" || /^-?\d*\.?\d*$/.test(raw)) {
					onChange?.(raw);
				}
			},
			[onChange]
		);

		return (
			<div className={`space-y-1.5 ${className}`}>
				{label && (
					<label
						className="block text-sm font-medium"
						style={{ color: "var(--text-primary)" }}
					>
						{label}
						{required && (
							<span style={{ color: "#ef4444" }}>*</span>
						)}
					</label>
				)}

				<div
					className="relative flex items-center rounded-lg overflow-hidden transition-all"
					style={{
						border: `1.5px solid ${error ? "#ef4444" : focused ? "var(--color-primary)" : "var(--border-light)"}`,
						background: "var(--surface-low)",
					}}
				>
					{prefix && (
						<span
							className="px-3 text-sm font-medium select-none shrink-0"
							style={{
								color: "var(--text-hint)",
								borderRight: "1px solid var(--border-light)",
								background: "var(--surface-medium)",
								alignSelf: "stretch",
								display: "flex",
								alignItems: "center",
							}}
						>
							{prefix}
						</span>
					)}

					<input
						ref={ref}
						type="text"
						inputMode="decimal"
						name={name}
						value={value ?? ""}
						onChange={handleChange}
						onFocus={() => setFocused(true)}
						onBlur={() => setFocused(false)}
						placeholder={placeholder}
						className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none"
						style={{ color: "var(--text-primary)" }}
					/>

					{suffix && (
						<span
							className="px-3 text-sm font-medium select-none shrink-0"
							style={{
								color: "var(--text-hint)",
								borderLeft: "1px solid var(--border-light)",
								background: "var(--surface-medium)",
								alignSelf: "stretch",
								display: "flex",
								alignItems: "center",
							}}
						>
							{suffix}
						</span>
					)}
				</div>

				{hint && !error && (
					<p className="text-xs" style={{ color: "var(--text-hint)" }}>
						{hint}
					</p>
				)}

				{error && (
					<p className="text-xs" style={{ color: "#ef4444" }}>
						{error}
					</p>
				)}
			</div>
		);
	}
);

NumberInput.displayName = "NumberInput";
export default NumberInput;
