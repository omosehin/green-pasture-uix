"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { shareOfTotal } from "@/_utils/periodCompare";

export interface PerformanceColumn<T> {
	key: string;
	header: string;
	/** Cell text. */
	value: (row: T) => React.ReactNode;
	/** Supply a number to draw the inline proportion bar for this column. */
	weight?: (row: T) => number;
	align?: "left" | "right";
}

interface PerformanceTableProps<T> {
	rows: T[];
	columns: PerformanceColumn<T>[];
	rowKey: (row: T) => string;
	emptyMessage?: string;
}

/**
 * Dense metric table where a numeric column can carry an inline bar showing its
 * share of that column's total — the "which rows actually carry the business"
 * read that a plain number grid doesn't give you.
 *
 * Bars are share-of-total, not share-of-max: a row at 40% means it accounts for
 * 40% of the column, which is the comparison that means something for revenue
 * and units.
 */
export function PerformanceTable<T>({ rows, columns, rowKey, emptyMessage = "No data yet." }: PerformanceTableProps<T>) {
	// Precompute each weighted column's shares once per render.
	const shares = new Map<string, number[]>();
	for (const column of columns) {
		if (column.weight) shares.set(column.key, shareOfTotal(rows.map(column.weight)));
	}

	if (rows.length === 0) {
		return <p className="text-muted-foreground py-8 text-center text-sm">{emptyMessage}</p>;
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full min-w-[36rem] border-collapse text-sm">
				<thead>
					<tr className="border-border border-b">
						{columns.map((column) => (
							<th
								key={column.key}
								scope="col"
								className={cn(
									"text-muted-foreground px-3 py-2 text-xs font-medium",
									column.align === "right" ? "text-right" : "text-left",
								)}
							>
								{column.header}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, index) => (
						<tr key={rowKey(row)} className="border-border/60 hover:bg-muted/40 border-b transition-colors last:border-0">
							{columns.map((column) => {
								const share = shares.get(column.key)?.[index];
								return (
									<td key={column.key} className={cn("px-3 py-2.5", column.align === "right" ? "text-right" : "text-left")}>
										<div className={cn("flex items-center gap-2", column.align === "right" && "justify-end")}>
											<span className="tabular-nums">{column.value(row)}</span>
											{share !== undefined && (
												<span className="bg-muted h-1.5 w-16 shrink-0 overflow-hidden rounded-full" title={`${share.toFixed(1)}% of total`}>
													<span className="bg-primary block h-full rounded-full" style={{ width: `${Math.min(100, share)}%` }} />
												</span>
											)}
										</div>
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export default PerformanceTable;
