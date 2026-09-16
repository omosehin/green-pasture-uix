import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
	DollarSign,
	ShoppingCart,
	Users,
	TrendingUp,
	Package,
	Clock,
	Star,
	MessageCircle,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import withAdminAuth from "@/_components/withAdminAuth";
import AdminLayout from "@/_components/AdminLayout";
import PageLoader from "@/_UI/PageLoader";
import Badge from "@/_UI/Badge";
import { MetricCard, type MetricColor } from "@/_components/MetricCard";
import { ChartCard } from "@/_components/charts/chart-card";
import { TrendAreaChart } from "@/_components/charts/trend-area-chart";
import { BreakdownDonut } from "@/_components/charts/breakdown-donut";
import { TREND, statusColor } from "@/_components/charts/chart-colors";
import { DataTable } from "@/_components/DataTable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAppDispatch } from "@/_redux/store";
import { analyticsAction } from "@/_redux/actions/analytics.action";
import { formatCurrency, formatCurrencyFull, toDayBucket } from "@/_utils/format";
import { comparePeriods, lastDays, type Point } from "@/_utils/periodCompare";
import { RangeToggle } from "@/_UI/RangeToggle";

// Re-skin of the previous 657-line dashboard.tsx onto the ogaryde-ported chart
// system (ChartCard/TrendAreaChart/BreakdownDonut/MetricCard/DataTable). Every
// metric the old page showed is still here — see task-8-report.md for the
// before/after inventory. Datasets the old page also showed that aren't a
// "top of dashboard" concern (topSellingItems, lowStockItems, paymentStatusDistribution,
// customerGrowth, revenueByCategory, ratingDistribution, revenueByDayOfWeek,
// orderVolumeTrend, orderHourlyDistribution, stockLevels, itemsPerOrderDistribution,
// stockMovementTrend) moved to the new /admin/analytics page.

/** Window used for every "vs prior" delta on this page. */
const COMPARE_DAYS = 7;

const RANGES = [
	{ value: "7", label: "7D" },
	{ value: "30", label: "30D" },
] as const;
type RangeValue = (typeof RANGES)[number]["value"];

/** Turns a comparison into MetricCard's subtitle + trend props, or nothing when there's no baseline. */
function deltaProps(cmp: { deltaPercent: number | null; prior: number }, format: (n: number) => string) {
	if (cmp.deltaPercent === null) return {};
	return {
		subtitle: `vs prior ${COMPARE_DAYS}d: ${format(cmp.prior)}`,
		trend: {
			direction: (cmp.deltaPercent >= 0 ? "up" : "down") as "up" | "down",
			text: `${Math.abs(cmp.deltaPercent).toFixed(1)}%`,
		},
	};
}

function statusBadgeVariant(status: string): "success" | "warning" | "error" | "info" | "neutral" {
	switch (status?.toUpperCase()) {
		case "PENDING":
			return "warning";
		case "PROCESSING":
		case "SHIPPED":
			return "info";
		case "DELIVERED":
		case "COMPLETED":
			return "success";
		case "CANCELLED":
		case "FAILED":
			return "error";
		default:
			return "neutral";
	}
}

interface RecentOrder {
	id: string;
	orderReference: string;
	orderStatus: string;
	totalAmount: number;
	customerName: string;
	itemCount: number;
	createdAt: string;
}

interface RecentCustomer {
	id: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	createdAt: string;
}

const orderColumns: ColumnDef<RecentOrder, any>[] = [
	{
		accessorKey: "orderReference",
		header: "ORDER REF",
		cell: ({ getValue }) => <span className="font-medium">#{String(getValue())}</span>,
	},
	{ accessorKey: "customerName", header: "CUSTOMER" },
	{
		accessorKey: "totalAmount",
		header: "AMOUNT",
		cell: ({ getValue }) => <span className="font-semibold tabular-nums">{formatCurrencyFull(Number(getValue()))}</span>,
	},
	{
		accessorKey: "orderStatus",
		header: "STATUS",
		cell: ({ getValue }) => (
			<Badge variant={statusBadgeVariant(String(getValue()))} dot>
				{String(getValue())}
			</Badge>
		),
	},
	{
		accessorKey: "createdAt",
		header: "DATE",
		cell: ({ getValue }) => <span className="text-muted-foreground">{new Date(String(getValue())).toLocaleDateString()}</span>,
	},
];

const customerColumns: ColumnDef<RecentCustomer, any>[] = [
	{
		id: "customer",
		accessorKey: "firstName",
		header: "CUSTOMER",
		enableSorting: false,
		cell: ({ row }) => (
			<div>
				<div className="font-medium">
					{row.original.firstName} {row.original.lastName}
				</div>
				<div className="text-muted-foreground text-xs">{row.original.email}</div>
			</div>
		),
	},
	{
		accessorKey: "createdAt",
		header: "JOINED",
		cell: ({ getValue }) => <span className="text-muted-foreground">{new Date(String(getValue())).toLocaleDateString()}</span>,
	},
];

