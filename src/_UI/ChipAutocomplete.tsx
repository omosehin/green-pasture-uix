"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

interface ChipAutocompleteProps {
	label?: string;
	hint?: string;
	placeholder?: string;
	/** Currently selected values. */
	value: string[];
	onChange: (values: string[]) => void;
	/** Everything selectable. Already-selected entries are filtered out. */
	options: readonly string[];
	/** Let the user commit a value that isn't in `options`. */
	allowCustom?: boolean;
	error?: string;
	emptyMessage?: string;
}

/**
 * Multi-select as chips with a filtering input.
 *
 * Built rather than pulled in: the app has no combobox dependency, and the
 * behaviour that matters here is a short, known list — filter, arrow, commit,
 * remove. Keyboard support is the reason this isn't just an input and a map:
 * a field you can only operate with a mouse is not finished.
 */
const ChipAutocomplete: React.FC<ChipAutocompleteProps> = ({
	label,
	hint,
	placeholder = "Type to search…",
	value,
	onChange,
	options,
	allowCustom = false,
	error,
	emptyMessage = "No matches",
}) => {
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(0);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const listId = React.useId();

	const selectedLower = useMemo(() => new Set(value.map((v) => v.toLowerCase())), [value]);

	const matches = useMemo(() => {
		const q = query.trim().toLowerCase();
		const available = options.filter((o) => !selectedLower.has(o.toLowerCase()));
		if (!q) return available;
		// Prefix matches first — typing "la" should surface Lagos above Plateau.
		const starts = available.filter((o) => o.toLowerCase().startsWith(q));
		const contains = available.filter((o) => !o.toLowerCase().startsWith(q) && o.toLowerCase().includes(q));
		return [...starts, ...contains];
	}, [options, query, selectedLower]);

	useEffect(() => setActiveIndex(0), [query, open]);

	// Close on outside click — a dropdown that survives a click elsewhere traps
	// the rest of the form behind it.
	useEffect(() => {
		if (!open) return;
		const onDocClick = (e: MouseEvent) => {
			if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener("mousedown", onDocClick);
		return () => document.removeEventListener("mousedown", onDocClick);
	}, [open]);

	const add = (raw: string) => {
		const next = raw.trim();
		if (!next || selectedLower.has(next.toLowerCase())) return;
		onChange([...value, next]);
		setQuery("");
		setOpen(false);
	};

	const remove = (item: string) => onChange(value.filter((v) => v !== item));

	const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setOpen(true);
			setActiveIndex((i) => Math.min(i + 1, matches.length - 1));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setActiveIndex((i) => Math.max(i - 1, 0));
		} else if (e.key === "Enter") {
			e.preventDefault();
			if (matches[activeIndex]) add(matches[activeIndex]);
			else if (allowCustom) add(query);
		} else if (e.key === "Escape") {
			setOpen(false);
		} else if (e.key === "Backspace" && !query && value.length) {
			// Backspace on an empty input removes the last chip — the behaviour
			// every chip field has, and the fastest way to undo a mis-click.
			remove(value[value.length - 1]);
		}
	};

	return (
		<div ref={wrapperRef}>
			{label && (
				<label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
					{label}
				</label>
			)}

			<div
				onClick={() => inputRef.current?.focus()}
				className="flex min-h-[2.75rem] w-full flex-wrap items-center gap-1.5 rounded-xl px-2.5 py-2 transition-colors cursor-text"
				style={{
					background: "var(--surface-paper)",
					border: `1px solid ${error ? "#ef4444" : open ? "var(--color-primary)" : "var(--border-medium)"}`,
				}}
			>
				{value.map((item) => (
					<span
						key={item}
						className="inline-flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1 text-xs font-medium"
						style={{ background: "rgba(154,202,60,0.16)", color: "var(--color-primary)" }}
					>
						{item}
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								remove(item);
							}}
							aria-label={`Remove ${item}`}
							className="rounded-full p-0.5 transition-colors hover:bg-black/10"
						>
							<X className="h-3 w-3" />
						</button>
					</span>
				))}

				<input
					ref={inputRef}
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
					onKeyDown={onKeyDown}
					placeholder={value.length ? "" : placeholder}
					role="combobox"
					aria-expanded={open}
					aria-controls={listId}
					aria-autocomplete="list"
					className="min-w-[8rem] flex-1 bg-transparent py-1 text-sm outline-none"
					style={{ color: "var(--text-primary)" }}
				/>
			</div>

			{open && (
				<div
					id={listId}
					role="listbox"
					className="relative z-20 mt-1.5 max-h-56 overflow-y-auto rounded-xl py-1"
					style={{
						background: "var(--surface-paper)",
						border: "1px solid var(--border-light)",
						boxShadow: "var(--shadow-md)",
					}}
				>
					{matches.length === 0 ? (
						<p className="px-3 py-2.5 text-xs" style={{ color: "var(--text-hint)" }}>
							{allowCustom && query.trim() ? `Press Enter to add “${query.trim()}”` : emptyMessage}
						</p>
					) : (
						matches.map((option, i) => (
							<button
								key={option}
								type="button"
								role="option"
								aria-selected={i === activeIndex}
								onMouseEnter={() => setActiveIndex(i)}
								onClick={() => add(option)}
								className="block w-full px-3 py-2 text-left text-sm transition-colors"
								style={{
									background: i === activeIndex ? "var(--surface-low)" : "transparent",
									color: "var(--text-primary)",
								}}
							>
								{option}
							</button>
						))
					)}
				</div>
			)}

			{hint && !error && (
				<p className="mt-1.5 text-xs" style={{ color: "var(--text-hint)" }}>
					{hint}
				</p>
			)}
			{error && (
				<p className="mt-1.5 text-xs" style={{ color: "#ef4444" }}>
					{error}
				</p>
			)}
		</div>
	);
};

export default ChipAutocomplete;
