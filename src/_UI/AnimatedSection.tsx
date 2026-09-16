"use client";

import React, { useRef } from "react";
import { motion, useInView, Variants } from "framer-motion";

interface AnimatedSectionProps {
	children: React.ReactNode;
	delay?: number;
	direction?: "up" | "left" | "right" | "fade";
	className?: string;
}

const directionVariants: Record<string, Variants> = {
	up: {
		hidden: { opacity: 0, y: 40 },
		visible: { opacity: 1, y: 0 },
	},
	left: {
		hidden: { opacity: 0, x: -40 },
		visible: { opacity: 1, x: 0 },
	},
	right: {
		hidden: { opacity: 0, x: 40 },
		visible: { opacity: 1, x: 0 },
	},
	fade: {
		hidden: { opacity: 0 },
		visible: { opacity: 1 },
	},
};

const AnimatedSection: React.FC<AnimatedSectionProps> = ({
	children,
	delay = 0,
	direction = "up",
	className = "",
}) => {
	const ref = useRef<HTMLDivElement>(null);
	const isInView = useInView(ref, { once: true, margin: "-100px" });

	return (
		<motion.div
			ref={ref}
			variants={directionVariants[direction]}
			initial="hidden"
			animate={isInView ? "visible" : "hidden"}
			transition={{
				duration: 0.6,
				delay,
				ease: [0.25, 0.1, 0.25, 1],
			}}
			className={className}
		>
			{children}
		</motion.div>
	);
};

export default AnimatedSection;