const AdminDashboard: React.FC = () => {
	const dispatch = useAppDispatch();
	const [analytics, setAnalytics] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [range, setRange] = useState<RangeValue>("30");

	// `silent` keeps the page-level PageLoader out of the way: a toolbar refresh
	// should spin the icon and leave the current numbers on screen, not blank the
	// whole dashboard back to a loading state.
	const load = useCallback(
		(silent = false) => {
			if (silent) setRefreshing(true);
			dispatch(analyticsAction.fetchDashboardAnalytics())
				.unwrap()
				.then((res: any) => setAnalytics(res?.data))
				.catch(() => {})
				.finally(() => {
					setLoading(false);
					setRefreshing(false);
				});
		},
		[dispatch],
	);

	useEffect(() => {
		load();
	}, [load]);

	const refresh = useCallback(() => load(true), [load]);

	const overview = analytics?.overview;

	/* Deltas are derived here, not served: the analytics endpoint has no
	   previous-period concept, so we split its daily series into the last 7 days
	   and the 7 before. Metrics with no time series (products, rating, reviews)
	   get no delta rather than an invented one. */
	const revenuePoints: Point[] = useMemo(
		() => (analytics?.revenueTrend ?? []).map((r: any) => ({ date: toDayBucket(r.date), value: Number(r.revenue) || 0 })),
		[analytics],
	);
	const orderPoints: Point[] = useMemo(
		() => (analytics?.revenueTrend ?? []).map((r: any) => ({ date: toDayBucket(r.date), value: Number(r.orders) || 0 })),
		[analytics],
	);

	const revenueCmp = useMemo(() => comparePeriods(revenuePoints, COMPARE_DAYS), [revenuePoints]);
	const orderCmp = useMemo(() => comparePeriods(orderPoints, COMPARE_DAYS), [orderPoints]);

	const headline: Array<{
		id: string;
		label: string;
		icon: typeof DollarSign;
		color: MetricColor;
		value: number | string | undefined;
		to?: string;
		subtitle?: string;
		trend?: { direction: "up" | "down"; text: string };
	}> = useMemo(
		() => [
			{
				id: "revenue",
				label: "Total Revenue",
				icon: DollarSign,
				color: "brand" as MetricColor,
				value: overview ? formatCurrency(overview.totalRevenue) : undefined,
				to: "/admin/orders",
				...deltaProps(revenueCmp, formatCurrency),
			},
			{
				id: "orders",
				label: "Total Orders",
				icon: ShoppingCart,
				color: "info" as MetricColor,
				value: overview?.totalOrders,
				to: "/admin/orders",
				...deltaProps(orderCmp, (n) => String(Math.round(n))),
			},
			{
				id: "customers",
				label: "Total Customers",
				icon: Users,
				color: "success" as MetricColor,
				value: overview?.totalCustomers,
				to: "/admin/customers",
			},
			{
				id: "aov",
				label: "Avg Order Value",
				icon: TrendingUp,
				color: "brand" as MetricColor,
				value: overview ? formatCurrency(overview.averageOrderValue) : undefined,
			},
		],
		[overview, revenueCmp, orderCmp],
	);

	// No time series behind these, so no delta — a number without a baseline.
	const secondary = useMemo(
		() => [
			{ id: "products", label: "Products", icon: Package, color: "info" as MetricColor, value: overview?.totalItems, to: "/admin/products" },
			{ id: "orders-today", label: "Orders Today", icon: Clock, color: "warning" as MetricColor, value: overview?.ordersToday },
			{ id: "rating", label: "Avg Rating", icon: Star, color: "warning" as MetricColor, value: overview ? `${Number(overview.averageRating).toFixed(1)}/5` : undefined, to: "/admin/reviews" },
			{ id: "reviews", label: "Reviews", icon: MessageCircle, color: "info" as MetricColor, value: overview?.totalReviews, to: "/admin/reviews" },
		],
		[overview],
	);

	const rangeDays = Number(range);
	const revenueTrendData = useMemo(
		() => lastDays(revenuePoints, rangeDays).map((p) => ({ bucket: p.date, value: p.value })),
		[revenuePoints, rangeDays],
	);

	const topProducts = useMemo(() => (analytics?.topSellingItems ?? []).slice(0, 4), [analytics]);

	const orderStatusData = useMemo(
		() => (analytics?.orderStatusDistribution ?? []).map((s: any) => ({ label: s.status, count: s.count })),
		[analytics],
	);

	if (loading) {
		return (
			<AdminLayout>
				<PageLoader fullScreen={false} message="Loading dashboard..." />
			</AdminLayout>
		);
	}

	return (
		<AdminLayout>
			<div className="space-y-6">
				<div className="flex flex-wrap items-end justify-between gap-3">
					<div>
						<h2 className="text-xl font-semibold tracking-tight">Dashboard</h2>
						<p className="text-muted-foreground mt-1 text-sm">
							Store performance at a glance. Changes compare the last {COMPARE_DAYS} days with the {COMPARE_DAYS} before.
						</p>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{headline.map((m) => (
						<MetricCard
							key={m.id}
							label={m.label}
							icon={m.icon}
							color={m.color}
							value={m.value}
							to={m.to}
							subtitle={m.subtitle}
							trend={m.trend}
							testId={`kpi-${m.id}`}
						/>
					))}
				</div>

				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					{secondary.map((m) => (
						<MetricCard key={m.id} label={m.label} icon={m.icon} color={m.color} value={m.value} to={m.to} testId={`kpi-${m.id}`} />
					))}
				</div>

				<div className="grid gap-4 lg:grid-cols-3">
					<ChartCard
						title="Revenue Trend"
						subtitle={`Daily revenue, last ${rangeDays} days`}
						className="lg:col-span-2"
						action={<RangeToggle options={RANGES as any} value={range} onChange={setRange} aria-label="Revenue range" />}
						isEmpty={(analytics?.revenueTrend?.length ?? 0) === 0}
						emptyMessage="No revenue in the last 30 days."
					>
						<TrendAreaChart data={revenueTrendData} color={TREND.revenue} name="Revenue" days={rangeDays} formatValue={formatCurrency} />
					</ChartCard>
					<ChartCard title="Order Status" subtitle="Distribution breakdown" isEmpty={orderStatusData.length === 0} emptyMessage="No orders yet.">
						<BreakdownDonut data={orderStatusData} colorFor={statusColor} />
					</ChartCard>
				</div>

				<Card>
					<CardHeader className="flex-row items-center justify-between space-y-0">
						<CardTitle>Recent Orders</CardTitle>
						<Link href="/admin/orders" className="text-muted-foreground hover:text-foreground text-xs font-medium">
							View All
						</Link>
					</CardHeader>
					<CardContent>
						<DataTable
							columns={orderColumns}
							data={analytics?.recentOrders ?? []}
							manualPagination={false}
							onRefresh={refresh}
							refreshing={refreshing}
							showSN={false}
							emptyMessage="No orders yet"
							testId="recent-orders-table"
						/>
					</CardContent>
				</Card>

				{topProducts.length > 0 && (
					<Card>
						<CardHeader className="flex-row items-center justify-between space-y-0">
							<CardTitle>Top Products</CardTitle>
							<Link href="/admin/products" className="text-muted-foreground hover:text-foreground text-xs font-medium">
								View All
							</Link>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
								{topProducts.map((item: any) => (
									<Link
										key={item.id}
										href={`/admin/product/${item.id}`}
										className="border-border hover:border-primary/40 group rounded-xl border p-3 transition-colors"
									>
										{/* contain, not cover — these are packaging shots */}
										<div className="bg-muted flex h-28 items-center justify-center overflow-hidden rounded-lg">
											{item.photo ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img src={item.photo} alt={item.name} className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105" />
											) : (
												<span className="text-muted-foreground text-2xl font-semibold">{String(item.name ?? "?").charAt(0)}</span>
											)}
										</div>
										<p className="mt-3 truncate text-sm font-medium">{item.name}</p>
										<p className="text-muted-foreground truncate text-xs">{item.product ?? "Uncategorised"}</p>
										<div className="mt-2 flex items-center justify-between text-xs">
											<span className="font-semibold">{formatCurrencyFull(Number(item.price) || 0)}</span>
											<span className="text-muted-foreground tabular-nums">{Number(item.soldQuantity) || 0} sold</span>
										</div>
									</Link>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				<Card>
					<CardHeader className="flex-row items-center justify-between space-y-0">
						<CardTitle>Recent Customers</CardTitle>
						<Link href="/admin/customers" className="text-muted-foreground hover:text-foreground text-xs font-medium">
							View All
						</Link>
					</CardHeader>
					<CardContent>
						<DataTable
							columns={customerColumns}
							data={analytics?.recentCustomers ?? []}
							manualPagination={false}
							onRefresh={refresh}
							refreshing={refreshing}
							showSN={false}
							emptyMessage="No customers yet"
							testId="recent-customers-table"
						/>
					</CardContent>
				</Card>
			</div>
		</AdminLayout>
	);
};

export default withAdminAuth(AdminDashboard);
