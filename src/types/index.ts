export interface ProductCategory{
id: string;
name: string;
description:string
}

export interface PaginatedProducts {
  items: ProductCategory[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface UpdateCategoryPayload {
  id: string | null;
  name: string;
  description: string;
}


export interface Product {
	id: string;
	name: string;
	price: number;
	originalPrice?: number;
	image: string;
	category: string;
	description: string;
	quantity: number;
	inStock: boolean;
	rating: number;
	reviews: number;
	/** Pack size as printed on the label — 250 + "g", 50 + "tabs". */
	weightValue?: number | null;
	weightUnit?: string | null;
	/** True on at most one size within a pack-size group — the merchant's chosen representative. */
	isDefault?: boolean;
	tags?: Tag[];
}

/** Who a product suits. Assigned by admins, browsable at /products?tag=slug. */
export interface Tag {
	id: string;
	name: string;
	slug: string;
	description?: string;
	status?: string;
	createdAt?: string;
	updatedAt?: string;
	createdBy?: string;
	updatedBy?: string;
}

export interface CategoriesState {
  isFetchingAllCategories: boolean;
  isFetchingCategory: boolean;
  isCreatingCategory: boolean;
  isUpdatingCategory: boolean;
  isDeletingCategory:boolean;
  productCategories: ProductCategory[];
  pagination?: PaginatedProducts["meta"];
  categories?: string[];
  selectedCategory?: string;
  searchTerm: string;
  error: string | null;
}

export interface ProductsState {
	isFetchingAllProducts: boolean;
	isFetchingProduct: boolean;
	/** Set when fetchAllProducts rejects; cleared on the next attempt. Distinguishes "fetch failed" from "genuinely no products" so a transient failure never renders as a permanent empty shelf. */
	fetchAllProductsError: string | null;
	products: Product[];
	product: Product | null;
	categories: string[];
	selectedCategory: string;
	searchTerm: string;
}

export interface CartItem extends Product {
	quantity: number;
	createdAt: number;
}

export interface Customer {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	totalSpent: number;
	address: {
		street: string;
		city: string;
		state: string;
		zipCode: string;
		country: string;
	};
	lastOrderDate: string;
	totalOrders: number;
}

export interface Address {
	street: string;
	city: string;
	state: string;
	zipCode: string;
	country: string;
}

export interface Order {
	id: string;
	customer: Customer;
	shippingAddress: Address;
	billingAddress: Address;
	items: CartItem[];
	subtotal: number;
	shipping: number;
	tax: number;
	total: number;
	status: "pending" | "confirmed" | "shipped" | "delivered";
	createdAt: string;
}

// Define the IP info structure
export interface IpInfo {
	ip: string;
	hostname?: string;
	city?: string;
	region?: string;
	country?: string;
	loc?: string;
	org?: string;
	postal?: string;
	timezone?: string;
	[key: string]: any; // For any extra fields from IPInfo API
}

export interface User {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role?: string;
	roles?: Array<{ id: string; name: string; permissions?: BackendPermission[] }>;
	isVerified: boolean;
	createdAt: string;

	createdBy: string;
	gender: string;
	phoneNumber: string;
	profileStatus: string;
	profileType: string;
	status: string;
	updatedAt: string;
	updatedBy: string;
}

export interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
}

export interface BioProp {
	isLoading: boolean;
	bio: User | null;
}

export interface CartState {
	items: CartItem[];

