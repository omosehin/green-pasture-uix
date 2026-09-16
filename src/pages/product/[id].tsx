import React, { MouseEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
	Star,
	ShoppingCart,
	Heart,
	Minus,
	Plus,
	Truck,
	Shield,
	ArrowLeft,
	Check,
	Info,
	XCircle,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/_redux/store";
import { removeFromCart } from "@/_redux/reducers/cart.reducer";
import { addToCartAsync, removeFromCartAsync, updateQuantityAsync } from "@/_redux/actions/cart.action";
import { Product } from "@/types";
import Products from "@/_components/Products";
import {
	addToWishlist,
	removeFromWishlist,
} from "@/_redux/reducers/wishlist.reducer";
import {
	addToWishlistAsync,
	removeFromWishlistAsync,
} from "@/_redux/actions/wishlist.action";
import Layout from "@/_components/Layout";
import { appConstants } from "@/_redux/constants";
import { useFreeShipping, useShowDiscountBadges } from "@/_hooks/useStoreSettings";
import Testimonials from "@/_components/Testimonials";
import ReviewList from "@/_components/ReviewList";
import ReviewForm from "@/_components/ReviewForm";
import Breadcrumb from "@/_UI/Breadcrumb";
import Card from "@/_UI/Card";
import Button from "@/_UI/Button";
import Badge from "@/_UI/Badge";
import EmptyState from "@/_UI/EmptyState";
import PageLoader from "@/_UI/PageLoader";
import SanitizedHtml from "@/_UI/SanitizedHtml";
import { formatWeight } from "@/_utils/formatWeight";
import { htmlToText } from "@/_utils/htmlToText";
import { groupVariants, variantGroupKey } from "@/_utils/groupVariants";

const ProductDetailsPage: React.FC = () => {
	const router = useRouter();
	const { id } = router.query;
	const dispatch = useAppDispatch();
	const { products, isFetchingAllProducts } = useAppSelector((state) => state.product);
	const cartItems = useAppSelector((state) => state.cart.items);
	const wishlistItems = useAppSelector((state) => state.wishlist.items);
	const cartTotal = useAppSelector((state) => state.cart.total);
	const freeShipping = useFreeShipping(cartTotal || 0);
	const showDiscountBadges = useShowDiscountBadges();
	const product = products?.find((p: Product) => String(p.id) === String(id));

	const [quantity, setQuantity] = useState(1);
	const [selectedImage, setSelectedImage] = useState(0);
	const [activeTab, setActiveTab] = useState("description");

	const p = product as any;
	const productCategory = p?.product?.name || p?.category || "";
	const relatedProducts = groupVariants(
		products.filter((pr: any) => {
			const cat = pr.product?.name || pr.category || "";
			// Exclude the whole group, not just this one size — otherwise the
			// product being viewed reappears in its own "related" strip.
			return cat === productCategory && variantGroupKey(pr) !== variantGroupKey(p);
		}),
	).slice(0, 4);

	// Every pack size of this product, smallest first — the chip order.
	const sizeVariants = products
		.filter((pr: any) => variantGroupKey(pr) === variantGroupKey(p))
		.sort((a: any, b: any) => Number(a.weightValue ?? 0) - Number(b.weightValue ?? 0));

	// A shallow route change never unmounts this component, so every piece of
	// local state survives a size switch. Both of these have to be told.
	//
	// selectedImage: sizes share one image set today, but a per-size photo
	// added later would leave this index pointing past the new array's end.
	// quantity: carrying 4 over to a size that only stocks 2 lets the add-to-
	// cart loop exceed that size's cap — handleQuantityChange only blocks
	// further increments, it never clamps a value already set.
	useEffect(() => {
		setSelectedImage(0);
		setQuantity(1);
	}, [id]);

	const cartItem = cartItems.find((item) => String(item.id) === String(id));
	const isInCart = !!cartItem;
	const isInWishlist = wishlistItems.some((item) => String(item.id) === String(id));

	if (!product && (isFetchingAllProducts || !products?.length)) {
		return (
			<Layout pageTitle="Loading Product...">
				<PageLoader fullScreen={false} message="Loading product details..." />
			</Layout>
		);
	}

	if (!product) {
		return (
			<Layout pageTitle="Product Not Found">
				<div className="container page-wrapper mx-auto px-4 py-16">
					<EmptyState
						icon={ShoppingCart}
						title="Product Not Found"
						description="The product you're looking for doesn't exist."
						actionLabel="Browse All Products"
						actionHref="/products"
					/>
				</div>
			</Layout>
		);
	}

	const handleCartToggle = async () => {
		if (isInCart) {
			dispatch(removeFromCart(product.id));
			dispatch(removeFromCartAsync(product.id));
			toast.error(`${product.name} removed from cart`);
		} else {
			// Add once, then set the quantity. The old loop dispatched the local
			// add N times, which was fine locally but would have written quantity
			// 1 to the server N times -- cart-item/create SETS the quantity, it
			// does not increment. Awaiting the add matters too: cart-item/update
			// 404s on a line the server does not have yet.
			await dispatch(addToCartAsync(product)).unwrap();
			if (quantity > 1) {
				dispatch(updateQuantityAsync({ id: product.id, quantity }));
			}
			toast.success(`${product.name} added to cart`);
		}
		setQuantity(1);
	};

	const handleQuantityChange = (newQuantity: number) => {
		if (newQuantity >= 1 && newQuantity <= itemMaxQuantity) {
			setQuantity(newQuantity);
		}
	};

	const handleWishlistToggle = (e: MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		// Local update first — always succeeds, so the toast reflects what
		// actually happened; the *Async thunk is a fire-and-forget background
		// sync, same split useCartOperations uses for cart.
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

	// Adapt to backend item shape
	const itemData = product as any;
	const productImages = itemData.photos?.length > 0
		? itemData.photos.map((photo: any) => photo.url)
		: itemData.image ? [itemData.image] : [];
	const itemRating = itemData.ratingStats?.average ?? itemData.rating ?? 0;
	const itemReviewCount = itemData.ratingStats?.count ?? itemData.reviews ?? 0;
	const itemInStock = itemData.unit > 0 || itemData.inStock;
	// Same admin kill-switch the cards honour — the detail page was reading
	// originalPrice raw, so it ignored the toggle entirely.
	const itemOriginalPrice = showDiscountBadges && itemData.originalPrice ? Number(itemData.originalPrice) : null;
	const packSize = formatWeight((itemData as any).weightValue, (itemData as any).weightUnit);
	const productTags: any[] = (itemData as any).tags ?? [];
	const itemPrice = Number(itemData.price || 0);
	const itemMaxQuantity = Number(itemData.availableQuantity) || Number(itemData.unit) || 10;

	const productFeatures: string[] = (itemData.features as string[]) ?? [];

	const detailsTab = ["description", "reviews"];

	return (
		<Layout pageTitle={product?.name}>
			<div className="container page-wrapper mx-auto px-4 py-8">
				{/* Breadcrumb */}
				<div className="mb-6">
					<Breadcrumb
						items={[
							{ label: "Home", href: "/" },
							{ label: "Products", href: "/products" },
							{
								label: productCategory || "Products",
								// Must match the category exactly as stored — filterAndSortProducts
								// compares with `===`, not case-insensitively — and be encoded, since
								// category names routinely contain "&" (e.g. "Herbal Teas & Infusions"),
								// which would otherwise split the query string.
								href: productCategory ? `/products?category=${encodeURIComponent(productCategory)}` : "/products",
							},
							{ label: product?.name },
						]}
					/>
				</div>

				<button
					onClick={() => router.back()}
					className="flex items-center space-x-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-8 transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					<span className="text-sm font-medium">Back to Products</span>
				</button>

				{/* Main Product Section */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
					{/* Image Column */}
					<div className="space-y-4">
						<Card elevation={1} padding="none" className="overflow-hidden">
							{/* contain, not cover: these are packaging shots — cropping a
							    pouch to a square hides the label people came to read. */}
							<div className="aspect-square bg-mint-100 p-6 dark:bg-white/[0.04]">
								<img
									src={productImages[selectedImage]}
									alt={product?.name}
									className="h-full w-full object-contain transition-transform duration-500 hover:scale-105"
								/>
							</div>
						</Card>

						<div className="flex space-x-3">
							{productImages.map((image: string, index: number) => (
								<button
									key={index}
									onClick={() => setSelectedImage(index)}
									className={`w-20 h-20 rounded-radius-md overflow-hidden border-2 transition-all ${
										selectedImage === index
											? "border-primary-600 dark:border-primary-400 shadow-elevation-1"
											: "border-outline-variant dark:border-white/15 hover:border-primary-300 dark:hover:border-primary-600"
									}`}
								>
									<img
										src={image}
										alt={`${product?.name} view ${index + 1}`}
										className="h-full w-full bg-mint-100 object-contain p-1 dark:bg-white/[0.04]"
									/>
								</button>
							))}
						</div>
					</div>

					{/* Info Column */}
					<div className="space-y-6">
						<div>
							<h1 className="text-2xl md:text-3xl font-bold text-on-surface dark:text-white mb-2">
								{product?.name}
							</h1>
							<p className="text-on-surface-variant dark:text-gray-400">{productCategory}</p>

							{sizeVariants.length > 1 ? (
								<div className="mt-3">
									<p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-hint)" }}>
										Pack size
									</p>
									<div className="flex flex-wrap gap-2">
										{sizeVariants.map((variant: any) => {
											const isSelected = String(variant.id) === String(id);
											const soldOut = !(Number(variant.unit) > 0);
											return (
												<button
													key={variant.id}
													type="button"
													disabled={soldOut}
													onClick={() =>
														// Shallow, so the whole page re-derives from the new
														// id without a refetch, and the chosen size stays in
														// the URL — shareable and reload-safe.
														//
														// replace, not push: a size chip is a selector, not
														// navigation. push would stack a history entry per
														// click, so trying three sizes would take three Back
														// presses to leave the product.
														router.replace(`/product/${variant.id}`, undefined, { shallow: true })
													}
													className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${soldOut ? "cursor-not-allowed line-through opacity-45" : "cursor-pointer"}`}
													style={{
														border: `1px solid ${isSelected ? "var(--color-primary)" : "var(--border-light)"}`,
														background: isSelected ? "rgba(154,202,60,0.16)" : "transparent",
														color: isSelected ? "var(--color-primary)" : "var(--text-primary)",
													}}
												>
													{formatWeight(variant.weightValue, variant.weightUnit) || "One size"}
												</button>
											);
										})}
									</div>
								</div>
							) : (
								packSize && (
									<p className="mt-1 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
										Pack size: {packSize}
									</p>
								)
							)}

							{/* Who it suits. Each chip links into the filtered listing. */}
							{productTags.length > 0 && (
								<div className="mt-3 flex flex-wrap gap-1.5">
									{productTags.map((tag: any) => (
										<Link
											key={tag.id}
											href={`/products?tag=${encodeURIComponent(tag.slug)}`}
											title={htmlToText(tag.description)}
											className="rounded-full px-2.5 py-1 text-[0.7rem] font-medium transition-colors"
											style={{ background: "rgba(154,202,60,0.16)", color: "var(--color-primary)" }}
										>
											{tag.name}
										</Link>
									))}
								</div>
							)}
						</div>

						{/* Rating */}
						<div className="flex items-center space-x-4">
							<div className="flex items-center space-x-1">
								{[...Array(5)].map((_, i) => (
									<Star
										key={i}
										className={`h-5 w-5 ${
											i < Math.floor(itemRating)
												? "text-amber-400 fill-amber-400"
												: "text-on-surface/30 dark:text-gray-600"
										}`}
									/>
								))}
							</div>
							<span className="text-lg font-medium text-on-surface dark:text-white">
								{itemRating}
							</span>
							<span className="text-on-surface-variant dark:text-gray-400">
								({itemReviewCount} reviews)
							</span>
						</div>

						{/* Price */}
						<div className="flex items-center space-x-4">
							<span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
								&#8358;{itemPrice.toLocaleString()}
							</span>
							{itemOriginalPrice && (
								<div className="flex items-center space-x-2">
									<span className="text-xl text-on-surface/50 dark:text-gray-500 line-through">
										&#8358;{itemOriginalPrice.toLocaleString()}
									</span>
									<Badge variant="error">
										Save &#8358;{(itemOriginalPrice - itemPrice).toLocaleString()}
									</Badge>
								</div>
							)}
						</div>

						{/* Badges */}
						<div className="flex flex-wrap gap-2">
							<Badge variant="success">Organic Certified</Badge>
							{itemInStock ? (
								<Badge variant="info">
									<Check className="h-3 w-3 mr-1" />
									In Stock
								</Badge>
							) : (
								<Badge variant="error">Out of Stock</Badge>
							)}
						</div>

						{/* Quantity & Actions */}
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-on-surface/80 dark:text-gray-300 mb-2">
									Quantity
								</label>
								<div className="flex items-center space-x-3">
									<button
										onClick={() => handleQuantityChange(quantity - 1)}
										className="p-2 border rounded-radius-md transition-colors disabled:opacity-50"
										style={{ borderColor: "var(--border-light)" }}
										disabled={quantity <= 1}
									>
										<Minus className="h-4 w-4 text-on-surface-variant dark:text-gray-300" />
									</button>
									<span className="text-xl font-semibold w-12 text-center text-on-surface dark:text-white">
										{quantity}
									</span>
									<button
										onClick={() => handleQuantityChange(quantity + 1)}
										className="p-2 border rounded-radius-md transition-colors disabled:opacity-50"
										style={{ borderColor: "var(--border-light)" }}
										disabled={quantity >= itemMaxQuantity}
									>
										<Plus className="h-4 w-4 text-on-surface-variant dark:text-gray-300" />
									</button>
								</div>
								{isInCart && (
									<p className="text-sm text-on-surface-variant dark:text-gray-400 mt-2">
										Already in cart
									</p>
								)}
							</div>

							<div className="flex space-x-4">
								{isInCart ? (
									<Button
										variant="outlined"
										color="error"
										size="lg"
										fullWidth
										leftIcon={XCircle}
										onClick={handleCartToggle}
									>
										Remove from Cart
									</Button>
								) : (
									<Button
										variant="filled"
										size="lg"
										fullWidth
										leftIcon={ShoppingCart}
										onClick={handleCartToggle}
										disabled={!itemInStock}
									>
										{itemInStock ? "Add to Cart" : "Out of Stock"}
									</Button>
								)}

								<button
									aria-label="Add to Wishlist"
									onClick={(e) => handleWishlistToggle(e)}
									className={`p-3 border rounded-radius-md transition-all cursor-pointer ${
										isInWishlist
											? "bg-red-500 border-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
											: ""
									}`}
									style={!isInWishlist ? { borderColor: "var(--border-light)" } : undefined}
								>
									<Heart
										className={`h-5 w-5 ${
											isInWishlist
												? "text-white fill-white"
												: "text-on-surface-variant dark:text-gray-300"
										}`}
									/>
								</button>
							</div>
						</div>

						{/* Features */}
						{productFeatures.length > 0 && (
							<div className="space-y-3">
								<h3 className="font-semibold text-on-surface dark:text-white">
									Product Features:
								</h3>
								<ul className="space-y-2">
									{productFeatures.map((feature, index) => (
										<li
											key={index}
											className="flex items-center space-x-2 text-sm text-on-surface-variant dark:text-gray-400"
										>
											<Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
											<span>{feature}</span>
										</li>
									))}
								</ul>
							</div>
						)}

						{/* Shipping Info */}
						<Card elevation={0} padding="md" className="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
							<div className="space-y-2">
								{freeShipping.isActive && (
									<div className="flex items-center space-x-2 text-primary-800 dark:text-primary-300">
										<Truck className="h-5 w-5 shrink-0" />
										<span className="font-medium">
											Free shipping on orders over &#8358;
											{freeShipping.threshold.toLocaleString()}
										</span>
									</div>
								)}
								<div className="flex items-center space-x-2 text-primary-700 dark:text-primary-400 text-sm">
									<Shield className="h-4 w-4" />
									<span>100% satisfaction guarantee</span>
								</div>
							</div>
						</Card>
					</div>
				</div>

				{/* Tabs Section */}
				<div className="mb-16">
					<div className="border-b border-outline-variant dark:border-white/15 relative">
						<nav className="flex space-x-8">
							{detailsTab.map((tab) => (
								<button
									key={tab}
									onClick={() => setActiveTab(tab)}
									className={`py-4 px-2 font-medium text-sm capitalize relative transition-colors ${
										activeTab === tab
											? "text-primary-600 dark:text-primary-400"
											: "text-on-surface-variant dark:text-gray-400 hover:text-on-surface/80 dark:hover:text-gray-300"
									}`}
								>
									{tab}
									{activeTab === tab && (
										<motion.div
											layoutId="tab-indicator"
											className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400"
											transition={{ type: "spring", stiffness: 400, damping: 30 }}
										/>
									)}
								</button>
							))}
						</nav>
					</div>

					<div className="py-8">
						{activeTab === "description" && (
							<Card elevation={0} padding="lg" className="dark:bg-white/[0.04]">
								<div className="prose max-w-none dark:prose-invert">
									<h3 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
										About this product
									</h3>
									{/* Stored as HTML by the admin editor, so it renders as
									    markup — sanitised, never raw. */}
									<SanitizedHtml
										html={product?.description}
										fallback={
											<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed">
												No description available.
											</p>
										}
									/>
								</div>
							</Card>
						)}

						{activeTab === "reviews" && (
							<div className="space-y-8">
								<h3 className="text-xl font-semibold text-on-surface dark:text-white">
									Customer Reviews
								</h3>
								<Card elevation={0} padding="lg" className="dark:bg-white/[0.04]">
									<ReviewList itemId={String(id)} />
								</Card>
								<Card elevation={0} padding="lg" className="dark:bg-white/[0.04]">
									<ReviewForm itemId={String(id)} />
								</Card>
							</div>
						)}
					</div>
				</div>

				{/* Quotes for this product specifically — outside the tabs, so they're
				    seen without a click. Renders nothing when this item has none. */}
				<Testimonials
					itemId={String(id)}
					inline
					eyebrow="Verified buyers"
					title="What people say"
					accent="about this one."
				/>

				{/* Related Products */}
				{relatedProducts?.length > 0 && (
					<div>
						<h2 className="text-2xl font-bold text-on-surface dark:text-white mb-8">
							Related Products
						</h2>
						<Products products={relatedProducts} />
					</div>
				)}
			</div>
		</Layout>
	);
};

export default ProductDetailsPage;
