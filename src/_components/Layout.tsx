// LIBRARY COMPONENTS
import Head from "next/head";
import React from "react";

// CUSTOM COMPONENTS
import { LayoutProps } from "@/types/client/layout";
import Navbar from "../_navigations/Navbar";
import Footer from "../_navigations/Footer";
import { usePathname } from "next/navigation";

const Layout = ({ children, pageTitle }: LayoutProps) => {
	const pathnaame = usePathname() || "/";
	const lastSegment = pathnaame.split("/").filter(Boolean).pop() || "";

	const page_name = pageTitle || (lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1));

	return (
		<>
			<Head>
				<title>{page_name} | Green Pastures Organics</title>
				{/* <meta charset="UTF-8" /> */}
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

				{/* Favicons are in _document.tsx */}
			</Head>

			<div className="min-h-screen overflow-x-hidden bg-mint-50 dark:bg-[#0a0f1a] transition-colors duration-300">
				{/* <PromoBanner /> */}
				<Navbar />
				<main className="flex-1 pt-16 md:pt-[72px]">{children}</main>
				<Footer />
			</div>
		</>
	);
};

export default Layout;
