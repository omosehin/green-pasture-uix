"use client";

import React from "react";

interface BadgeProps {
	variant?: "success" | "warning" | "error" | "info" | "neutral";
	size?: "sm" | "md";
	dot?: boolean;
	children: React.ReactNode;
	className?: string;
}

const variantStyles: Record<string, { badge: string; dot: string }> = {
	success: {
		badge: "bg-green-100 text-green-800 dark:bg-emerald-500/10 dark:text-emerald-400",
		dot: "bg-green-600 dark:bg-emerald-400",
	},
	warning: {
		badge: "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400",
		dot: "bg-amber-600 dark:bg-amber-400",
	},
	error: {
		badge: "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400",
		dot: "bg-red-600 dark:bg-red-400",
	},
	info: {
		badge: "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400",
		dot: "bg-blue-600 dark:bg-blue-400",
	},
	neutral: {
		badge: "bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-white/60",
		dot: "bg-gray-600 dark:bg-white/40",
	},
};

const sizeStyles: Record<string, string> = {
	sm: "px-2 py-0.5 text-xs",
	md: "px-2.5 py-1 text-xs",
};

const Badge: React.FC<BadgeProps> = ({
	variant = "neutral",
	size = "md",
	dot = false,
	children,
	className = "",
}) => {
	const styles = variantStyles[variant];

	return (
		<span
			className={[
				"rounded-full font-medium inline-flex items-center",
				styles.badge,
				sizeStyles[size],
				className,
			]
				.filter(Boolean)
				.join(" ")}
		>
			{dot && (
				<span
					className={`w-1.5 h-1.5 rounded-full mr-1.5 ${styles.dot}`}
				/>
			)}
			{children}
		</span>
	);
};

export default Badge;
