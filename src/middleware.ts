import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIES } from "@/_utils/authCookies";
import { appConstants } from "@/_redux/constants";
import { safeRedirectTarget } from "@/_utils/redirect";

// Roles allowed into /admin/*, normalized to lowercase to match the gp_role cookie.
const ADMIN_ROLES = appConstants.ADMIN_ROLES.map((r) => r.toLowerCase());

export function middleware(req: NextRequest) {
	const { pathname, search } = req.nextUrl;
	const hasToken = Boolean(req.cookies.get(AUTH_COOKIES.accessToken)?.value);
	const role = req.cookies.get(AUTH_COOKIES.role)?.value;

	// Not logged in → send to login, preserving where they were headed.
	if (!hasToken) {
		const target = safeRedirectTarget(pathname + search);
		const loginUrl = req.nextUrl.clone();
		loginUrl.pathname = "/login";
		loginUrl.search = target === "/" ? "" : `?redirect=${encodeURIComponent(target)}`;
		return NextResponse.redirect(loginUrl);
	}

	// Admin area requires an admin-tier role.
	if (pathname.startsWith("/admin")) {
		if (!role || !ADMIN_ROLES.includes(role)) {
			const homeUrl = req.nextUrl.clone();
			homeUrl.pathname = "/";
			homeUrl.search = "";
			return NextResponse.redirect(homeUrl);
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/admin/:path*",
		"/profile",
		"/my-orders/:path*",
		"/checkout",
		"/order-confirmation/:path*",
	],
};
