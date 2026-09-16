"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
	label: string;
	href?: string;
}

interface BreadcrumbProps {
	items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
	return (
		<nav aria-label="Breadcrumb">
			<ol className="flex items-center gap-1.5">
				{items.map((item, index) => {
					const isLast = index === items.length - 1;

					return (
						<li
							key={index}
							className="flex items-center gap-1.5"
						>
							{index > 0 && (
								<ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
							)}
							{item.href && !isLast ? (
								<Link
									href={item.href}
									className="text-on-surface-variant dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors"
								>
									{item.label}
								</Link>
							) : (
								<span className="text-on-surface dark:text-white font-medium text-sm">
									{item.label}
								</span>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
};

export default Breadcrumb;
