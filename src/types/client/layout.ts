import { ReactNode } from "react";

export interface LayoutProps {
	children: ReactNode;
	pageTitle?: string | null;
	/** Overrides the final breadcrumb crumb; defaults to pageTitle. */
	breadcrumbLabel?: string;
}
