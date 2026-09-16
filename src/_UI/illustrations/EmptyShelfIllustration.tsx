import React from "react";

interface Props {
	className?: string;
}

const EmptyShelfIllustration: React.FC<Props> = ({ className = "w-40 h-40" }) => (
	<svg
		className={className}
		viewBox="0 0 200 200"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		{/* Shelf */}
		<rect x="30" y="140" width="140" height="6" rx="3" fill="currentColor" className="text-gray-400 dark:text-white/10" />
		<rect x="50" y="146" width="4" height="24" rx="2" fill="currentColor" className="text-gray-400 dark:text-white/10" />
		<rect x="146" y="146" width="4" height="24" rx="2" fill="currentColor" className="text-gray-400 dark:text-white/10" />

		{/* Empty box left */}
		<g className="text-gray-200 dark:text-white/15">
			<rect x="48" y="100" width="40" height="40" rx="4" fill="currentColor" />
			<path d="M48 108a4 4 0 014-4h32a4 4 0 014 4v4H48v-4z" fill="currentColor" className="text-gray-300 dark:text-white/10" />
		</g>
		<rect x="48" y="100" width="40" height="40" rx="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" className="text-gray-400 dark:text-white/20" fill="none" />

		{/* Empty box right */}
		<g className="text-gray-200 dark:text-white/15">
			<rect x="112" y="108" width="36" height="32" rx="4" fill="currentColor" />
		</g>
		<rect x="112" y="108" width="36" height="32" rx="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" className="text-gray-400 dark:text-white/20" fill="none" />

		{/* Leaf accent */}
		<g className="text-primary-400 dark:text-primary-600">
			<path d="M100 50c8-16 28-20 32-8-8 2-20 10-24 22-2-6-6-11-8-14z" fill="currentColor" opacity="0.6">
				<animateTransform attributeName="transform" type="rotate" values="-3,100,58;3,100,58;-3,100,58" dur="4s" repeatCount="indefinite" />
			</path>
			<line x1="100" y1="58" x2="100" y2="80" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4">
				<animateTransform attributeName="transform" type="rotate" values="-3,100,58;3,100,58;-3,100,58" dur="4s" repeatCount="indefinite" />
			</line>
		</g>

		{/* Sparkles */}
		<circle cx="72" cy="86" r="1.5" fill="currentColor" className="text-primary-400 dark:text-primary-500">
			<animate attributeName="opacity" values="0;1;0" dur="2.5s" repeatCount="indefinite" />
		</circle>
		<circle cx="140" cy="94" r="1.5" fill="currentColor" className="text-primary-400 dark:text-primary-500">
			<animate attributeName="opacity" values="0;1;0" dur="3s" begin="0.8s" repeatCount="indefinite" />
		</circle>
		<circle cx="56" cy="70" r="1" fill="currentColor" className="text-primary-300 dark:text-primary-600">
			<animate attributeName="opacity" values="0;1;0" dur="2s" begin="1.2s" repeatCount="indefinite" />
		</circle>
	</svg>
);

export default EmptyShelfIllustration;
