"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";

interface PageTransitionProps {
	children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
	const router = useRouter();

	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={router.pathname}
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -8 }}
				transition={{ duration: 0.2, ease: "easeInOut" }}
			>
				{children}
			</motion.div>
		</AnimatePresence>
	);
};

export default PageTransition;
