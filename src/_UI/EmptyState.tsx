"use client";

import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import Button from "./Button";

interface EmptyStateProps {
	icon?: LucideIcon;
	illustration?: React.ReactNode;
	title: string;
	description?: string;
	actionLabel?: string;
	actionHref?: string;
	onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
	icon: Icon,
	illustration,
	title,
	description,
	actionLabel,
	actionHref,
	onAction,
}) => {
	const actionButton = actionLabel ? (
		<Button variant="filled" onClick={onAction} className="mt-6">
			{actionLabel}
		</Button>
	) : null;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
			className="flex flex-col items-center justify-center py-16"
		>
			{illustration || (Icon && <Icon className="h-16 w-16 text-on-surface/30 dark:text-white/20" />)}
			<h3 className="text-xl font-semibold text-on-surface dark:text-white/90 mt-4">
				{title}
			</h3>
			{description && (
				<p className="text-on-surface-variant dark:text-white/50 mt-2 max-w-md text-center">
					{description}
				</p>
			)}
			{actionButton &&
				(actionHref ? (
					<Link href={actionHref}>{actionButton}</Link>
				) : (
					actionButton
				))}
		</motion.div>
	);
};

export default EmptyState;
