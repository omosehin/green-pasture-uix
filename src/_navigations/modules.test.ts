// Run: pnpm test          (or: node --test src/_navigations/modules.test.ts)
import { test } from "node:test";
import assert from "node:assert/strict";
import { MODULES, NAV_GROUPS, findModule, findOwningModule } from "./modules.ts";

test("findModule resolves an exact path to its module", () => {
	assert.equal(findModule("/admin/products")?.title, "Products");
});

test("findModule returns undefined for a path that isn't a module", () => {
	assert.equal(findModule("/admin/products/abc"), undefined);
});

test("findOwningModule resolves a detail route to its parent via owns", () => {
	// '/admin/products' owns the singular '/admin/product' detail-route base —
	// a plain prefix match wouldn't catch this since the base paths differ.
	assert.equal(findOwningModule("/admin/product/abc")?.path, "/admin/products");
});

test("findOwningModule resolves a detail route to its parent via path prefix", () => {
	assert.equal(findOwningModule("/admin/roles/new")?.path, "/admin/roles");
});

test("findOwningModule returns undefined for an unknown path", () => {
	assert.equal(findOwningModule("/admin/nonexistent"), undefined);
});

test("NAV_GROUPS preserves first-seen group order", () => {
	const expectedOrder = [...new Set(MODULES.map((m) => m.group))];
	assert.deepEqual(
		NAV_GROUPS.map((g) => g.label),
		expectedOrder,
	);
});

test("every admin detail route resolves to the module its breadcrumb links back to", () => {
	// AdminLayout shows a breadcrumb only when findOwningModule resolves, so an
	// unowned detail route would silently render no trail.
	const detailRoutes: Array<[string, string]> = [
		["/admin/product/019f-abc", "Products"],
		["/admin/products/new", "Products"],
		["/admin/order/019f-abc", "Orders"],
		["/admin/customer/019f-abc", "Customers"],
		["/admin/staff/019f-abc", "Staff"],
		["/admin/role/019f-abc", "Roles"],
		["/admin/roles/new", "Roles"],
	];
	for (const [route, expected] of detailRoutes) {
		assert.equal(findOwningModule(route)?.title, expected, route);
		assert.equal(findModule(route), undefined, `${route} must not be a module itself`);
	}
});
