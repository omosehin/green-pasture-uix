"use client";

import React from "react";
import DOMPurify from "dompurify";

interface SanitizedHtmlProps {
	html?: string | null;
	className?: string;
	/** Rendered when there is no description at all. */
	fallback?: React.ReactNode;
}

/**
 * Renders admin-authored description HTML.
 *
 * Descriptions are stored as HTML so pasted formatting survives the round
 * trip, which makes this an injection boundary: anyone who can edit a product
 * could otherwise land a script tag on every storefront page that shows it.
 * DOMPurify strips scripts, event handlers and javascript: URLs while leaving
 * the formatting intact — including the Word cruft (`<o:p>`, `class="MsoNormal"`)
 * that comes with pasting from a document.
 *
 * Sanitising happens on render rather than on save on purpose: content already
 * in the database is covered too, without a backfill.
 */
const SanitizedHtml: React.FC<SanitizedHtmlProps> = ({ html, className = "", fallback = null }) => {
	// DOMPurify needs a real DOM. This app is statically exported and every
	// description arrives from a client-side fetch, so there is nothing to
	// render during the build pass anyway — but never emit unsanitised markup
	// as a "fallback" if that ever changes.
	const [mounted, setMounted] = React.useState(false);
	React.useEffect(() => setMounted(true), []);

	const clean = React.useMemo(() => {
		if (!mounted || !html) return "";
		return DOMPurify.sanitize(html, {
			USE_PROFILES: { html: true },
			ADD_ATTR: ["target", "rel"],
			FORBID_TAGS: ["style", "form", "input", "button"],
			FORBID_ATTR: ["style"],
		});
	}, [html, mounted]);

	if (!html) return <>{fallback}</>;
	// Pre-hydration the markup is empty; reserving no space avoids a layout jump
	// once it fills in, since the surrounding sections are already flowing.
	if (!mounted) return null;
	if (!clean.trim()) return <>{fallback}</>;

	return <div className={`rte-content ${className}`} dangerouslySetInnerHTML={{ __html: clean }} />;
};

export default SanitizedHtml;
