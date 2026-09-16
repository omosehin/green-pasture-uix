import { AdminState, AdminStats, AdminUser, Order, PaginationMeta, Product, ProductCategory } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { adminAction } from "../actions/admin.action";

const initialState: AdminState & {
	ordersLoading: boolean;
	ordersPagination: PaginationMeta | null;
	customersLoading: boolean;
	customersPagination: PaginationMeta | null;
	staffList: any[];
	staffLoading: boolean;
	staffPagination: PaginationMeta | null;
	adminItems: any[];
	adminItemsLoading: boolean;
	adminItemsPagination: PaginationMeta | null;
} = {
	isAuthenticated: false,
	user: null,
	stats: {
		totalProducts: 0,
		totalOrders: 0,
		totalCustomers: 0,
		totalRevenue: 0,
		ordersToday: 0,
		revenueToday: 0,
		lowStockProducts: 0,
		pendingOrders: 0,
	},
	salesData: [],
	orders: [],
	customers: [],
	selectedProduct: null,
	selectedCategory: null,
	selectedOrder: null,
	ordersLoading: false,
	ordersPagination: null,
	customersLoading: false,
	customersPagination: null,
	staffList: [],
	staffLoading: false,
	staffPagination: null,
	adminItems: [],
	adminItemsLoading: false,
	adminItemsPagination: null,
};

const adminSlice = createSlice({
	name: "admin",
	initialState,
	reducers: {
		login: (state, action: PayloadAction<AdminUser>) => {
			state.isAuthenticated = true;
			state.user = action.payload;
		},
		logout: (state) => {
			state.isAuthenticated = false;
			state.user = null;
		},
		updateOrderStatus: (
			state,
			action: PayloadAction<{ id: string; status: Order["status"] }>
		) => {
			const order = state.orders.find((o) => o.id === action.payload.id);
			if (order) {
				order.status = action.payload.status;
			}
		},
		selectProduct: (state, action: PayloadAction<Product>) => {
			state.selectedProduct = action.payload;
		},
		selectCategory: (state, action: PayloadAction<ProductCategory>) => {
			state.selectedCategory = action.payload;
		},
		selectOrder: (state, action: PayloadAction<Order>) => {
			state.selectedOrder = action.payload;
		},
		updateStats: (state, action: PayloadAction<Partial<AdminStats>>) => {
			state.stats = { ...state.stats, ...action.payload };
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch Orders
			.addCase(adminAction.fetchOrdersAsync.pending, (state) => {
				state.ordersLoading = true;
			})
			.addCase(adminAction.fetchOrdersAsync.fulfilled, (state, action) => {
				state.ordersLoading = false;
				state.orders = action.payload?.data?.items ?? [];
				state.ordersPagination = action.payload?.data?.meta ?? null;
			})
			.addCase(adminAction.fetchOrdersAsync.rejected, (state) => {
				state.ordersLoading = false;
			})
			// Cancel Order
			.addCase(adminAction.cancelOrderAsync.fulfilled, (state, action) => {
				const orderId = action.payload.orderId;
				const order = state.orders.find((o: any) => o.id === orderId);
				if (order) {
					(order as any).orderStatus = "CANCELLED";
				}
			})
			// Fetch Customers
			.addCase(adminAction.fetchCustomersAsync.pending, (state) => {
				state.customersLoading = true;
			})
			.addCase(adminAction.fetchCustomersAsync.fulfilled, (state, action) => {
				state.customersLoading = false;
				state.customers = action.payload?.data?.items ?? [];
				state.customersPagination = action.payload?.data?.meta ?? null;
			})
			.addCase(adminAction.fetchCustomersAsync.rejected, (state) => {
				state.customersLoading = false;
			})
			// Delete Customer
			.addCase(adminAction.deleteCustomerAsync.fulfilled, (state, action) => {
				const id = action.payload.customerId;
				state.customers = state.customers.filter((c: any) => c.id !== id);
			})
			// Update Customer Status
			.addCase(adminAction.updateCustomerStatusAsync.fulfilled, (state, action) => {
				const { customerId, activate } = action.payload;
				const customer = state.customers.find((c: any) => c.id === customerId);
				if (customer) {
					(customer as any).status = activate ? "A" : "I";
				}
			})
			// Fetch Staff
			.addCase(adminAction.fetchStaffAsync.pending, (state) => {
				state.staffLoading = true;
			})
			.addCase(adminAction.fetchStaffAsync.fulfilled, (state, action) => {
				state.staffLoading = false;
				state.staffList = action.payload?.data?.items ?? [];
				state.staffPagination = action.payload?.data?.meta ?? null;
			})
			.addCase(adminAction.fetchStaffAsync.rejected, (state) => {
				state.staffLoading = false;
			})
			// Update Staff Status
			.addCase(adminAction.updateStaffStatusAsync.fulfilled, (state, action) => {
				const { staffId, activate } = action.payload;
				const staff = state.staffList.find((s: any) => s.id === staffId);
				if (staff) {
					(staff as any).status = activate ? "ACTIVE" : "INACTIVE";
				}
			})
			// Delete Staff
			.addCase(adminAction.deleteStaffAsync.fulfilled, (state, action) => {
				const id = action.payload.staffId;
				state.staffList = state.staffList.filter((s: any) => s.id !== id);
			})
			// Update Item Status
			.addCase(adminAction.updateItemStatusAsync.fulfilled, (state, action) => {
				const { itemId, activate } = action.payload;
				const item = state.adminItems.find((i: any) => i.id === itemId);
				if (item) {
					(item as any).status = activate ? "A" : "I";
				}
			})
			// Fetch Admin Items
			.addCase(adminAction.fetchAdminItemsAsync.pending, (state) => {
				state.adminItemsLoading = true;
			})
			.addCase(adminAction.fetchAdminItemsAsync.fulfilled, (state, action) => {
				state.adminItemsLoading = false;
				state.adminItems = action.payload?.data?.items ?? [];
				state.adminItemsPagination = action.payload?.data?.meta ?? null;
			})
			.addCase(adminAction.fetchAdminItemsAsync.rejected, (state) => {
				state.adminItemsLoading = false;
			})
			// Update Staff
			.addCase(adminAction.updateStaffAsync.fulfilled, (state, action) => {
				const updated = action.payload?.data;
				if (updated) {
					const index = state.staffList.findIndex((s: any) => s.id === updated.id);
					if (index !== -1) {
						state.staffList[index] = updated;
					}
				}
			});
	},
});

export const {
	login,
	logout,
	updateOrderStatus,
	selectProduct,
	selectCategory,
	selectOrder,
	updateStats,
} = adminSlice.actions;
export default adminSlice.reducer;
