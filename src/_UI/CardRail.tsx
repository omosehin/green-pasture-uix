"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CardRailProps {
	children: React.ReactNode;
	/** Accessible name for the scroll region. */
	label?: string;
}

/**
 * One horizontal row that scrolls rather than wrapping.
 *
 * Native overflow scrolling does the work — swipe on touch, trackpad on
 * desktop, arrows for mouse-only users. No carousel library and no autoplay:
 * the row is a shelf you browse, not a slideshow that moves on its own.
 *
 * Arrows appear only when there is actually somewhere to scroll, so a short
 * row shows none and does not pretend to have more behind it.
 */
const CardRail: React.FC<CardRailProps> = ({ children, label }) => {
	const ref = useRef<HTMLDivElement>(null);
	const [atStart, setAtStart] = useState(true);
	const [atEnd, setAtEnd] = useState(true);

	const sync = useCallback(() => {
		const el = ref.current;
		if (!el) return;
		// 1px of slack: sub-pixel widths make an exact comparison flicker.
		setAtStart(el.scrollLeft <= 1);
		setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
	}, []);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		sync();
		el.addEventListener("scroll", sync, { passive: true });
		// Content arrives after the first paint (products load async), and the
		// row reflows on resize — both change whether the arrows belong.
		const observer = new ResizeObserver(sync);
		observer.observe(el);
		return () => {
			el.removeEventListener("scroll", sync);
			observer.disconnect();
		};
	}, [sync, children]);

	const nudge = (direction: 1 | -1) => {
		const el = ref.current;
		if (!el) return;
		el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
	};

	const arrow = (direction: 1 | -1, disabled: boolean) => (
		<button
			type="button"
			onClick={() => nudge(direction)}
			disabled={disabled}
			aria-label={direction === 1 ? "Scroll right" : "Scroll left"}
			// Sits on the vertical centre of the image tiles, which is where the
			// eye already is — the aspect-square tile is the top of the card, so
			// 50% of it lands mid-image rather than mid-card.
			className={`absolute top-[26%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur transition-all duration-200 disabled:pointer-events-none disabled:opacity-0 md:inline-flex ${
				direction === 1 ? "-right-3" : "-left-3"
			}`}
			style={{
				background: "color-mix(in srgb, var(--surface-paper) 88%, transparent)",
				border: "1px solid var(--border-light)",
				color: "var(--text-primary)",
				boxShadow: "0 8px 24px -10px rgba(12,43,37,0.35)",
			}}
		>
			{direction === 1 ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
		</button>
	);

	return (
		<div className="relative">
			{arrow(-1, atStart)}
			{arrow(1, atEnd)}

			<div
				ref={ref}
				role="region"
				aria-label={label}
				className="hide-scrollbar -mx-4 flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto scroll-smooth px-4 pb-2 sm:mx-0 sm:px-0"
			>
				{children}
			</div>
		</div>
	);
};

export default CardRail;
