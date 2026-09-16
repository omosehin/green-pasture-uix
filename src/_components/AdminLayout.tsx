"use client";

// LIBRARY COMPONENTS
import Head from "next/head";
import React from "react";

// CUSTOM COMPONENTS
import { LayoutProps } from "@/types/client/layout";
import { usePathname } from "next/navigation";
import Breadcrumb from "@/_UI/Breadcrumb";
import { findModule, findOwningModule } from "@/_navigations/modules";

// Page-level <Head> only. The shell (sidebar/top bar/tabs) is mounted once in
// _app.tsx so it survives navigation — see the comment there.
const AdminLayout = ({ children, pageTitle, breadcrumbLabel }: LayoutProps) => {
	const pathname = usePathname() || "";
	const lastSegment = pathname.split("/").filter(Boolean).pop() || "";
	const page_name = pageTitle || (lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1));

	/* Detail screens are the routes that aren't a module of their own —
	   /admin/product/[id], /admin/products/new and friends. They get a trail
	   back to the list they came from, derived from MODULES so a new detail
	   route is covered the moment its parent module exists. */
	const owner = findOwningModule(pathname);
	const isDetail = !findModule(pathname) && !!owner;
	// Ids make terrible crumbs; fall back to the page title the page already sets.
	const leaf = breadcrumbLabel || pageTitle || (lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1));

	return (
		<>
			<Head>
				<title>{page_name} | Green Pastures Admin</title>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
				/>
				<meta
					name="description"
					content="Green Pastures - Living healthy with fresh, organic products and insightful blogs."
				/>
				<meta
					name="keywords"
					content="organic, health, wellness, immunity, fertility, blog, supplements"
				/>
				<meta name="author" content="Green Pastures Organics" />
				<meta property="og:type" content="website" />
				<meta
					property="og:title"
					content="Green Pastures | Living Healthy"
				/>
				<meta
					property="og:description"
					content="Discover fresh organic products to support immunity, fertility, and wellness."
				/>
				<meta
					property="og:image"
					content="images/GP Organic Logo (Primary).png"
				/>
				<meta
					property="og:url"
					content="https://greenpastures.vercel.app"
				/>
				<meta property="og:site_name" content="Green Pastures" />
				<link
					rel="icon"
					href="./icons/favicon.ico"
					type="image/x-icon"
				/>
				<link
					rel="icon"
					href="./icons/favicon-16x16.png"
					type="image/png"
					sizes="32x32"
				/>
				<link
					rel="icon"
					href="./icons/favicon-32x32.png"
					type="image/png"
					sizes="64x64"
				/>
				<link
					rel="apple-touch-icon"
					href="./icons/apple-touch-icon.png"
					sizes="180x180"
				/>
				<link
					rel="icon"
					href="./icons/android-chrome-192x192.png"
					type="image/png"
					sizes="192x192"
				/>
				<link
					rel="icon"
					href="./icons/android-chrome-512x512.png"
					type="image/png"
					sizes="512x512"
				/>
			</Head>

			{isDetail && (
				<div className="mb-5">
					<Breadcrumb
						items={[
							{ label: "Dashboard", href: "/admin/dashboard" },
							{ label: owner.title, href: owner.path },
							{ label: leaf },
						]}
					/>
				</div>
			)}

			{children}
		</>
	);
};

export default AdminLayout;
