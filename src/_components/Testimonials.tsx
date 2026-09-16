"use client";

import React, { useEffect, useState } from "react";

import { CircularTestimonials } from "@/components/ui/circular-testimonials";
import { useAppDispatch, useAppSelector } from "@/_redux/store";
import { reviewAction } from "@/_redux/actions/review.action";
import AnimatedSection from "@/_UI/AnimatedSection";
import SectionHeading from "@/_UI/SectionHeading";

const PAGE_SIZE = 6;
/** Shown when a reviewer has no avatar and the item they reviewed has no photo. */
const FALLBACK_IMAGE = "/images/Green_vegggies_1.jpeg";

interface TestimonialsProps {
	/** Scope to one product. Omitted = the site-wide reel on the home page. */
	itemId?: string;
	/** Prefer moderator-curated quotes (home page). Falls back to the open reel if none are curated yet. */
	featured?: boolean;
	eyebrow?: string;
	title?: string;
	accent?: string;
	/** Render without the full-bleed section band, for pages that already have a container. */
	inline?: boolean;
}

const Testimonials: React.FC<TestimonialsProps> = ({
	itemId,
	featured = false,
	inline = false,
	eyebrow = "In their words",
	title = "People who",
	accent = "kept reordering.",
}) => {
	const dispatch = useAppDispatch();
	const { testimonials, testimonialsPagination, isLoadingTestimonials } = useAppSelector((state) => state.review);
	const [curatedOnly, setCuratedOnly] = useState(featured);

	useEffect(() => {
		dispatch(reviewAction.fetchTestimonialsAsync({ page: 1, limit: PAGE_SIZE, itemId, featured: curatedOnly }));
	}, [dispatch, itemId, curatedOnly]);

	/* Nobody has curated anything yet — show the highest-rated recent reviews
	   rather than an empty section. Once a moderator features one, this stops firing. */
	useEffect(() => {
		if (curatedOnly && !isLoadingTestimonials && testimonialsPagination?.totalItems === 0) {
			setCuratedOnly(false);
		}
	}, [curatedOnly, isLoadingTestimonials, testimonialsPagination]);

	const currentPage = testimonialsPagination?.currentPage ?? 1;
	const hasMore = currentPage < (testimonialsPagination?.totalPages ?? 1);

	/* Page in the next batch as the carousel nears the end of what's loaded, so a
	   long tail of reviews never arrives as one enormous first response. */
	const handleIndexChange = (index: number) => {
		if (!hasMore || isLoadingTestimonials) return;
		if (index < testimonials.length - 2) return;
		dispatch(reviewAction.fetchTestimonialsAsync({ page: currentPage + 1, limit: PAGE_SIZE, itemId, featured: curatedOnly }));
	};

	// Nothing to brag about yet — better no section than a placeholder one.
	if (!testimonials.length) return null;

	const items = testimonials.map((review) => ({
		quote: review.comment ?? "",
		name: review.customer,
		designation: review.item?.name ? `${review.rating}★ · ${review.item.name}` : `${review.rating}★ · Verified buyer`,
		src: review.customerImage || review.itemImage || FALLBACK_IMAGE,
	}));

	const body = (
		<>
			<AnimatedSection>
				<SectionHeading eyebrow={eyebrow} title={title} accent={accent} centered />
			</AnimatedSection>
			<AnimatedSection delay={0.15}>
				<div className="mt-12 flex justify-center">
					<CircularTestimonials
						testimonials={items}
						autoplay
						onIndexChange={handleIndexChange}
						colors={{
							name: "var(--text-primary)",
							designation: "var(--text-hint)",
							testimony: "var(--text-secondary)",
							arrowBackground: "var(--color-primary)",
							arrowForeground: "#f4f8e8",
							arrowHoverBackground: "#9aca3c",
						}}
						fontSizes={{ name: "26px", designation: "15px", quote: "18px" }}
					/>
				</div>
			</AnimatedSection>
		</>
	);

	// Inline drops the full-bleed band and page-wrapper — the product page already
	// supplies both, and nesting them doubles the gutter.
	if (inline) {
		return (
			<div className="border-t pt-14" style={{ borderColor: "var(--border-light)" }}>
				{body}
			</div>
		);
	}

	return (
		<section className="py-20 md:py-28" style={{ background: "var(--surface-low)" }}>
			<div className="page-wrapper">{body}</div>
		</section>
	);
};

export default Testimonials;
