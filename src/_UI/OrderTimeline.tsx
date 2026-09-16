"use client";

import React from "react";

interface OrderTimelineProps {
	status: string;
	createdAt: string;
	shippingDate?: string;
	deliveredDate?: string;
}

interface Step {
	label: string;
	key: string;
	date?: string;
}

const STATUS_ORDER = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

function getActiveIndex(status: string): number {
	const upper = status?.toUpperCase() ?? "";
	const idx = STATUS_ORDER.indexOf(upper);
	return idx >= 0 ? idx : 0;
}

const CheckIcon = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
		<polyline points="20 6 9 17 4 12" />
	</svg>
);

const XIcon = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
		<line x1="18" y1="6" x2="6" y2="18" />
		<line x1="6" y1="6" x2="18" y2="18" />
	</svg>
);

function formatDate(dateStr?: string): string {
	if (!dateStr) return "";
	try {
		return new Date(dateStr).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	} catch {
		return "";
	}
}

const OrderTimeline: React.FC<OrderTimelineProps> = ({ status, createdAt, shippingDate, deliveredDate }) => {
	const isCancelled = status?.toUpperCase() === "CANCELLED";
	const isRefunded = status?.toUpperCase() === "REFUNDED";
	const activeIndex = isCancelled || isRefunded ? -1 : getActiveIndex(status);

	const steps: Step[] = [
		{ label: "Order Placed", key: "PENDING", date: createdAt },
		{ label: "Processing", key: "PROCESSING", date: undefined },
		{ label: "Shipped", key: "SHIPPED", date: shippingDate },
		{ label: "Delivered", key: "DELIVERED", date: deliveredDate },
	];

	return (
		<div
			className="rounded-xl overflow-hidden"
			style={{
				background: "var(--surface-paper)",
				border: "1px solid var(--border-light)",
				boxShadow: "var(--shadow-sm)",
			}}
		>
			<div
				className="px-5 py-4"
				style={{ borderBottom: "1px solid var(--border-light)" }}
			>
				<h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
					Order Timeline
				</h3>
			</div>

			<div className="px-5 py-6">
				{isCancelled || isRefunded ? (
					<div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: "rgba(239, 68, 68, 0.08)" }}>
						<div
							className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
							style={{ background: "var(--color-error, #ef4444)", color: "#fff" }}
						>
							<XIcon />
						</div>
						<div>
							<p className="text-sm font-semibold" style={{ color: "var(--color-error, #ef4444)" }}>
								Order {isCancelled ? "Cancelled" : "Refunded"}
							</p>
							<p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>
								{formatDate(createdAt)}
							</p>
						</div>
					</div>
				) : (
					<div className="flex items-start justify-between gap-2">
						{steps.map((step, i) => {
							const isCompleted = i < activeIndex;
							const isActive = i === activeIndex;
							const isFuture = i > activeIndex;

							return (
								<React.Fragment key={step.key}>
									<div className="flex flex-col items-center text-center" style={{ minWidth: 70 }}>
										{/* Circle */}
										<div
											className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
											style={{
												background: isCompleted
													? "var(--color-primary, #16a34a)"
													: isActive
														? "transparent"
														: "var(--surface-medium, #e5e7eb)",
												border: isActive
													? "2px solid var(--color-primary, #16a34a)"
													: "none",
												color: isCompleted
													? "#fff"
													: isActive
														? "var(--color-primary, #16a34a)"
														: "var(--text-disabled, #9ca3af)",
												...(isActive
													? { animation: "timeline-pulse 2s ease-in-out infinite" }
													: {}),
											}}
										>
											{isCompleted ? (
												<CheckIcon />
											) : (
												<div
													className="w-2.5 h-2.5 rounded-full"
													style={{
														background: isActive
															? "var(--color-primary, #16a34a)"
															: "var(--text-disabled, #9ca3af)",
													}}
												/>
											)}
										</div>

										{/* Label */}
										<p
											className="text-xs font-medium mt-2"
											style={{
												color: isCompleted || isActive
													? "var(--text-primary)"
													: "var(--text-disabled)",
											}}
										>
											{step.label}
										</p>

										{/* Date */}
										{step.date && (isCompleted || isActive) && (
											<p className="text-[0.6rem] mt-0.5" style={{ color: "var(--text-hint)" }}>
												{formatDate(step.date)}
											</p>
										)}
									</div>

									{/* Connector line */}
									{i < steps.length - 1 && (
										<div
											className="flex-1 h-0.5 mt-4 rounded-full transition-all duration-300"
											style={{
												background: i < activeIndex
													? "var(--color-primary, #16a34a)"
													: "var(--surface-medium, #e5e7eb)",
											}}
										/>
									)}
								</React.Fragment>
							);
						})}
					</div>
				)}
			</div>

			<style jsx>{`
				@keyframes timeline-pulse {
					0%, 100% {
						box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.3);
					}
					50% {
						box-shadow: 0 0 0 8px rgba(22, 163, 74, 0);
					}
				}
			`}</style>
		</div>
	);
};

export default OrderTimeline;
