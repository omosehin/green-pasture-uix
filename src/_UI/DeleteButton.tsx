"use client";

import React, { useState } from "react";
import { Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DeleteButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	label?: string;
	onDelete?: () => Promise<void> | void;
	size?: "sm" | "md" | "lg";
	variant?: "danger" | "ghost";
	isLoading?: boolean;
}

export function DeleteButton({
	label = "DELETE",
	onDelete,
	size = "md",
	variant = "danger",
	isLoading = false,
	className,
	disabled,
	onClick,
	...props
}: DeleteButtonProps) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [isDone, setIsDone] = useState(false);

	const letters = (label || "DELETE").split("");

	const sizeClasses = {
		sm: "h-8 px-3.5 text-xs gap-1.5",
		md: "h-10 px-4 text-sm gap-2",
		lg: "h-12 px-6 text-base gap-2.5",
	};

	const iconSizes = {
		sm: 14,
		md: 16,
		lg: 18,
	};

	const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
		if (isDeleting || isDone || disabled || isLoading) return;

		onClick?.(e);
		setIsDeleting(true);

		const animationDuration = Math.max(800, letters.length * 65 + 450);

		setTimeout(async () => {
			if (onDelete) {
				try {
					await onDelete();
				} catch (err) {
					setIsDeleting(false);
					return;
				}
			}
			setIsDeleting(false);
			setIsDone(true);

			setTimeout(() => {
				setIsDone(false);
			}, 2000);
		}, animationDuration);
	};

	const variantStyles = {
		danger: isDone
			? "bg-emerald-600 text-white border-transparent"
			: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm hover:shadow-[0_4px_16px_rgba(220,38,38,0.35)]",
		ghost: isDone
			? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20"
			: "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20",
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={disabled || isLoading || isDeleting}
			aria-label={label}
			className={cn(
				"relative inline-flex items-center justify-center font-semibold rounded-xl select-none transition-all duration-200 cursor-pointer overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600",
				sizeClasses[size],
				variantStyles[variant],
				isDeleting && "pointer-events-none active:scale-100",
				!isDeleting && "active:scale-[0.97]",
				disabled && "opacity-50 pointer-events-none cursor-not-allowed",
				className,
			)}
			{...props}
		>
			{/* Trash Bin with Animated Lid */}
			<div
				className={cn(
					"relative flex items-center justify-center transition-transform duration-300",
					isDeleting && "animate-bin-shake scale-110",
				)}
			>
				<Trash2 size={iconSizes[size]} className="shrink-0" />
				<div
					className={cn(
						"absolute -top-1 left-0 w-full h-[2px] bg-white/60 rounded-full origin-left transition-transform duration-300",
						isDeleting && "animate-lid-cycle",
					)}
				/>
			</div>

			{/* Staggered Falling Letters */}
			{!isDone && (
				<div className="relative flex overflow-hidden tracking-wider font-mono">
					{letters.map((letter, i) => (
						<span
							key={i}
							className={cn(
								"inline-block transition-all",
								isDeleting && "animate-letter-fall",
							)}
							style={{
								animationDelay: isDeleting ? `${i * 65}ms` : "0ms",
							}}
						>
							{letter === " " ? "\u00A0" : letter}
						</span>
					))}
				</div>
			)}

			{/* Success "Deleted!" state */}
			{isDone && (
				<span className="inline-flex items-center gap-1.5 animate-fade-in font-medium">
					<Check size={iconSizes[size]} />
					<span>Deleted!</span>
				</span>
			)}

			{/* Ring Seal Ripple */}
			{isDeleting && (
				<div className="absolute inset-0 rounded-xl border border-red-400 pointer-events-none animate-ring-seal" />
			)}
		</button>
	);
}

export default DeleteButton;
