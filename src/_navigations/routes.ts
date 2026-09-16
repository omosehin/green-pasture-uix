import {
	// BarChart3,
	LayoutDashboard,
	Package,
	Settings,
	Shield,
	ShoppingCart,
	UserRound,
	UserCog,
	ShoppingBasket
} from "lucide-react";

export const getPageNames = (link: string) => {
	switch (link) {
		case "/admin/dashboard":
			return "dashboard";
		case "/admin/category":
			return "categories";
		case "/admin/category/[id]":
			return "category";
		case "/admin/products":
			return "products";
		case "/admin/product/[id]":
			return "products";
		case "/admin/orders":
			return "orders";
		case "/admin/order/[id]":
			return "orders";
		case "/admin/customers":
			return "customers";
		case "/admin/customer/[id]":
			return "customers";
		case "/admin/staff":
			return "staff";
		case "/admin/staff/[id]":
			return "staff";
		case "/admin/roles":
			return "roles";
		case "/admin/role/[id]":
			return "roles";
		// case "/admin/analytics":
		// 	return "analytics";
		case "/admin/settings":
			return "settings";
		default:
			return "";
	}
};

export const sidebarNavigation = [
	{
		name: "Dashboard",
		href: "/admin/dashboard",
		icon: LayoutDashboard,
	},
	{
		name: "Category",
		href: "/admin/categories",
		icon: ShoppingBasket,
	},
	{
		name: "Products",
		href: "/admin/products",
		icon: Package,
	},
	{
		name: "Orders",
		href: "/admin/orders",
		icon: ShoppingCart,
		// badge: stats.pendingOrders,
	},
	{
		name: "Customers",
		href: "/admin/customers",
		icon: UserRound,
	},
	{
		name: "Staff",
		href: "/admin/staff",
		icon: UserCog,
	},
	{
		name: "Roles",
		href: "/admin/roles",
		icon: Shield,
	},
	// {
	// 	name: "Analytics",
	// 	href: "/admin/analytics",
	// 	icon: BarChart3,
	// },
	{
		name: "Settings",
		href: "/admin/settings",
		icon: Settings,
	},
];
