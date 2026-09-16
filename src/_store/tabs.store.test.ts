// Run: pnpm test          (or: node --test src/_store/tabs.store.test.ts)
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { useTabsStore, HOME_PATH, MAX_TABS } from "./tabs.store.ts";

// The store is a module-level singleton — reset it before every test so
// assertions never depend on execution order.
beforeEach(() => {
	useTabsStore.setState({ openPaths: [HOME_PATH] });
});

test("openTab is idempotent — opening an already-open path does not duplicate it", () => {
	useTabsStore.getState().openTab("/admin/products");
	useTabsStore.getState().openTab("/admin/products");
	const { openPaths } = useTabsStore.getState();
	assert.equal(openPaths.filter((p) => p === "/admin/products").length, 1);
});

test("opening an unknown path is a no-op", () => {
	const before = useTabsStore.getState().openPaths;
	useTabsStore.getState().openTab("/admin/does-not-exist");
	assert.deepEqual(useTabsStore.getState().openPaths, before);
});

test("closeTab refuses to close a module with closable: false", () => {
	// HOME_PATH (Dashboard) is pinned — it must survive an attempted close.
	useTabsStore.getState().closeTab(HOME_PATH);
	assert.ok(useTabsStore.getState().openPaths.includes(HOME_PATH));
});

test("exceeding MAX_TABS evicts the oldest closable tab and keeps the pinned one", () => {
	// Seed the store with the pinned tab plus enough filler tabs to sit right at
	// the cap. Filler paths aren't registered modules, but findModule() returning
	// undefined for them still reads as "closable" (only closable: false is protected),
	// which is exactly the eviction logic under test.
	const filler = Array.from({ length: MAX_TABS - 1 }, (_, i) => `/filler-${i}`);
	useTabsStore.setState({ openPaths: [HOME_PATH, ...filler] });
	assert.equal(useTabsStore.getState().openPaths.length, MAX_TABS);

	// One more open pushes past the cap and must trigger eviction.
	useTabsStore.getState().openTab("/admin/settings");

	const { openPaths } = useTabsStore.getState();
	assert.equal(openPaths.length, MAX_TABS, "stays capped at MAX_TABS after eviction");
	assert.ok(openPaths.includes(HOME_PATH), "pinned Dashboard tab survives eviction");
	assert.ok(!openPaths.includes("/filler-0"), "the oldest closable tab (filler-0) was evicted");
	assert.ok(openPaths.includes("/filler-1"), "the next-oldest closable tab was NOT evicted");
	assert.ok(openPaths.includes("/admin/settings"), "the newly opened tab is present");
});
