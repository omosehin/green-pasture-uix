import { Product } from "@/types";

/**
 * Maps a raw backend Item (as returned nested under `photos`, `ratingStats`,
 * `product`, etc.) into the frontend `Product` shape. Same mapping as
 * products.reducer.ts's private `transformApiProduct` — pulled out here so
 * new wishlist code has one shared implementation to import instead of
 * writing a fourth near-duplicate copy (cart.reducer.ts's
 * syncCartOnLoginAsync handler has its own inline version too).
 */
export const mapBackendItemToProduct = (item: any): Product => {
	return {
		id: String(item.id),
		name: item.name || "",
		price: Number(item.price || 0),
		originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
		image: item.photos?.[0]?.url || item.image || "",
		category: item.product?.name || item.category || "",
		description: item.description || "",
		quantity: Number(item.unit || item.quantity || 0),
		inStock: (item.unit || item.quantity || 0) > 0,
		rating: item.ratingStats?.average || item.rating || 0,
		reviews: item.ratingStats?.count || item.reviews || 0,
		weightValue: item.weightValue ?? null,
		weightUnit: item.weightUnit ?? null,
	};
};
