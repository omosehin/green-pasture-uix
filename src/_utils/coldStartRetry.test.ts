// Run: pnpm test          (or: node --test src/_utils/coldStartRetry.test.ts)
import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldRetryColdStart, isColdStartFailure } from "./coldStartRetry.ts";

const timeout = { code: "ECONNABORTED", message: "timeout of 15000ms exceeded" };

test("retries a GET that timed out with no response", () => {
	assert.equal(shouldRetryColdStart(timeout, { method: "get" }), true);
});

test("retries a GET whose method was never set (axios defaults to get)", () => {
	assert.equal(shouldRetryColdStart(timeout, {}), true);
});

test("retries only once", () => {
	assert.equal(shouldRetryColdStart(timeout, { method: "get", _coldStartRetry: true }), false);
});

test("never replays a write — the timed-out POST may already have been applied", () => {
	for (const method of ["post", "patch", "put", "delete"]) {
		assert.equal(shouldRetryColdStart(timeout, { method }), false, method);
	}
});

test("leaves a real server answer alone", () => {
	for (const status of [400, 401, 429, 500]) {
		const answered = { code: "ERR_BAD_RESPONSE", response: { status } };
		assert.equal(shouldRetryColdStart(answered, { method: "get" }), false, String(status));
	}
});

test("treats a dropped connection as a cold start too", () => {
	assert.equal(isColdStartFailure({ message: "Network Error" }), true);
	assert.equal(isColdStartFailure({ code: "ERR_NETWORK" }), true);
});

test("a 500 is the server answering, not a cold start", () => {
	assert.equal(isColdStartFailure({ code: "ECONNABORTED", response: { status: 500 } }), false);
});
