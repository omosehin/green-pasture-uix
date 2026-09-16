"use client";

import React from "react";

interface CardProps {
	elevation?: 0 | 1 | 2 | 3 | 4;
	hoverable?: boolean;
	padding?: "none" | "sm" | "md" | "lg";
	className?: string;
	children: React.ReactNode;
}

const elevationStyles: Record<number, string> = {
	0: "shadow-elevation-0",
	1: "shadow-elevation-1",
	2: "shadow-elevation-2",
	3: "shadow-elevation-3",
	4: "shadow-elevation-4",
};

const paddingStyles: Record<string, string> = {
	none: "",
	sm: "p-4",
	md: "p-6",
	lg: "p-8",
};

const Card: React.FC<CardProps> = ({
	elevation = 1,
	hoverable = false,
	padding = "md",
	className = "",
	children,
}) => {
	return (
		<div
			className={[
				"bg-white dark:bg-white/[0.04] rounded-xl border border-[rgba(16,54,48,0.08)] dark:border-white/8 transition-all duration-300",
				elevationStyles[elevation],
				paddingStyles[padding],
				hoverable
					? "hover:shadow-elevation-2 cursor-pointer"
					: "",
				className,
			]
				.filter(Boolean)
				.join(" ")}
		>
			{children}
		</div>
	);
};

export default Card;