	total: number;
	error: string | null;
	appliedCoupons: string[];
	discountAmount: number;
	loading: boolean;
	itemCount: number;
	taxRate: number;
	lastUpdated: number | null;
}

export interface AdminUser {
	id: string;
	username: string;
	email: string;
	role: "admin" | "manager" | "editor";
	lastLogin: string;
}

export interface AdminStats {
	totalProducts: number;
	totalOrders: number;
	totalCustomers: number;
	totalRevenue: number;
	ordersToday: number;
	revenueToday: number;
	lowStockProducts: number;
	pendingOrders: number;
}

export interface SalesData {
	date: string;
	sales: number;
	orders: number;
}

export interface AdminState {
	isAuthenticated: boolean;
	user: AdminUser | null;
	stats: AdminStats;
	salesData: SalesData[];
	orders: any[];
	customers: any[];
	selectedProduct: Product | null;
	selectedCategory: ProductCategory | null;
	selectedOrder: any | null;
}

type NotificationType = "success" | "error";

export interface StatusModalProps {
	isOpen: boolean;
	onClose: () => void;
	type: NotificationType;
	title: string;
	message: string;
	autoClose?: boolean;
	autoCloseDelay?: number;
}

// ─── API Response Types ─────────────────────────────────────────────────

export interface ApiResponse<T> {
	message: string;
	data: T | null;
}

export interface PaginationMeta {
	totalItems: number;
	itemCount: number;
	itemsPerPage: number;
	totalPages: number;
	currentPage: number;
}

export interface PaginationLinks {
	first: string;
	previous: string;
	next: string;
	last: string;
}

export interface PaginatedData<T> {
	items: T[];
	meta: PaginationMeta;
	links: PaginationLinks;
}

// ─── Backend Entity Types ───────────────────────────────────────────────

export interface BackendItem {
	category: string;
	id: string;
	name: string;
	description?: string;
	price: number;
	originalPrice?: number | null;
	onSale?: boolean;
	discountPercent?: number | null;
	unit: number;
	weightValue?: number | null;
	weightUnit?: string | null;
	isDefault?: boolean;
	product?: { id: string; name: string };
	photos?: { id: string; url: string; publicId: string; isThumbnail?: boolean }[];
	ratingStats?: { average: number; count: number };
	reviews?: BackendReview[];
	status: string;
	createdAt: string;
	updatedAt: string;
}

export interface BackendReview {
	id: string;
	rating: number;
	comment?: string;
	customer: string;
	customerImage?: string;
	/** Curated by a moderator to lead the marketing pages. */
	featured?: boolean;
	itemImage?: string;
	item?: BackendItem;
	status: string;
	createdAt: string;
	updatedAt: string;
}

export interface BackendOrder {
	id: string;
	orderReference: string;
	orderStatus: OrderStatusType;
	customer?: BackendCustomer;
	items?: BackendOrderItem[];
	totalAmount: number;
	status: string;
	createdAt: string;
	updatedAt: string;
}

export interface BackendOrderItem {
	id: string;
	item: BackendItem;
	quantity: number;
	unitPrice: number;
	itemName?: string | null;
	weightValue?: number | null;
	weightUnit?: string | null;
}

export interface BackendCustomer {
	id: string;
	referrerCode?: string;
	profile: ProfileData;
	status: string;
	createdAt: string;
	updatedAt: string;
}

export interface BackendStaff {
	id: string;
	profile: ProfileData;
	status: string;
	createdAt: string;
	updatedAt: string;
}

export interface ProfileData {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phoneNumber?: string;
	gender?: string;
	profileStatus?: string;
	profileType?: string;
	profileImage?: { url: string; publicId: string };
	address?: ShippingAddress;
	status?: string;
	createdAt?: string;
	updatedAt?: string;
	roles?: Array<{ id: string; name: string; permissions?: BackendPermission[] }>;
}

export interface ShippingAddress {
	street: string;
	city: string;
	state: string;
	country: string;
	postalCode: string;
}

export type OrderStatusType =
	| "PENDING"
	| "PROCESSING"
	| "SHIPPED"
	| "DELIVERED"
	| "CANCELLED";

// Shipping methods are admin-configurable (store settings), so the backend
// accepts any configured method id as a plain string — not a fixed set.
export type ShippingMethodType = string;

export type PaymentMethodType = "CARD" | "CASH_ON_DELIVERY" | "WALLET";

// ─── Extended State Types ───────────────────────────────────────────────

export interface CheckoutState {
	orderId: string | null;
	paymentUrl: string | null;
	paymentReference: string | null;
	paymentStatus: "idle" | "pending" | "success" | "failed";
	isCheckingOut: boolean;
	isPlacingOrder: boolean;
	isVerifying: boolean;
	error: string | null;
}

export interface ReviewState {
	reviews: BackendReview[];
	pagination: PaginationMeta | null;
	/** Public highlight reel for the home page — paged in and appended, not replaced. */
	testimonials: BackendReview[];
	testimonialsPagination: PaginationMeta | null;
	isLoadingTestimonials: boolean;
	isLoading: boolean;
	isSubmitting: boolean;
	error: string | null;
}

export interface ProfileState {
	profile: ProfileData | null;
	isLoading: boolean;
	isUpdating: boolean;
	error: string | null;
}

export interface BackendRole {
	id: string;
	name: string;
	description: string;
	permissions: BackendPermission[];
	status: string;
	createdAt: string;
	updatedAt?: string;
	createdBy?: string;
	updatedBy?: string;
}

export interface BackendPermission {
	id: string;
	name: string;
	description: string;
	status: string;
}

export interface BackendCountry {
	id: string;
	name: string;
	code: string;
	// TypeORM decimal columns serialize as strings — never assume `number`.
	priceFactor: string | number;
	currencyCode: string;
	shippingEnabled: boolean;
	status: string;
}
