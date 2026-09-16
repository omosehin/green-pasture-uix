"use client";

import React, { useState, useCallback, useEffect } from "react";

// ── Number to words ──

const ONES = [
	"", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
	"Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
	"Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const SCALES = ["", "Thousand", "Million", "Billion", "Trillion"];

function chunkToWords(n: number): string {
	if (n === 0) return "";
	if (n < 20) return ONES[n];
	if (n < 100) return `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`;
	return `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? " and " + chunkToWords(n % 100) : ""}`;
}

function numberToWords(num: number): string {
	if (num === 0) return "Zero";
	if (num < 0) return `Negative ${numberToWords(Math.abs(num))}`;
	const chunks: number[] = [];
	let n = Math.floor(num);
	while (n > 0) { chunks.push(n % 1000); n = Math.floor(n / 1000); }
	return chunks
		.map((chunk, i) => (chunk === 0 ? "" : `${chunkToWords(chunk)}${SCALES[i] ? " " + SCALES[i] : ""}`))
		.filter(Boolean)
		.reverse()
		.join(", ");
}

// ── Formatting ──

type CurrencyCode = "NGN" | "USD";

const CURRENCIES: { code: CurrencyCode; symbol: string; label: string }[] = [
	{ code: "NGN", symbol: "₦", label: "Naira" },
	{ code: "USD", symbol: "$", label: "Dollar" },
];

function formatWithCommas(value: string): string {
	const num = value.replace(/[^0-9.]/g, "");
	const [whole, decimal] = num.split(".");
	const formatted = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return decimal !== undefined ? `${formatted}.${decimal}` : formatted;
}

function stripCommas(value: string): string {
	return value.replace(/,/g, "");
}

// ── Component ──

interface CurrencyInputProps {
	label?: string;
	required?: boolean;
	placeholder?: string;
	defaultCurrency?: CurrencyCode;
	value?: string | number;
	onChange?: (value: string) => void;
	error?: string;
	className?: string;
	name?: string;
	showWords?: boolean;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
	(
		{
			label,
			required,
			placeholder = "0",
			defaultCurrency = "NGN",
			value,
			onChange,
			error,
			className = "",
			name,
			showWords = true,
		},
		ref
	) => {
		const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
		const [displayValue, setDisplayValue] = useState("");

		const currencyInfo = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

		useEffect(() => {
			if (value !== undefined && value !== "") {
				const cleaned = stripCommas(String(value));
				setDisplayValue(formatWithCommas(cleaned));
			} else {
			setDisplayValue("");
		}
	}, [value]); // eslint-disable-line react-hooks/exhaustive-deps

		const rawNumber = parseFloat(stripCommas(displayValue)) || 0;
		const wordsText =
			rawNumber > 0
				? `${numberToWords(rawNumber)} ${currencyInfo.label}`
				: "";

		const handleChange = useCallback(
			(e: React.ChangeEvent<HTMLInputElement>) => {
				const raw = e.target.value.replace(/[^0-9.,]/g, "");
				const formatted = formatWithCommas(raw);
				setDisplayValue(formatted);
				const numericValue = stripCommas(raw);
				onChange?.(numericValue);
			},
			[onChange]
		);

		return (
			<div className={`w-full ${className}`}>
				{label && (
					<label
						className="block text-xs md:text-sm mb-1"
						style={{ color: "var(--text-secondary)" }}
					>
						{required ? `${label}*` : label}
					</label>
				)}

				<div
					className="flex items-center rounded-lg overflow-hidden transition-all"
					style={{
						border: error
							? "1.5px solid #ef4444"
							: "1px solid var(--border-light)",
					}}
				>
					{/* Currency selector */}
					<select
						value={currency}
						onChange={(e) =>
							setCurrency(e.target.value as CurrencyCode)
						}
						className="h-full px-2.5 py-2.5 text-xs md:text-sm font-semibold border-none outline-none cursor-pointer"
						style={{
							background: "var(--surface-medium)",
							color: "var(--text-primary)",
							borderRight: "1px solid var(--border-light)",
						}}
					>
						{CURRENCIES.map((c) => (
							<option key={c.code} value={c.code}>
								{c.symbol} {c.code}
							</option>
						))}
					</select>

					{/* Number input */}
					<input
						ref={ref}
						type="text"
						inputMode="decimal"
						name={name}
						value={displayValue}
						onChange={handleChange}
						placeholder={placeholder}
						required={required}
						className="flex-1 px-3 py-2.5 text-xs md:text-sm outline-none bg-transparent"
						style={{ color: "var(--text-primary)" }}
					/>
				</div>

				{error && (
					<span className="text-red-500 text-xs mt-1 block">
						{error}
					</span>
				)}

				{/* Number in words */}
				{showWords && wordsText && (
					<p
						className="text-[0.65rem] mt-1.5 italic leading-snug"
						style={{ color: "var(--color-primary)" }}
					>
						{currencyInfo.symbol} {displayValue} — {wordsText}
					</p>
				)}
			</div>
		);
	}
);

CurrencyInput.displayName = "CurrencyInput";
export default CurrencyInput;
