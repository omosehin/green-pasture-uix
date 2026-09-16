"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface RangeOption<T extends string> {
	value: T;
	label: string;
}

interface RangeToggleProps<T extends string> {
	options: RangeOption<T>[];
	value: T;
	onChange: (value: T) => void;
	"aria-label"?: string;
}

/** Segmented control for chart period selection (7D / 30D / 12M, M / W / D). */
export function RangeToggle<T extends string>({ options, value, onChange, ...rest }: RangeToggleProps<T>) {
	return (
		<div role="group" aria-label={rest["aria-label"] ?? "Select period"} className="bg-muted inline-flex items-center gap-0.5 rounded-lg p-0.5">
			{options.map((option) => {
				const active = option.value === value;
				return (
					<button
						key={option.value}
						type="button"
						aria-pressed={active}
						onClick={() => onChange(option.value)}
						className={cn(
							"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
							active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
						)}
					>
						{option.label}
					</button>
				);
			})}
		</div>
	);
}

export default RangeToggle;
