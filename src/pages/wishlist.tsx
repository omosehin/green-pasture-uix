import React, { useEffect } from "react";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/_redux/store";
import toast from "react-hot-toast";
import { Product } from "@/types";

import { clearWishlist, removeFromWishlist } from "@/_redux/reducers/wishlist.reducer";
import {
	removeFromWishlistAsync,
	clearWishlistAsync,
	syncWishlistOnLoginAsync,
} from "@/_redux/actions/wishlist.action";
import { addToCartAsync } from "@/_redux/actions/cart.action";
import Products from "@/_components/Products";
import Layout from "@/_components/Layout";
import EmptyState from "@/_UI/EmptyState";
import Button from "@/_UI/Button";
import Badge from "@/_UI/Badge";
import PageLoader from "@/_UI/PageLoader";

const WishlistPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const cartItems = useAppSelector((state) => state.cart.items);
	const { items, wishlistItemCount, loading } = useAppSelector(
		(state) => state.wishlist
	);
	const { isAuthenticated } = useAppSelector((state) => state.auth);

	// Backend is the source of truth once logged in — mirrors cart.tsx's
	// sync-on-mount pattern, since a customer's wishlist can now diverge from
	// whatever this browser's localStorage happens to hold.
	useEffect(() => {
		if (isAuthenticated) {
			dispatch(syncWishlistOnLoginAsync() as any);
		}
	}, [isAuthenticated, dispatch]);

	const handleClearWishlist = () => {
		// Local clear is instant; clearWishlistAsync is one DELETE /wishlist/clear
		// call in the background, rather than one DELETE per item (which used to
		// cost N write-rate-limit requests and could leave a stray item behind
		// on a failed individual delete).
		dispatch(clearWishlist());
		dispatch(clearWishlistAsync());
	};

	const handleAddAllToCart = () => {
		// Wishlist entries are raw backend items, which carry `unit` and not the
		// normalised `inStock` flag — checking `inStock` alone skipped every item
		// and the button did nothing. Same both-shapes check the cards use.
		const isInStock = (product: Product & { unit?: number }) =>
			(product.unit ?? 0) > 0 || product.inStock;

		let addedCount = 0;

		items.forEach((product) => {
			const isInCart = cartItems.some((item) => item.id === product.id);
			if (isInStock(product) && !isInCart) {
				dispatch(addToCartAsync(product));
				// Local removal first — the toast/count below is computed
				// synchronously, so the visible list must update in step with it
				// rather than waiting on the background sync thunk to resolve.
				dispatch(removeFromWishlist(product.id));
				dispatch(removeFromWishlistAsync(product.id));
				addedCount += 1;
			}
		});

		if (addedCount > 0) {
			toast.success(
				`${addedCount} ${addedCount === 1 ? "item" : "items"} added to cart`
			);
		} else {
			toast.error("Nothing to add — items are out of stock or already in your cart");
		}
	};

	if (loading && items.length === 0) {
		return (
			<Layout pageTitle="Wishlist">
				<PageLoader fullScreen={false} message="Loading your wishlist..." />
			</Layout>
		);
	}

	if (items.length === 0) {
		return (
			<Layout pageTitle="Wishlist">
				<div className="container page-wrapper mx-auto px-4 py-16">
					<EmptyState
						icon={Heart}
						title="Your Wishlist is Empty"
						description="Save your favorite products to your wishlist so you can easily find them later."
						actionLabel="Start Shopping"
						actionHref="/products"
					/>
				</div>
			</Layout>
		);
	}

	return (
		<Layout pageTitle="Wishlist">
			<div className="container page-wrapper mx-auto px-4 py-8">
				<div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
					<div>
						<h1 className="text-2xl md:text-3xl font-bold text-on-surface dark:text-white flex items-center gap-3">
							My Wishlist
							<Badge variant="neutral">{wishlistItemCount} {wishlistItemCount === 1 ? "item" : "items"}</Badge>
						</h1>
					</div>
					<div className="flex space-x-3 mt-4 md:mt-0">
						<Button
							variant="tonal"
							leftIcon={ShoppingCart}
							onClick={handleAddAllToCart}
						>
							Add All to Cart
						</Button>
						<Button
							variant="outlined"
							color="error"
							onClick={handleClearWishlist}
						>
							Clear Wishlist
						</Button>
					</div>
				</div>

				<Products products={items} />

				<div className="text-center mt-12">
					<Link href="/products">
						<Button variant="tonal" color="secondary" size="lg">
							Continue Shopping
						</Button>
					</Link>
				</div>
			</div>
		</Layout>
	);
};

export default WishlistPage;
