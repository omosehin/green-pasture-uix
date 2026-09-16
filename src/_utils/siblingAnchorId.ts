// `variantGroupId` is a GROUP id; the API's `variantOfItemId` is another ITEM's
// id, which it resolves to that item's group. The two are only ever the same
// uuid for the anchor of a picker-created group — a bulk-created group's id
// belongs to no item at all, so sending it back 404s and the save fails after
// the name/price write has already committed. Resolve it to a real sibling
// instead, out of the list the picker already fetched.
//
// Returns "" when nothing resolves — an ungrouped item, an empty or truncated
// candidate list. Callers must NOT read that as "detach": see the payload guard
// in the admin product page.
export const siblingAnchorId = (item: any, candidates: any[]): string => {
	if (!item?.variantGroupId) return "";
	const sibling = (candidates ?? []).find(
		(candidate: any) => candidate?.variantGroupId === item.variantGroupId && String(candidate.id) !== String(item.id),
	);
	return sibling?.id ?? "";
};
