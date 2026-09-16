"use client";

import React, { useRef } from "react";
import { motion, useInView, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export interface TimelineItem {
	/** Short marker — a year, step number, or stage name. */
	label: string;
	title: string;
	description: string;
	icon?: LucideIcon;
	/** Optional highlight pulled out beneath the copy. */
	meta?: string;
}

interface TimelineProps {
	items: TimelineItem[];
	/** "alternating" staggers left/right on desktop; "stacked" keeps one column. */
	variant?: "alternating" | "stacked";
	className?: string;
}

/**
 * Scroll-driven timeline.
 *
 * The spine fills in proportion to scroll progress through the list, and each
 * node latches open when it enters view. Progress is a single spring-smoothed
 * scaleY on one element rather than per-node scroll listeners, so adding
 * entries costs nothing.
 */
const Timeline: React.FC<TimelineProps> = ({ items, variant = "alternating", className = "" }) => {
	const reduced = !!useReducedMotion();
	const containerRef = useRef<HTMLDivElement>(null);

	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ["start 65%", "end 55%"],
	});
	const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 26, restDelta: 0.001 });
	const scaleY = useTransform(progress, (v) => (reduced ? 1 : v));

	const alternating = variant === "alternating";

	return (
		<div ref={containerRef} className={`relative ${className}`}>
			{/* Spine — rail plus the growing fill */}
			<div
				aria-hidden
				className={`absolute top-2 bottom-2 w-px ${alternating ? "left-5 md:left-1/2 md:-translate-x-1/2" : "left-5"}`}
				style={{ background: "var(--border-light)" }}
			/>
			<motion.div
				aria-hidden
				className={`absolute top-2 bottom-2 w-px origin-top ${
					alternating ? "left-5 md:left-1/2 md:-translate-x-1/2" : "left-5"
				}`}
				style={{
					scaleY,
					background: "linear-gradient(to bottom,var(--color-primary),#9aca3c)",
					boxShadow: "0 0 14px rgba(154,202,60,0.45)",
				}}
			/>

			<ol className="relative space-y-12 md:space-y-16">
				{items.map((item, i) => (
					<TimelineNode key={`${item.label}-${i}`} item={item} index={i} alternating={alternating} reduced={reduced} />
				))}
			</ol>
		</div>
	);
};

const TimelineNode: React.FC<{
	item: TimelineItem;
	index: number;
	alternating: boolean;
	reduced: boolean;
}> = ({ item, index, alternating, reduced }) => {
	const ref = useRef<HTMLLIElement>(null);
	const inView = useInView(ref, { once: true, margin: "0px 0px -18% 0px" });
	const Icon = item.icon;
	const isRight = alternating && index % 2 === 1;

	const t = (d: number) => (reduced ? 0 : d);

	return (
		<li ref={ref} className="relative">
			<div
				className={`grid gap-x-8 ${
					alternating ? "grid-cols-[2.5rem_1fr] md:grid-cols-2 md:gap-x-16" : "grid-cols-[2.5rem_1fr]"
				}`}
			>
				{/* Node marker */}
				<motion.span
					aria-hidden
					initial={{ scale: 0, opacity: 0 }}
					animate={inView ? { scale: 1, opacity: 1 } : {}}
					transition={{ duration: t(0.45), ease: [0.22, 1, 0.36, 1] }}
					className={`absolute z-10 flex h-10 w-10 items-center justify-center rounded-full ${
						alternating ? "left-0 md:left-1/2 md:-translate-x-1/2" : "left-0"
					}`}
					style={{
						background: "var(--surface-paper)",
						border: "2px solid var(--color-primary)",
						boxShadow: inView ? "0 0 0 6px rgba(154,202,60,0.12)" : "none",
						transition: "box-shadow 0.6s ease",
					}}
				>
					{Icon ? (
						<Icon className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
					) : (
						<span className="h-2 w-2 rounded-full" style={{ background: "var(--color-primary)" }} />
					)}
				</motion.span>

				{/* Copy — right column on mobile, alternating sides from md up */}
				<motion.div
					initial={{ opacity: 0, y: reduced ? 0 : 24, x: reduced ? 0 : alternating ? (isRight ? 24 : -24) : 0 }}
					animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
					transition={{ duration: t(0.6), delay: t(0.1), ease: [0.22, 1, 0.36, 1] }}
					className={
						alternating
							? isRight
								? "col-start-2 md:col-start-2 md:pl-4"
								: "col-start-2 md:col-start-1 md:row-start-1 md:pr-4 md:text-right"
							: "col-start-2"
					}
				>
					<span
						className="mb-2 inline-block font-display text-xs uppercase tracking-[0.2em]"
						style={{ color: "#7fac2d", fontWeight: 600 }}
					>
						{item.label}
					</span>
					<h3
						className="font-display text-xl leading-snug sm:text-2xl"
						style={{ color: "var(--text-primary)", fontWeight: 500 }}
					>
						{item.title}
					</h3>
					<p className="mt-2.5 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
						{item.description}
					</p>
					{item.meta && (
						<p
							className="mt-3 inline-block rounded-full px-3 py-1 text-[0.68rem] font-medium"
							style={{ background: "rgba(154,202,60,0.12)", color: "#608123" }}
						>
							{item.meta}
						</p>
					)}
				</motion.div>
			</div>
		</li>
	);
};

export default Timeline;
