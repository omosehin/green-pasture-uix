"use client";

import React from "react";
import Image from "next/image";

interface PageLoaderProps {
	message?: string;
	fullScreen?: boolean;
}

/**
 * Premium loading indicator with the Green Pastures logo.
 * Use for page loads, API calls, and transitions.
 *
 * Usage:
 *   <PageLoader />                          — Full screen with default message
 *   <PageLoader message="Placing order..." /> — Custom message
 *   <PageLoader fullScreen={false} />        — Inline (no fixed positioning)
 */
const PageLoader: React.FC<PageLoaderProps> = ({
	message = "Loading...",
	fullScreen = true,
}) => {
	return (
		<div
			className={`${
				fullScreen
					? "fixed inset-0 z-[9999]"
					: "w-full py-20"
			} flex flex-col items-center justify-center`}
			style={{ background: fullScreen ? "var(--background)" : "transparent" }}
		>
			{/* Logo with pulse animation */}
			<div className="relative mb-6">
				{/* Outer ring */}
				<div
					className="absolute inset-0 rounded-full animate-ping"
					style={{
						background: "rgba(22, 163, 74, 0.1)",
						transform: "scale(1.8)",
						animationDuration: "1.5s",
					}}
				/>
				{/* Inner glow */}
				<div
					className="absolute inset-0 rounded-full"
					style={{
						background: "rgba(22, 163, 74, 0.08)",
						transform: "scale(1.4)",
						animation: "pulse-soft 2s ease-in-out infinite",
					}}
				/>
				{/* Logo container */}
				<div
					className="relative w-16 h-16 rounded-full flex items-center justify-center"
					style={{
						background: "var(--surface-paper)",
						boxShadow: "0 0 30px rgba(22, 163, 74, 0.15)",
						animation: "pulse-soft 2s ease-in-out infinite",
					}}
				>
					<Image
						src="/images/GP Organic Logo (Primary).png"
						alt="Loading"
						height={36}
						width={36}
						priority
						className="object-contain"
					/>
				</div>
			</div>

			{/* Animated dots */}
			<div className="flex items-center gap-1 mb-2">
				{[0, 1, 2].map((i) => (
					<div
						key={i}
						className="w-1.5 h-1.5 rounded-full"
						style={{
							background: "var(--color-primary)",
							animation: `bounce 1.2s ${i * 0.15}s ease-in-out infinite`,
						}}
					/>
				))}
			</div>

			{/* Message */}
			<p
				className="text-sm font-medium"
				style={{ color: "var(--text-hint)" }}
			>
				{message}
			</p>

			{/* Inline animation keyframes */}
			<style jsx>{`
				@keyframes bounce {
					0%, 80%, 100% {
						transform: scale(0.6);
						opacity: 0.4;
					}
					40% {
						transform: scale(1);
						opacity: 1;
					}
				}
				@keyframes pulse-soft {
					0%, 100% {
						opacity: 1;
						transform: scale(1);
					}
					50% {
						opacity: 0.8;
						transform: scale(1.05);
					}
				}
			`}</style>
		</div>
	);
};

export default PageLoader;
