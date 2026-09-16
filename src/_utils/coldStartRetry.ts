// The API host sleeps when idle. A measured cold start answers in ~44s, while
// axios gives up at 15s — so the FIRST page load after a quiet spell always
// timed out ("Couldn't load products"), and the refresh a few seconds later
// always worked, because the timed-out request had already woken the server.
//
// ponytail: this is a client-side plaster on a hosting problem. The real fix is
// to stop the API sleeping (paid instance, or a keep-warm ping). Drop this file
// once the backend no longer cold-starts.
export const COLD_START_TIMEOUT_MS = 60_000;

/**
 * A failure with no HTTP response at all — the request timed out or never
 * landed. Anything carrying a response (404, 429, 500) is the server answering
 * and must not be retried here.
 */
export function isColdStartFailure(error: any): boolean {
	if (error?.response) return false;
	return (
		error?.code === "ECONNABORTED" ||
		error?.code === "ETIMEDOUT" ||
		error?.code === "ERR_NETWORK" ||
		error?.message === "Network Error"
	);
}

/**
 * Retry once, and only for reads. A POST/PATCH/DELETE that timed out may well
 * have been applied server-side, so replaying it risks a duplicate write.
 */
export function shouldRetryColdStart(error: any, config: any): boolean {
	if (!config || config._coldStartRetry) return false;
	if (String(config.method ?? "get").toLowerCase() !== "get") return false;
	return isColdStartFailure(error);
}
