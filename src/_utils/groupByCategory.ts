/**
 * Group the catalogue into category shelves for the landing page. The category
 * is the parent product's name — the same value `/products?category=` filters
 * on — so each shelf's "See all items" link is just that URL.
 *
 * Insertion order is preserved, so shelves follow the API's ordering (newest
 * first) rather than being alphabetised behind the user's back.
 */
export function groupByCategory<T extends Record<string, any>>(products: T[] | undefined): [string, T[]][] {
	const shelves = new Map<string, T[]>();
	for (const p of products ?? []) {
		const category = p.product?.name || p.category || "Other";
		const shelf = shelves.get(category);
		if (shelf) shelf.push(p);
		else shelves.set(category, [p]);
	}
	return [...shelves.entries()];
}
