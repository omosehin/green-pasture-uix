import { useAppSelector } from "@/_redux/store";

/** Permission names granted by every role the signed-in user holds. */
export function useAuthorities(): string[] {
	const user = useAppSelector((s) => s.auth.user);
	const names = (user?.roles ?? []).flatMap((r) => r.permissions ?? []).map((p) => p.name);
	return [...new Set(names)];
}

export function useHasPrivilege(): (name?: string) => boolean {
	const authorities = useAuthorities();
	// SUPER_ADMIN is a wildcard sentinel — see authority.guard.ts on the backend.
	const isSuperAdmin = authorities.includes("SUPER_ADMIN");
	return (name?: string) => !name || isSuperAdmin || authorities.includes(name);
}
