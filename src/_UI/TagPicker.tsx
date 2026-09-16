"use client";

import React, { useEffect } from "react";
import { Check, Tag as TagIcon } from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/_redux/store";
import { tagAction } from "@/_redux/actions/tag.action";
import { htmlToText } from "@/_utils/htmlToText";

interface TagPickerProps {
	/** Selected tag ids. */
	value: string[];
	onChange: (ids: string[]) => void;
	label?: string;
	hint?: string;
}

/**
 * Assigns the "who is this for" tags to a product.
 *
 * Chips rather than a multi-select listbox: the set is small and the whole
 * point is seeing at a glance that Super Pap Mix is both Children and Adults.
 */
const TagPicker: React.FC<TagPickerProps> = ({
	value,
	onChange,
	label = "Tags",
	hint = "Who is this product for? A product can carry several.",
}) => {
	const dispatch = useAppDispatch();
	const { tags, isFetchingTags } = useAppSelector((state) => state.tag);

	useEffect(() => {
		if (!tags.length) dispatch(tagAction.fetchTags());
	}, [dispatch, tags.length]);

	const toggle = (id: string) => {
		onChange(value.includes(id) ? value.filter((t) => t !== id) : [...value, id]);
	};

	return (
		<div>
			<label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
				{label}
			</label>
			{hint && (
				<p className="mb-2.5 text-xs" style={{ color: "var(--text-hint)" }}>
					{hint}
				</p>
			)}

			{isFetchingTags && !tags.length ? (
				<div className="flex flex-wrap gap-2">
					{[...Array(5)].map((_, i) => (
						<div key={i} className="h-8 w-24 animate-pulse rounded-full" style={{ background: "var(--surface-medium)" }} />
					))}
				</div>
			) : !tags.length ? (
				<p className="text-xs" style={{ color: "var(--text-hint)" }}>
					No tags yet — create them under Tags in the admin menu.
				</p>
			) : (
				<div className="flex flex-wrap gap-2">
					{tags.map((tag) => {
						const selected = value.includes(tag.id);
						return (
							<button
								key={tag.id}
								type="button"
								onClick={() => toggle(tag.id)}
								aria-pressed={selected}
								title={htmlToText(tag.description)}
								data-testid={`tag-${tag.slug}`}
								className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
								style={{
									background: selected ? "rgba(154,202,60,0.16)" : "var(--surface-medium)",
									color: selected ? "var(--color-primary)" : "var(--text-secondary)",
									border: `1px solid ${selected ? "var(--color-primary)" : "transparent"}`,
								}}
							>
								{selected ? <Check className="h-3.5 w-3.5" /> : <TagIcon className="h-3.5 w-3.5" />}
								{tag.name}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default TagPicker;
