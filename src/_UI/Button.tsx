"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2, LucideIcon } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "filled" | "outlined" | "tonal" | "text";
	size?: "sm" | "md" | "lg";
	color?: "primary" | "error" | "secondary";
	loading?: boolean;
	leftIcon?: LucideIcon;
	rightIcon?: LucideIcon;
	fullWidth?: boolean;
}

const variantStyles: Record<string, Record<string, string>> = {
	primary: {
		filled:
			"bg-primary-600 text-white shadow-elevation-1 hover:bg-gradient-to-r hover:from-primary-700 hover:via-primary-600 hover:to-lime-600 hover:shadow-[0_0_18px_rgba(154,202,60,0.5)] dark:hover:to-lime-700 dark:hover:shadow-[0_0_12px_rgba(154,202,60,0.25)] active:bg-primary-800 active:bg-none active:shadow-elevation-1",
		outlined:
			"border border-outline text-primary-600 hover:bg-primary-50 dark:border-white/15 dark:text-primary-400 dark:hover:bg-white/5",
		tonal:
			"bg-primary-100 text-primary-800 hover:bg-primary-200 dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/15",
		text: "text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-white/5",
	},
	error: {
		filled:
			"bg-error-600 text-white hover:bg-error-700 active:bg-red-800 shadow-elevation-1 hover:shadow-elevation-2",
		outlined:
			"border border-outline text-error-600 hover:bg-error-50 dark:border-white/15 dark:text-red-400 dark:hover:bg-white/5",
		tonal:
			"bg-error-100 text-red-800 hover:bg-red-200 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/15",
		text: "text-error-600 hover:bg-error-50 dark:text-red-400 dark:hover:bg-white/5",
	},
	secondary: {
		filled:
			"bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800 shadow-elevation-1 hover:shadow-elevation-2",
		outlined:
			"border border-outline text-gray-600 hover:bg-gray-50 dark:border-white/15 dark:text-white/60 dark:hover:bg-white/5",
		tonal:
			"bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10",
		text: "text-gray-600 hover:bg-gray-50 dark:text-white/60 dark:hover:bg-white/5",
	},
};

const sizeStyles: Record<string, string> = {
	sm: "px-3 py-1.5 text-sm",
	md: "px-5 py-2.5 text-sm",
	lg: "px-6 py-3 text-base",
};

const iconSizes: Record<string, number> = {
	sm: 14,
	md: 16,
	lg: 18,
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			variant = "filled",
			size = "md",
			color = "primary",
			loading = false,
			leftIcon: LeftIcon,
			rightIcon: RightIcon,
			fullWidth = false,
			disabled,
			className = "",
			children,
			...props
		},
		ref,
	) => {
		const baseStyles =
			"rounded-radius-md font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 inline-flex items-center justify-center gap-2";

		const isDisabled = disabled || loading;
		const iconSize = iconSizes[size];

		return (
			<button
				ref={ref}
				disabled={isDisabled}
				className={[
					baseStyles,
					variantStyles[color][variant],
					sizeStyles[size],
					fullWidth ? "w-full" : "",
					isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:scale-[1.02] active:scale-[0.97]",
					loading ? "pointer-events-none opacity-80" : "",
					className,
				]
					.filter(Boolean)
					.join(" ")}
				{...props}
			>
				{loading ? (
					<Loader2 size={iconSize} className="animate-spin" />
				) : LeftIcon ? (
					<LeftIcon size={iconSize} />
				) : null}
				{children}
				{!loading && RightIcon && <RightIcon size={iconSize} />}
			</button>
		);
	},
);

Button.displayName = "Button";

export default Button;
