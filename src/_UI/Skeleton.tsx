"use client";

import React from "react";

interface SkeletonBoxProps {
	width?: string;
	height?: string;
	className?: string;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
	width,
	height,
	className = "",
}) => {
	return (
		<div
			className={`rounded-radius-sm bg-gray-200 dark:bg-gray-700 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 ${className}`}
			style={{ width, height }}
		/>
	);
};

interface SkeletonTextProps {
	count?: number;
	className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
	count = 3,
	className = "",
}) => {
	return (
		<div className={className}>
			{Array.from({ length: count }).map((_, i) => (
				<div
					key={i}
					className={`h-4 rounded-radius-sm mb-2 bg-gray-200 dark:bg-gray-700 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700`}
					style={{
						width:
							i === count - 1
								? `${50 + Math.random() * 20}%`
								: `${80 + Math.random() * 20}%`,
					}}
				/>
			))}
		</div>
	);
};

interface SkeletonCircleProps {
	size?: number;
	className?: string;
}

export const SkeletonCircle: React.FC<SkeletonCircleProps> = ({
	size = 40,
	className = "",
}) => {
	return (
		<div
			className={`rounded-full bg-gray-200 dark:bg-gray-700 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 ${className}`}
			style={{ width: size, height: size }}
		/>
	);
};

interface SkeletonCardProps {
	className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
	className = "",
}) => {
	return (
		<div
			className={`bg-white dark:bg-white/[0.04] rounded-radius-md border border-outline-variant dark:border-white/8 overflow-hidden ${className}`}
		>
			<div className="aspect-video bg-gray-200 dark:bg-gray-700 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" />
			<div className="p-4">
				<SkeletonText count={3} />
				<div className="mt-4">
					<SkeletonBox height="36px" width="120px" />
				</div>
			</div>
		</div>
	);
};
