"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Sprout } from "lucide-react";

/**
 * Hero for an organic supplement brand.
 *
 * The art is the photograph — a family at the table with the product — cropped
 * from the right so the image's own white field becomes the copy column. The
 * arch is baked into the asset, so nothing here masks or clips it.
 *
 * ponytail: hard-coded light palette rather than themed. The photo carries a
 * white background; a dark-mode hero would need a second asset, not CSS.
 */

const BotanicalHero: React.FC = () => {
	const reduced = !!useReducedMotion();
	const rootRef = useRef<HTMLElement>(null);

	const { scrollYProgress } = useScroll({ target: rootRef, offset: ["start start", "end start"] });
	const copyY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -40]);
	const fade = useTransform(scrollYProgress, [0, 0.85], [1, reduced ? 1 : 0]);

	const rise = (delay: number) => ({
		initial: { opacity: 0, y: reduced ? 0 : 26 },
		animate: { opacity: 1, y: 0 },
		transition: { duration: reduced ? 0 : 0.75, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const },
	});

	return (
		<section
			ref={rootRef}
			className="relative isolate overflow-hidden bg-white dark:bg-[#0c1425] transition-colors duration-300"
		>
			{/* Photograph. In flow on small screens, pinned to the right half from lg up. */}
			<motion.div
				initial={{ opacity: 0, scale: reduced ? 1 : 1.04 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: reduced ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] }}
				className="relative h-[280px] w-full sm:h-[380px] lg:absolute lg:inset-y-0 lg:right-0 lg:h-full lg:w-[58%]"
			>
				<Image
					src="/images/landing_page_image.png"
					alt="A family sharing an Exotic Green Smoothie supplement at the kitchen table"
					fill
					priority
					quality={95}
					sizes="(max-width: 1024px) 100vw, 58vw"
					className="object-cover object-center sm:object-right"
				/>
				{/* Feathers the crop edge into the copy column on desktop */}
				<div
					aria-hidden
					className="pointer-events-none absolute inset-y-0 left-0 hidden w-40 lg:block bg-gradient-to-r from-white dark:from-[#0c1425] to-transparent"
				/>
				{/* Bottom fade on mobile so photograph seamlessly blends into content */}
				<div
					aria-hidden
					className="pointer-events-none absolute inset-x-0 bottom-0 h-16 block lg:hidden bg-gradient-to-t from-white dark:from-[#0c1425] to-transparent"
				/>
			</motion.div>

			<motion.div style={{ opacity: fade }} className="page-wrapper relative z-10 py-10 sm:py-16 md:py-24 lg:py-32">
				<motion.div style={{ y: copyY }} className="max-w-xl lg:max-w-[46%]">
					<motion.div
						{...rise(0.05)}
						className="mb-6 sm:mb-7 inline-flex items-center gap-2 rounded-full py-1.5 pl-2 pr-4 bg-[rgba(122,171,45,0.10)] dark:bg-[rgba(154,202,60,0.16)] border border-[rgba(122,171,45,0.35)] dark:border-[rgba(154,202,60,0.35)]"
					>
						<span
							className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(122,171,45,0.18)] dark:bg-[rgba(154,202,60,0.22)]"
						>
							<Sprout className="h-3.5 w-3.5 text-[#5c8a1e] dark:text-[#9aca3c]" />
						</span>
						<span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#5c8a1e] dark:text-[#9aca3c]">
							Grown, never manufactured
						</span>
					</motion.div>

					<h1 className="font-display text-[2.6rem] leading-[0.96] tracking-[-0.02em] sm:text-6xl lg:text-[4.4rem] text-[#10231f] dark:text-slate-100">
						<motion.span {...rise(0.14)} className="block" style={{ fontWeight: 300 }}>
							Wellness that
						</motion.span>
						<motion.span {...rise(0.24)} className="block italic text-[#5c8a1e] dark:text-[#9aca3c]" style={{ fontWeight: 500 }}>
							remembers
						</motion.span>
						<motion.span {...rise(0.34)} className="block" style={{ fontWeight: 300 }}>
							where it grew.
						</motion.span>
					</h1>

					<motion.p
						{...rise(0.46)}
						className="mt-6 sm:mt-7 max-w-md text-base leading-relaxed sm:text-lg text-[#10231f]/75 dark:text-slate-300"
					>
						Immunity and fertility supplements pressed from organically farmed roots, leaves and seeds —
						traced from Northern Nigerian soil to the jar in your hand.
					</motion.p>

					<motion.div {...rise(0.56)} className="mt-8 sm:mt-9 flex flex-wrap items-center gap-3">
						<Link
							href="/products"
							className="group inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-semibold transition-all duration-300 hover:shadow-[0_10px_30px_-8px_rgba(122,171,45,0.65)] active:scale-[0.98]"
							style={{ background: "#9aca3c", color: "#0c2b25" }}
						>
							Shop the range
							<ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
						</Link>
						<Link
							href="/about"
							className="rounded-full px-7 py-3.5 text-sm font-medium transition-colors duration-300 hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.98] border border-[#10231f]/20 dark:border-white/20 text-[#10231f] dark:text-slate-100"
						>
							How we source
						</Link>
					</motion.div>

					{/* Provenance strip — concrete claims, not vague trust badges */}
					<motion.dl
						{...rise(0.68)}
						className="mt-10 sm:mt-12 grid max-w-md grid-cols-3 gap-6 border-t pt-6 sm:pt-7 border-[#10231f]/12 dark:border-white/12"
					>
						{[
							{ n: "100%", l: "Certified organic" },
							{ n: "12", l: "Partner farms" },
							{ n: "48h", l: "Farm to dispatch" },
						].map((s) => (
							<div key={s.l}>
								<dt className="font-display text-2xl tabular-nums sm:text-3xl text-[#5c8a1e] dark:text-[#9aca3c]" style={{ fontWeight: 500 }}>
									{s.n}
								</dt>
								<dd className="mt-1 text-[0.68rem] uppercase tracking-[0.12em] text-[#10231f]/60 dark:text-slate-400">
									{s.l}
								</dd>
							</div>
						))}
					</motion.dl>
				</motion.div>
			</motion.div>
		</section>
	);
};

export default BotanicalHero;
