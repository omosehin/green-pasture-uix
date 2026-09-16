"use client";

import React, { MouseEvent, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ShoppingCart, Heart, XCircle, Trash2, Check } from "lucide-react";
import { Product } from "../types";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/_redux/store";
import { useCurrency } from "@/_hooks/useCurrency";
import { removeFromCart } from "@/_redux/reducers/cart.reducer";
import { addToCartAsync, removeFromCartAsync } from "@/_redux/actions/cart.action";
import Link from "next/link";
import {
	addToWishlist,
	removeFromWishlist,
} from "@/_redux/reducers/wishlist.reducer";
import {
	addToWishlistAsync,
	removeFromWishlistAsync,
} from "@/_redux/actions/wishlist.action";
import { usePathname } from "next/navigation";
import { appConstants } from "@/_redux/constants";
import { htmlToText } from "@/_utils/htmlToText";
import { variantSummary } from "@/_utils/variantSummary";
import { formatWeight } from "@/_utils/formatWeight";

interface ProductCardProps {
	product: Product;
}

const ADMIN_ROLES: readonly string[] = appConstants.ADMIN_ROLES;

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
	const pathname = usePathname();
	const dispatch = useAppDispatch();
	const { formatPrice } = useCurrency();
	const { user } = useAppSelector((state) => state.auth);
	const isAdmin = ADMIN_ROLES.includes(user?.profileType?.toUpperCase() || "");
	const isWishlistPage = pathname === "/wishlist";
	const cartItems = useAppSelector((state) => state.cart.items);
	const isInCart = cartItems.some((item) => item.id === product.id);
	const wishlistItems = useAppSelector((state) => state.wishlist.items);
	const isInWishlist = wishlistItems?.some((item) => item.id === product.id);
	const [justAdded, setJustAdded] = useState(false);
	// A multi-size card leads with "Add to Cart" and only asks which size once
	// the customer has said they want it -- "Choose size" as the resting label
	// read as a detour rather than a purchase.
	const [choosingSize, setChoosingSize] = useState(false);

	// Backend item shape adaptation
	const p = product as any;
	const imageUrl = p.photos?.[0]?.url || p.image || "";
	const rating = p.ratingStats?.average ?? p.rating ?? 0;
	const reviewCount = p.ratingStats?.count ?? p.reviews ?? 0;
	const inStock = p.unit > 0 || p.inStock;
	const price = Number(p.price || 0);
	// `variants` is present only when the card came through groupVariants. A
	// card rendered from a raw item (wishlist, cart) keeps its single size.
	const { variants, packSize, priceVaries, lowestPrice } = variantSummary(p);
	// Admin kill-switch: hide the sale treatment site-wide without touching the
	// stored originalPrice, so it can be switched back on unchanged.
	const showDiscount = useAppSelector((state) => state.settings.showDiscountBadges);
	const originalPrice =
		showDiscount && p.originalPrice ? Number(p.originalPrice) : null;
	const discount = originalPrice && originalPrice > price
		? Math.round(((originalPrice - price) / originalPrice) * 100)
		: null;

	const flashAdded = (name: string) => {
		setJustAdded(true);
		toast.success(`${name} added to cart`);
		setTimeout(() => setJustAdded(false), 1500);
	};

	const handleAddToCart = () => {
		if (isInCart) {
			dispatch(removeFromCart(product.id));
			dispatch(removeFromCartAsync(product.id));
			toast.error(`${product.name} removed from cart`);
		} else {
			// addToCartAsync, not the bare reducer: it applies the same local add
			// and, for a signed-in customer, writes the line to the server cart.
			// Adding locally only meant the next cart sync replaced the item with
			// the (empty) server cart and it vanished.
			dispatch(addToCartAsync(product));
			flashAdded(product.name);
		}
	};

	const handleAddVariant = (variant: any) => {
		dispatch(addToCartAsync(variant));
		setChoosingSize(false);
		flashAdded(`${variant.name}${formatWeight(variant.weightValue, variant.weightUnit) ? ` (${formatWeight(variant.weightValue, variant.weightUnit)})` : ""}`);
	};

	const handleWishlistToggle = (e: MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		e.preventDefault();
		// Local update first — always succeeds, so the toast (and the heart icon,
		// driven by the same state) reflect what actually happened. The *Async
		// thunk below is a fire-and-forget background sync to the backend; same
		// "optimistic local, silent background sync" split useCartOperations
		// uses for cart, so a network failure (e.g. a 429) can't make the toast
		// claim success while the heart never fills in.
		if (isInWishlist) {
			dispatch(removeFromWishlist(product.id));
			dispatch(removeFromWishlistAsync(product.id));
			toast.error(`${product.name} removed from wishlist`);
		} else {
			dispatch(addToWishlist(product));
			dispatch(addToWishlistAsync(product));
			toast.success(`${product.name} added to wishlist`);
		}
	};

	return (
		<motion.div
			layout
			className="group relative flex h-full flex-col"
			whileHover={{ y: -4, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
		>
			{/* Image */}
			<Link href={`/product/${product?.id}`}>
				{/* Square, not 4:5. Shots are contained rather than cropped, so a
				    portrait box letterboxed every landscape photo with dead space
				    above and below it. Square splits the difference for both. */}
				<div
					className="relative aspect-square overflow-hidden rounded-xl transition-shadow duration-300 group-hover:shadow-[0_18px_40px_-20px_rgba(12,43,37,0.45)]"
					style={{ background: "var(--surface-tile)" }}
				>
					{imageUrl ? (
						<Image
							src={imageUrl}
							alt={product.name}
							fill
							sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
							className="object-contain p-2.5 transition-transform duration-700 ease-out group-hover:scale-105 sm:p-3"
						/>
					) : (
						<div
							className="w-full h-full flex items-center justify-center text-4xl font-bold"
							style={{ color: "var(--text-disabled)" }}
						>
							{product.name?.charAt(0)?.toUpperCase()}
						</div>
					)}

					{/* Gradient overlay on hover */}
					<div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

					{/* Out of stock overlay */}
					{!inStock && (
						<div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
							<span className="text-white text-xs font-semibold px-3 py-1.5 rounded-full bg-red-500/90 shadow-lg">
								Out of Stock
							</span>
						</div>
					)}

					{/* Discount badge */}
					{discount && discount > 0 && (
						<motion.div
							initial={{ scale: 0, rotate: -12 }}
							animate={{ scale: 1, rotate: 0 }}
							className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[0.6rem] font-bold text-white"
							style={{ background: "#ef4444" }}
						>
							-{discount}%
						</motion.div>
					)}

					{/* Wishlist button — hidden on the wishlist page itself, which already
					    has a dedicated trash button for removal below. */}
					{!isWishlistPage && (
						<motion.button
							aria-label="Wishlist"
							onClick={(e) => handleWishlistToggle(e)}
							// Always visible, and readable on any product shot. It used to
							// animate to opacity 0 unless the item was already wishlisted,
							// revealing itself on hover -- which meant it did not exist at
							// all on touch, where there is no hover. Even once shown, a
							// translucent white circle disappeared into the plain white
							// backgrounds most of the catalogue now uses, so the fill is
							// opaque and carries a border and shadow of its own.
							className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
							style={{
								background: isInWishlist ? "rgba(239,68,68,0.95)" : "var(--surface-high, #fff)",
								color: isInWishlist ? "#fff" : "var(--text-secondary)",
								border: `1px solid ${isInWishlist ? "rgba(239,68,68,0.95)" : "var(--border-light)"}`,
								boxShadow: "0 2px 8px rgba(12,43,37,0.18)",
							}}
							initial={false}
							animate={{ opacity: 1, scale: 1 }}
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.85 }}
						>
							<Heart className={`h-4 w-4 ${isInWishlist ? "fill-current" : ""}`} />
						</motion.button>
					)}

					{/* Quick view on hover — bottom of image */}
					<div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
						<div className="text-center text-[0.65rem] font-medium py-2 rounded-full backdrop-blur-md bg-white text-primary-700 hover:bg-primary-50 hover:shadow-[0_0_12px_rgba(154,202,60,0.5)] dark:hover:shadow-[0_0_10px_rgba(154,202,60,0.25)] transition-all">
							View Details →
						</div>
					</div>
				</div>
			</Link>

			{/* Details */}
			<div className="flex flex-1 flex-col justify-between pt-3">
				{/* Top Info */}
				<div className="flex flex-col">
					<Link href={`/product/${product.id}`} className="block">
						<h3
							className="font-display text-[0.95rem] leading-snug line-clamp-2 min-h-[2.6rem] mb-1 transition-colors hover:text-primary-600 dark:hover:text-primary-400"
							style={{ color: "var(--text-primary)", fontWeight: 500 }}
						>
							{product.name}
						</h3>
					</Link>

					{/* Pack size sits with the name */}
					<div className="min-h-[1.1rem] mb-1">
						{packSize ? (
							<p className="text-[0.7rem] font-medium" style={{ color: "var(--text-secondary)" }}>
								{packSize}
							</p>
						) : null}
					</div>

					<p
						className="text-[0.7rem] line-clamp-2 leading-relaxed min-h-[2.1rem] mb-2"
						style={{ color: "var(--text-hint)" }}
					>
						{htmlToText(product.description)}
					</p>

					{/* Rating — consistent height container so cards with/without reviews stay aligned */}
					<div className="flex items-center gap-1.5 min-h-[1.25rem] mb-2">
						{reviewCount > 0 ? (
							<>
								<div className="flex items-center gap-px">
									{[...Array(5)].map((_, i) => (
										<Star
											key={i}
											className={`h-3 w-3 ${i < Math.floor(rating) ? "text-amber-400 fill-amber-400" : ""}`}
											style={i >= Math.floor(rating) ? { color: "var(--text-disabled)" } : undefined}
										/>
									))}
								</div>
								<span className="text-[0.6rem] tabular-nums" style={{ color: "var(--text-hint)" }}>
									{Number(rating).toFixed(1)} ({reviewCount})
								</span>
							</>
						) : null}
					</div>
				</div>

				{/* Bottom Section: Price + Action Button (Anchored to baseline) */}
				<div className="mt-auto flex flex-col justify-end pt-2">
					<div className="mb-2.5 min-h-[1.75rem] flex flex-col justify-center">
						<div className="font-display text-lg leading-tight tabular-nums" style={{ color: "var(--text-primary)", fontWeight: 500 }}>
							{priceVaries && (
								<span className="mr-1 text-[0.7rem] font-normal align-middle" style={{ color: "var(--text-hint)" }}>
									from
								</span>
							)}
							{formatPrice(priceVaries ? lowestPrice : price)}
						</div>
						{!priceVaries && originalPrice && originalPrice > price && (
							<div className="mt-0.5 text-xs line-through tabular-nums" style={{ color: "var(--text-disabled)" }}>
								{formatPrice(originalPrice)}
							</div>
						)}
					</div>

					{/* Actions */}
					<div className="flex items-center gap-2">
						{isAdmin ? (
							<Link
								href={`/product/${product.id}`}
								className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-semibold border border-outline dark:border-white/15 text-primary-700 dark:text-primary-400 hover:bg-primary-50 hover:shadow-[0_0_12px_rgba(154,202,60,0.5)] dark:hover:bg-white/5 dark:hover:shadow-[0_0_10px_rgba(154,202,60,0.25)] transition-all"
							>
								View Details
							</Link>
						) : variants.length > 0 && choosingSize && !justAdded ? (
							<motion.div
								key="sizes"
								initial={{ opacity: 0, y: 4 }}
								animate={{ opacity: 1, y: 0 }}
								className="flex-1"
							>
								<div className="mb-1.5 flex items-center justify-between">
									<span className="text-[0.6rem] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-hint)" }}>
										Choose size
									</span>
									<button
										type="button"
										onClick={() => setChoosingSize(false)}
										aria-label="Cancel size selection"
										className="text-[0.6rem] font-medium cursor-pointer"
										style={{ color: "var(--text-hint)" }}
									>
										Cancel
									</button>
								</div>
								<div className="flex flex-wrap gap-1.5">
									{variants.map((variant: any) => {
										const soldOut = !(Number(variant.unit) > 0);
										return (
											<button
												key={variant.id}
												type="button"
												disabled={soldOut}
												onClick={() => handleAddVariant(variant)}
												className={`rounded-full px-2.5 py-1.5 text-[0.65rem] font-semibold transition-all ${soldOut ? "cursor-not-allowed line-through opacity-45" : "cursor-pointer hover:bg-primary-50 dark:hover:bg-white/5"}`}
												style={{
													border: "1px solid var(--border-light)",
													color: "var(--text-primary)",
												}}
											>
												{formatWeight(variant.weightValue, variant.weightUnit) || "One size"}
											</button>
										);
									})}
								</div>
							</motion.div>
						) : (
						<AnimatePresence mode="wait">
							{justAdded ? (
								<motion.div
									key="added"
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.8 }}
									className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-semibold"
									style={{ background: "rgba(154,202,60,0.14)", color: "var(--color-primary)" }}
								>
									<Check className="h-3.5 w-3.5" />
									Added!
								</motion.div>
							) : isInCart && variants.length === 0 ? (
								<motion.button
									key="remove"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									onClick={handleAddToCart}
									className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer"
									style={{ border: "1px solid #ef4444", color: "#ef4444" }}
									whileTap={{ scale: 0.95 }}
								>
									<XCircle className="h-3.5 w-3.5" />
									Remove
								</motion.button>
							) : (
								<motion.button
									key="add"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									onClick={variants.length > 0 ? () => setChoosingSize(true) : handleAddToCart}
									disabled={!inStock}
									className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-xs hover:shadow-md"
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.95 }}
								>
									<ShoppingCart className="h-3.5 w-3.5" />
									{inStock ? "Add to Cart" : "Out of Stock"}
								</motion.button>
							)}
						</AnimatePresence>
						)}

						{isWishlistPage && !isAdmin && (
							<motion.button
								onClick={() => {
									dispatch(removeFromWishlist(product.id));
									dispatch(removeFromWishlistAsync(product.id));
								}}
								className="p-2.5 rounded-full cursor-pointer"
								style={{ border: "1px solid #ef4444", color: "#ef4444" }}
								whileTap={{ scale: 0.9 }}
								aria-label="Remove from wishlist"
							>
								<Trash2 className="h-3.5 w-3.5" />
							</motion.button>
						)}
					</div>
				</div>
			</div>
		</motion.div>
	);
};

export default ProductCard;
