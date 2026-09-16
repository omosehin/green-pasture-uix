import { defineConfig, devices } from "@playwright/test";

const PORT = 3210;

export default defineConfig({
	testDir: "./e2e",
	// Money-path assertions should never be flaky-retried into passing locally.
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? "github" : [["list"]],
	timeout: 30_000,
	expect: { timeout: 7_000 },
	use: {
		baseURL: `http://127.0.0.1:${PORT}`,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: {
		command: `npx next dev -p ${PORT}`,
		url: `http://127.0.0.1:${PORT}/checkout-card`,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000,
	},
});
