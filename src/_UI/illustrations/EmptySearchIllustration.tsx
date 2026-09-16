import React from "react";

interface Props {
	className?: string;
}

const EmptySearchIllustration: React.FC<Props> = ({ className = "w-36 h-36" }) => (
	<svg
		className={className}
		viewBox="0 0 200 200"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		{/* Magnifying glass */}
		<circle cx="90" cy="88" r="32" stroke="currentColor" strokeWidth="4" className="text-gray-300 dark:text-white/15" fill="none" />
		<line x1="113" y1="112" x2="138" y2="137" stroke="currentColor" strokeWidth="5" strokeLinecap="round" className="text-gray-300 dark:text-white/15" />

		{/* Question mark inside glass */}
		<text x="90" y="96" textAnchor="middle" fontSize="28" fontWeight="bold" fill="currentColor" className="text-gray-300 dark:text-white/20">?</text>

		{/* Floating particles */}
		<circle cx="52" cy="62" r="2" fill="currentColor" className="text-primary-400 dark:text-primary-600">
			<animate attributeName="opacity" values="0;1;0" dur="2.5s" repeatCount="indefinite" />
			<animate attributeName="cy" values="62;56;62" dur="2.5s" repeatCount="indefinite" />
		</circle>
		<circle cx="134" cy="70" r="1.5" fill="currentColor" className="text-primary-400 dark:text-primary-600">
			<animate attributeName="opacity" values="0;1;0" dur="3s" begin="0.6s" repeatCount="indefinite" />
			<animate attributeName="cy" values="70;64;70" dur="3s" begin="0.6s" repeatCount="indefinite" />
		</circle>
		<circle cx="72" cy="130" r="1.5" fill="currentColor" className="text-primary-300 dark:text-primary-700">
			<animate attributeName="opacity" values="0;1;0" dur="2s" begin="1s" repeatCount="indefinite" />
			<animate attributeName="cy" values="130;124;130" dur="2s" begin="1s" repeatCount="indefinite" />
		</circle>

		{/* Small leaf */}
		<g className="text-primary-400 dark:text-primary-600">
			<path d="M140 52c5-10 18-13 20-5-5 1.5-13 7-16 14-1-4-3-7-4-9z" fill="currentColor" opacity="0.5">
				<animateTransform attributeName="transform" type="rotate" values="-4,148,56;4,148,56;-4,148,56" dur="3.5s" repeatCount="indefinite" />
			</path>
		</g>
	</svg>
);

export default EmptySearchIllustration;
