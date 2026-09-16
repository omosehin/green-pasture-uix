/**
 * Flatten description HTML to plain text for the places that need a one- or
 * two-line excerpt — product cards, list rows, meta descriptions, cart lines.
 *
 * Those spots use `line-clamp`, which measures rendered boxes: dropping raw
 * HTML in there would clamp a heading or a list item rather than the sentence,
 * and would also re-introduce the injection surface `SanitizedHtml` exists to
 * close. Tag-stripping with a regex is safe precisely *because* the result is
 * rendered as text and never as markup.
 */
export function htmlToText(html?: string | null): string {
	if (!html) return "";

	return html
		// Drop script/style bodies outright rather than leaving their contents
		// behind as visible text.
		.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
		// Block boundaries become spaces so "…gut.</p><p>Steady…" doesn't
		// collapse into "gut.Steady".
		.replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, " ")
		.replace(/<br\s*\/?>/gi, " ")
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">")
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'")
		.replace(/\s+/g, " ")
		.trim();
}
