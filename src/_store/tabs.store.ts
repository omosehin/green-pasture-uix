import { create } from "zustand";

import { findModule } from "../_navigations/modules.ts";

/** Always-present home tab path. */
export const HOME_PATH = "/admin/dashboard";

/** Maximum number of open tabs. Opening beyond this evicts the oldest closable tab. */
export const MAX_TABS = 10;

interface TabsState {
  /** Ordered list of open tab paths. Active tab is derived from the URL. */
  openPaths: string[];
  /** Add a tab for `path` if not already open (idempotent — reuse semantics). */
  openTab: (path: string) => void;
  /** Remove the tab for `path`; refuses to remove a non-closable module. */
  closeTab: (path: string) => void;
}

export const useTabsStore = create<TabsState>((set) => ({
  openPaths: [HOME_PATH],
  openTab: (path) =>
    set((state) => {
      if (!findModule(path) || state.openPaths.includes(path)) return state;
      let openPaths = [...state.openPaths, path];
      if (openPaths.length > MAX_TABS) {
        // Evict the oldest closable tab to stay within the cap (keeps pinned tabs like Dashboard).
        const evictIndex = openPaths.findIndex((p) => findModule(p)?.closable !== false);
        if (evictIndex !== -1) openPaths = openPaths.filter((_, i) => i !== evictIndex);
      }
      return { openPaths };
    }),
  closeTab: (path) =>
    set((state) => {
      if (findModule(path)?.closable === false) return state;
      return { openPaths: state.openPaths.filter((p) => p !== path) };
    }),
}));
