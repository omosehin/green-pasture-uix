"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	subtitle?: string;
	children: React.ReactNode;
	size?: "sm" | "md" | "lg" | "xl";
}

const sizeStyles: Record<string, string> = {
	sm: "sm:w-[24rem]",
	md: "sm:w-[28rem]",
	lg: "sm:w-[36rem]",
	xl: "sm:w-[48rem]",
};

const Modal: React.FC<ModalProps> = ({
	isOpen,
	onClose,
	title,
	subtitle,
	children,
	size = "md",
}) => {
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	useEffect(() => {
		if (!isOpen) return;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	// Focus returns to whatever opened the modal — otherwise keyboard users are
	// stranded at the top of the document on close. Keyed on `isOpen` alone and
	// held in a ref: if this depended on `onClose`, a caller passing an inline
	// arrow would re-run the effect on every render and the cleanup would yank
	// focus out of the modal while it is still open.
	const openerRef = useRef<HTMLElement | null>(null);
	useEffect(() => {
		if (!isOpen) return;
		openerRef.current = document.activeElement as HTMLElement | null;
		return () => openerRef.current?.focus?.();
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [isOpen, onClose]);

	if (!isOpen || !isClient) return null;

	return createPortal(
		<div
			role="dialog"
			aria-modal="true"
			className="fixed inset-0 z-[6001] flex items-center justify-center pt-10 pb-10 animate-modal-backdrop"
			style={{ background: "rgba(0, 0, 0, 0.5)" }}
		>
			{/* Overlay */}
			<div
				className="absolute inset-0"
				aria-hidden="true"
				onClick={onClose}
			/>

			{/* Panel */}
			<div
				className={`relative max-h-[85vh] w-[92vw] ${sizeStyles[size]} overflow-hidden rounded-xl shadow-xl animate-modal-content flex flex-col`}
				onClick={(e) => e.stopPropagation()}
				style={{
					background: "var(--surface-paper)",
					border: "1px solid var(--border-light)",
				}}
			>
				{/* Header */}
				{title && (
					<div
						className="flex items-start justify-between px-6 py-4 shrink-0"
						style={{
							borderBottom: "1px solid var(--border-light)",
						}}
					>
						<div>
							<h2
								className="text-lg font-semibold"
								style={{ color: "var(--text-primary)" }}
							>
								{title}
							</h2>
							{subtitle && (
								<p
									className="text-xs mt-0.5"
									style={{ color: "var(--text-hint)" }}
								>
									{subtitle}
								</p>
							)}
						</div>
						<button
							onClick={onClose}
							className="shrink-0 p-1 rounded-md transition-colors cursor-pointer"
							style={{ color: "var(--text-disabled)" }}
							onMouseEnter={(e) => {
								e.currentTarget.style.color =
									"var(--text-secondary)";
								e.currentTarget.style.background =
									"var(--surface-medium)";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.color =
									"var(--text-disabled)";
								e.currentTarget.style.background =
									"transparent";
							}}
							aria-label="Close"
						>
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
							>
								<path d="M18 6L6 18M6 6l12 12" />
							</svg>
						</button>
					</div>
				)}

				{/* Close button when no title */}
				{!title && (
					<div className="absolute top-3 right-3 z-10">
						<button
							onClick={onClose}
							className="p-1 rounded-md transition-colors cursor-pointer"
							style={{ color: "var(--text-disabled)" }}
							onMouseEnter={(e) => {
								e.currentTarget.style.color =
									"var(--text-secondary)";
								e.currentTarget.style.background =
									"var(--surface-medium)";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.color =
									"var(--text-disabled)";
								e.currentTarget.style.background =
									"transparent";
							}}
							aria-label="Close"
						>
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
							>
								<path d="M18 6L6 18M6 6l12 12" />
							</svg>
						</button>
					</div>
				)}

				{/* Body */}
				<div className="px-6 py-5 overflow-y-auto">{children}</div>
			</div>
		</div>,
		document.body
	);
};

export default Modal;
