// _utils/staffForm.ts
//
// The staff detail page lets an admin edit name/phone/roles together. The
// backend does a full replace (`profile.roles = roles`) whenever `roleIds`
// is present in the PATCH body — so sending it unconditionally would
// silently collapse a multi-role staff member down to whatever happens to
// be selected. Only include roleIds when the set actually changed from
// what was loaded from the server. Order must not count as a change.

export function resolveRoleIdsForPatch(currentRoleIds: string[], initialRoleIds: string[]): string[] | undefined {
	const current = new Set(currentRoleIds);
	const initial = new Set(initialRoleIds);
	const unchanged = current.size === initial.size && [...current].every((id) => initial.has(id));
	return unchanged ? undefined : currentRoleIds;
}
