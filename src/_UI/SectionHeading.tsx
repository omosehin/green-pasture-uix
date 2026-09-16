import React from "react";

interface SectionHeadingProps {
	eyebrow?: string;
	title: string;
	/** Rendered italic in the accent colour, on its own line — the emphasis half of the statement. */
	accent?: string;
	centered?: boolean;
	className?: string;
}

/** Shared section title. Keeps the display/italic rhythm consistent across pages. */
const SectionHeading: React.FC<SectionHeadingProps> = ({ eyebrow, title, accent, centered, className = "" }) => (
	<div className={`${centered ? "mx-auto max-w-2xl text-center" : "max-w-xl"} ${className}`}>
		{eyebrow && (
			<p className="mb-4 text-[0.68rem] font-semibold uppercase tracking-[0.22em]" style={{ color: "#7fac2d" }}>
				{eyebrow}
			</p>
		)}
		<h2
			className="font-display text-3xl leading-[1.08] tracking-[-0.01em] sm:text-4xl lg:text-[2.9rem]"
			style={{ color: "var(--text-primary)", fontWeight: 300 }}
		>
			{title}
			{accent && (
				<>
					{" "}
					<span className="italic" style={{ color: "var(--color-primary)", fontWeight: 500 }}>
						{accent}
					</span>
				</>
			)}
		</h2>
	</div>
);

export default SectionHeading;
