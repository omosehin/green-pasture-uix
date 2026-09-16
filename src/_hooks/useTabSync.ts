import { useEffect } from "react";
import { useRouter } from "next/router";

import { findOwningModule } from "@/_navigations/modules";
import { useTabsStore } from "@/_store/tabs.store";
import { useHasPrivilege } from "@/_hooks/usePrivilege";

/**
 * Opens the tab matching the current URL on navigation, when the user may view it.
 * For detail routes (e.g. /admin/product/27), the PARENT module's tab is opened/activated.
 *
 * Uses `router.asPath` rather than `router.pathname` — `pathname` is the file
 * pattern (e.g. '/admin/product/[id]'), while `findOwningModule` matches real URLs.
 */
export function useTabSync(): void {
	const router = useRouter();
	const openTab = useTabsStore((s) => s.openTab);
	const hasPrivilege = useHasPrivilege();

	useEffect(() => {
		const mod = findOwningModule(router.asPath.split("?")[0]);
		if (mod && hasPrivilege(mod.privilege)) openTab(mod.path);
	}, [router.asPath, openTab, hasPrivilege]);
}
