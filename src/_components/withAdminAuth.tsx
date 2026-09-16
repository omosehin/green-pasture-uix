import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAppSelector } from "@/_redux/store";
import PageLoader from "@/_UI/PageLoader";
import { appConstants } from "@/_redux/constants";
import { loginUrlFor } from "@/_utils/redirect";

const ADMIN_ROLES: readonly string[] = appConstants.ADMIN_ROLES;

/**
 * Client-side admin guard. `middleware.ts` is the primary, server-side gate
 * (it runs before this component is ever sent to the browser); this HOC is
 * defense-in-depth and handles client-side navigation. Auth state is read
 * synchronously from the store — no rehydration timers — because PersistGate
 * blocks render until the persisted state is available.
 */
export default function withAdminAuth<P extends object>(
	WrappedComponent: React.ComponentType<P>
) {
	const WithAdminAuthComponent = (props: P) => {
		const router = useRouter();
		const { isAuthenticated, user } = useAppSelector((state) => state.auth);

		const userRole = user?.profileType?.toUpperCase();
		const authorized =
			isAuthenticated && !!userRole && ADMIN_ROLES.includes(userRole);
		// Authenticated (per cookie) but the profile hasn't loaded yet — e.g.
		// AuthBootstrap's self-heal fetch is still in flight after a lost
		// persisted user. We don't yet know the role, so `authorized` reads
		// false; don't treat that as a verdict and bounce a valid admin — wait
		// until `user` actually resolves (or auth itself is false).
		const verified = !isAuthenticated || !!user;

		useEffect(() => {
			// Already heading to (or on) an auth page — don't re-wrap the path,
			// which would nest `/login?redirect=/login?redirect=…`.
			if (router.asPath.startsWith("/login") || router.asPath.startsWith("/signup")) {
				return;
			}
			if (!isAuthenticated) {
				router.replace(loginUrlFor(router.asPath));
			} else if (verified && !authorized) {
				router.replace("/");
			}
		}, [isAuthenticated, authorized, verified, router]);

		if (!authorized) {
			return <PageLoader message="Verifying access..." />;
		}

		return <WrappedComponent {...props} />;
	};

	WithAdminAuthComponent.displayName = `withAdminAuth(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

	return WithAdminAuthComponent;
}
