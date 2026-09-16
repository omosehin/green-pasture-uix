import React from "react";

export const CartItemSkeleton: React.FC = () => (
	<div className="p-4 md:p-6 border-b border-gray-200 animate-pulse bg-white dark:bg-white/[0.04]">
		<div className="grid grid-cols-2 md:flex md:items-center space-x-4">
			<div className="w-20 h-20 bg-gray-200 dark:bg-white/10 rounded-md"></div>
			<div className="flex-1">
				<div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-3/4 mb-2"></div>
				<div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-1/2"></div>
			</div>
			<div className="flex items-center space-x-3">
				<div className="w-8 h-8 bg-gray-200 dark:bg-white/10 rounded-full"></div>
				<div className="w-8 h-6 bg-gray-200 dark:bg-white/10 rounded"></div>
				<div className="w-8 h-8 bg-gray-200 dark:bg-white/10 rounded-full"></div>
			</div>
			<div className="md:text-right">
				<div className="h-6 bg-gray-200 dark:bg-white/10 rounded w-20 mb-1"></div>
				<div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-16"></div>
			</div>
		</div>
	</div>
);
