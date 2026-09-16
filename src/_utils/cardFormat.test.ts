// Run: node --test src/_utils/cardFormat.test.ts   (Node 22.18+ strips types natively)
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatCard, formatExpiry, luhnValid, expiryValid, brandOf, onlyDigits } from "./cardFormat.ts";

test("formatCard groups in fours and caps at 19 digits", () => {
	assert.equal(formatCard("4111111111111111"), "4111 1111 1111 1111");
	assert.equal(formatCard("41111"), "4111 1");
	assert.equal(formatCard("4a1b1c1"), "4111");
	assert.equal(onlyDigits(formatCard("1".repeat(30))).length, 19);
});

test("formatExpiry inserts the slash only after two digits", () => {
	assert.equal(formatExpiry("1"), "1");
	assert.equal(formatExpiry("12"), "12");
	assert.equal(formatExpiry("1229"), "12/29");
	assert.equal(formatExpiry("12/29/99"), "12/29");
});

test("luhnValid accepts real test PANs and rejects typos", () => {
	assert.equal(luhnValid("4111111111111111"), true); // Visa test card
	assert.equal(luhnValid("5555555555554444"), true); // Mastercard test card
	assert.equal(luhnValid("4111111111111112"), false); // last digit off
	assert.equal(luhnValid("411111"), false); // too short
});

test("expiryValid rejects past dates and bad months", () => {
	const now = new Date(2026, 6, 27); // 2026-07-27
	assert.equal(expiryValid("07/26", now), true); // expires end of this month
	assert.equal(expiryValid("06/26", now), false); // last month
	assert.equal(expiryValid("12/29", now), true);
	assert.equal(expiryValid("13/29", now), false); // no month 13
	assert.equal(expiryValid("00/29", now), false);
	assert.equal(expiryValid("12", now), false); // incomplete
});

test("brandOf detects the networks Paystack settles", () => {
	assert.equal(brandOf("4111111111111111"), "VISA");
	assert.equal(brandOf("5555555555554444"), "Mastercard");
	assert.equal(brandOf("5061111111111111"), "Verve");
	assert.equal(brandOf("9999"), "");
});
