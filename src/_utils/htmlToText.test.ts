// Run: pnpm test          (or: node --test src/_utils/htmlToText.test.ts)
import { test } from "node:test";
import assert from "node:assert/strict";
import { htmlToText } from "./htmlToText.ts";

test("block boundaries become spaces instead of running words together", () => {
	assert.equal(htmlToText("<p>happy gut.</p><p>Steady energy.</p>"), "happy gut. Steady energy.");
});

test("strips the Word cruft that comes with a pasted description", () => {
	const pasted = '<p class="MsoNormal" style="text-align: justify;">This course provides<o:p></o:p></p>';
	assert.equal(htmlToText(pasted), "This course provides");
});

test("drops script bodies rather than surfacing them as text", () => {
	assert.equal(htmlToText("<p>Safe</p><script>alert('xss')</script>"), "Safe");
});

test("decodes the entities a card excerpt would otherwise show raw", () => {
	assert.equal(htmlToText("<p>Tom &amp; Jerry&nbsp;&#39;s</p>"), "Tom & Jerry 's");
});

test("empty, null and undefined all flatten to an empty string", () => {
	assert.equal(htmlToText(""), "");
	assert.equal(htmlToText(null), "");
	assert.equal(htmlToText(undefined), "");
});

test("plain text with no markup survives untouched", () => {
	assert.equal(htmlToText("Just a description"), "Just a description");
});
