"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";

interface Option {
	value: string | number;
	label: string;
}

interface FormSelectDropdownProps {
	label?: string;
	required?: boolean;
	placeholder?: string;
	options: Option[];
	searchable?: boolean;
	value?: string | number;
	onChange?: (value: string) => void;
	error?: string;
	className?: string;
	name?: string;
}

const FormSelectDropdown = React.forwardRef<
	HTMLInputElement,
	FormSelectDropdownProps
>(
	(
		{
			label,
			required,
			placeholder = "Select an option",
			options,
			searchable = true,
			value,
			onChange,
			error,
			className = "",
			name,
		},
		ref
	) => {
		const [open, setOpen] = useState(false);
		const [query, setQuery] = useState("");
		const [highlightedIndex, setHighlightedIndex] = useState(-1);
		const wrapperRef = useRef<HTMLDivElement>(null);
		const inputRef = useRef<HTMLInputElement>(null);
		const listRef = useRef<HTMLUListElement>(null);

		const selectedOption = options.find(
			(o) => String(o.value) === String(value)
		);

		// Close on outside click
		useEffect(() => {
			const handleClick = (e: MouseEvent) => {
				if (
					wrapperRef.current &&
					!wrapperRef.current.contains(e.target as Node)
				) {
					setOpen(false);
					setQuery("");
					setHighlightedIndex(-1);
				}
			};
			document.addEventListener("mousedown", handleClick);
			return () =>
				document.removeEventListener("mousedown", handleClick);
		}, []);

		const filteredOptions = useMemo(() => {
			if (!query) return options;
			return options.filter((o) =>
				o.label.toLowerCase().includes(query.toLowerCase())
			);
		}, [options, query]);

		// Reset highlight when filtered options change
		useEffect(() => {
			setHighlightedIndex(-1);
		}, [filteredOptions.length]);

		const handleSelect = useCallback(
			(opt: Option) => {
				onChange?.(String(opt.value));
				setOpen(false);
				setQuery("");
				setHighlightedIndex(-1);
			},
			[onChange]
		);

		const handleOpen = () => {
			setOpen(true);
			setQuery("");
			setTimeout(() => inputRef.current?.focus(), 0);
		};

		const handleKeyDown = (e: React.KeyboardEvent) => {
			if (!open) {
				if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
					e.preventDefault();
					handleOpen();
				}
				return;
			}

			switch (e.key) {
				case "ArrowDown":
					e.preventDefault();
					setHighlightedIndex((prev) =>
						prev < filteredOptions.length - 1 ? prev + 1 : 0
					);
					break;
				case "ArrowUp":
					e.preventDefault();
					setHighlightedIndex((prev) =>
						prev > 0 ? prev - 1 : filteredOptions.length - 1
					);
					break;
				case "Enter":
					e.preventDefault();
					if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
						handleSelect(filteredOptions[highlightedIndex]);
					}
					break;
				case "Escape":
					setOpen(false);
					setQuery("");
					setHighlightedIndex(-1);
					break;
			}
		};

		// Scroll highlighted item into view
		useEffect(() => {
			if (highlightedIndex >= 0 && listRef.current) {
				const items = listRef.current.querySelectorAll("li");
				items[highlightedIndex]?.scrollIntoView({ block: "nearest" });
			}
		}, [highlightedIndex]);

		return (
			<div
				ref={wrapperRef}
				className={`w-full relative ${className}`}
			>
				{/* Hidden input for react-hook-form */}
				<input
					ref={ref}
					type="hidden"
					name={name}
					value={value ?? ""}
				/>

				{label && (
					<label
						className="block text-xs md:text-sm mb-1"
						style={{ color: "var(--text-secondary)" }}
					>
						{required ? `${label}*` : label}
					</label>
				)}

				{/* Trigger — acts as autocomplete input when open */}
				{open && searchable ? (
					<div
						className="w-full flex items-center rounded-lg overflow-hidden transition-all"
						style={{
							border: error
								? "1.5px solid #ef4444"
								: `2px solid var(--color-primary)`,
							background: "transparent",
						}}
					>
						{/* Search icon */}
						<div className="pl-3 shrink-0">
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								style={{ color: "var(--text-hint)" }}
							>
								<circle cx="11" cy="11" r="8" />
								<line x1="21" y1="21" x2="16.65" y2="16.65" />
							</svg>
						</div>
						<input
							ref={inputRef}
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder={selectedOption?.label || placeholder}
							className="flex-1 px-2 py-2.5 text-xs md:text-sm outline-none bg-transparent"
							style={{ color: "var(--text-primary)" }}
							autoComplete="off"
						/>
						{/* Clear / close */}
						{query && (
							<button
								type="button"
								onClick={() => setQuery("")}
								className="pr-3 shrink-0 cursor-pointer"
								style={{ color: "var(--text-hint)" }}
							>
								<svg
									width="12"
									height="12"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.5"
									strokeLinecap="round"
								>
									<path d="M18 6L6 18M6 6l12 12" />
								</svg>
							</button>
						)}
					</div>
				) : (
					<button
						type="button"
						onClick={handleOpen}
						onKeyDown={handleKeyDown}
						className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs md:text-sm text-left transition-all cursor-pointer"
						style={{
							background: "transparent",
							border: error
								? "1.5px solid #ef4444"
								: "1px solid var(--border-light)",
							color: selectedOption
								? "var(--text-primary)"
								: "var(--text-hint)",
						}}
					>
						<span className="truncate">
							{selectedOption?.label ?? placeholder}
						</span>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="shrink-0 ml-2"
							style={{ color: "var(--text-hint)" }}
						>
							<polyline points="6 9 12 15 18 9" />
						</svg>
					</button>
				)}

				{error && (
					<span className="text-red-500 text-xs mt-1 block">
						{error}
					</span>
				)}

				{/* Dropdown options */}
				{open && (
					<div
						className="absolute z-50 mt-1 w-full rounded-lg overflow-hidden animate-dropdown-enter"
						style={{
							background: "var(--surface-paper)",
							border: "1px solid var(--border-light)",
							boxShadow: "var(--shadow-lg)",
						}}
					>
						<ul
							ref={listRef}
							className="max-h-52 overflow-y-auto py-1"
							role="listbox"
						>
							{filteredOptions.length > 0 ? (
								filteredOptions.map((opt, index) => {
									const isSelected =
										String(opt.value) === String(value);
									const isHighlighted =
										index === highlightedIndex;
									return (
										<li
											key={opt.value}
											role="option"
											aria-selected={isSelected}
											onClick={() => handleSelect(opt)}
											className="flex items-center gap-2 px-3 py-2.5 text-xs cursor-pointer transition-colors"
											style={{
												background: isHighlighted
													? "var(--surface-medium)"
													: isSelected
														? "var(--surface-low)"
														: "transparent",
												color: "var(--text-primary)",
											}}
											onMouseEnter={() =>
												setHighlightedIndex(index)
											}
										>
											<span className="w-4 shrink-0">
												{isSelected && (
													<svg
														width="14"
														height="14"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2.5"
														strokeLinecap="round"
														strokeLinejoin="round"
														style={{
															color: "var(--color-primary)",
														}}
													>
														<polyline points="20 6 9 17 4 12" />
													</svg>
												)}
											</span>
											<span
												className={
													isSelected
														? "font-semibold"
														: "font-normal"
												}
											>
												{/* Highlight matching text */}
												{query ? (
													highlightMatch(
														opt.label,
														query
													)
												) : (
													opt.label
												)}
											</span>
										</li>
									);
								})
							) : (
								<li
									className="px-3 py-6 text-xs text-center"
									style={{ color: "var(--text-hint)" }}
								>
									No results for &ldquo;{query}&rdquo;
								</li>
							)}
						</ul>
					</div>
				)}
			</div>
		);
	}
);

// Highlight matching substring in bold
function highlightMatch(text: string, query: string): React.ReactNode {
	if (!query) return text;
	const index = text.toLowerCase().indexOf(query.toLowerCase());
	if (index === -1) return text;
	return (
		<>
			{text.slice(0, index)}
			<span className="font-bold" style={{ color: "var(--color-primary)" }}>
				{text.slice(index, index + query.length)}
			</span>
			{text.slice(index + query.length)}
		</>
	);
}

FormSelectDropdown.displayName = "FormSelectDropdown";
export default FormSelectDropdown;
