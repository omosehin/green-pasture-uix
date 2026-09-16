"use client";

import React from "react";

// ── Detail Row (label-value pair) ──

interface DetailRowProps {
	label: string;
	value?: React.ReactNode;
	className?: string;
}

export const DetailRow: React.FC<DetailRowProps> = ({
	label,
	value,
	className = "",
}) => {
	return (
		<div
			className={`flex items-baseline py-3 px-5 last:border-b-0 ${className}`}
			style={{ borderBottom: "1px solid var(--border-light)" }}
		>
			<span
				className="w-[180px] shrink-0 text-xs font-medium"
				style={{ color: "var(--text-hint)" }}
			>
				{label}
			</span>
			<span
				className="flex-1 text-sm"
				style={{ color: "var(--text-primary)" }}
			>
				{value ?? (
					<span style={{ color: "var(--text-disabled)" }}>—</span>
				)}
			</span>
		</div>
	);
};

// ── Detail Section (grouped container) ──

interface DetailSectionProps {
	title: string;
	children: React.ReactNode;
	action?: React.ReactNode;
	className?: string;
}

export const DetailSection: React.FC<DetailSectionProps> = ({
	title,
	children,
	action,
	className = "",
}) => {
	return (
		<div
			className={`rounded-xl overflow-hidden transition-all duration-300 ${className}`}
			style={{
				background: "var(--surface-paper)",
				border: "1px solid var(--border-light)",
				boxShadow: "var(--shadow-sm)",
			}}
		>
			<div
				className="flex items-center justify-between px-5 py-4"
				style={{ borderBottom: "1px solid var(--border-light)" }}
			>
				<h3
					className="text-sm font-semibold"
					style={{ color: "var(--text-primary)" }}
				>
					{title}
				</h3>
				{action}
			</div>
			<div>{children}</div>
		</div>
	);
};

// ── Detail Header Card ──

interface DetailHeaderProps {
	title: string;
	subtitle?: string;
	status?: React.ReactNode;
	metrics?: { label: string; value: string | number }[];
	children?: React.ReactNode;
}

export const DetailHeader: React.FC<DetailHeaderProps> = ({
	title,
	subtitle,
	status,
	metrics,
	children,
}) => {
	return (
		<div
			className="rounded-xl overflow-hidden animate-card-enter"
			style={{
				background: "var(--surface-paper)",
				border: "1px solid var(--border-light)",
				boxShadow: "var(--shadow-sm)",
			}}
		>
			<div className="px-5 py-5">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h1
							className="text-xl font-bold"
							style={{ color: "var(--text-primary)" }}
						>
							{title}
						</h1>
						{subtitle && (
							<p
								className="text-sm mt-1"
								style={{ color: "var(--text-hint)" }}
							>
								{subtitle}
							</p>
						)}
					</div>
					{status}
				</div>

				{metrics && metrics.length > 0 && (
					<div
						className="flex flex-wrap gap-6 mt-4 pt-4"
						style={{
							borderTop: "1px solid var(--border-light)",
						}}
					>
						{metrics.map((m) => (
							<div key={m.label}>
								<span
									className="block text-[0.6rem] uppercase font-semibold tracking-wider mb-0.5"
									style={{ color: "var(--text-hint)" }}
								>
									{m.label}
								</span>
								<span
									className="text-lg font-bold tabular-nums"
									style={{
										color: "var(--text-primary)",
									}}
								>
									{m.value}
								</span>
							</div>
						))}
					</div>
				)}

				{children}
			</div>
		</div>
	);
};

// ── Back Button ──

interface BackButtonProps {
	onClick?: () => void;
	label?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
	onClick,
	label = "Back",
}) => {
	return (
		<button
			onClick={onClick || (() => window.history.back())}
			className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors cursor-pointer press-effect"
			style={{ color: "var(--text-secondary)" }}
			onMouseEnter={(e) => {
				e.currentTarget.style.color = "var(--text-primary)";
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.color = "var(--text-secondary)";
			}}
		>
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<polyline points="15 18 9 12 15 6" />
			</svg>
			{label}
		</button>
	);
};
