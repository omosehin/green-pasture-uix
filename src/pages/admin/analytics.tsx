import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ColumnDef } from "@tanstack/react-table";

import withAdminAuth from "@/_components/withAdminAuth";
import AdminLayout from "@/_components/AdminLayout";
import PageLoader from "@/_UI/PageLoader";
import Badge from "@/_UI/Badge";
import { ChartCard } from "@/_components/charts/chart-card";
import { TrendAreaChart } from "@/_components/charts/trend-area-chart";
import { BreakdownDonut } from "@/_components/charts/breakdown-donut";
import { ChartTooltip } from "@/_components/charts/chart-tooltip";
import { CATEGORICAL, TREND, statusColor } from "@/_components/charts/chart-colors";
import { DataTable } from "@/_components/DataTable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAppDispatch } from "@/_redux/store";
import { analyticsAction } from "@/_redux/actions/analytics.action";
import { formatCurrency, formatCurrencyFull, formatNumber, toDayBucket } from "@/_utils/format";
import { MetricCard, type MetricColor } from "@/_components/MetricCard";
import { PerformanceTable } from "@/_components/PerformanceTable";
import { RangeToggle } from "@/_UI/RangeToggle";
import { comparePeriods, lastDays, type Point } from "@/_utils/periodCompare";
import { DollarSign, ShoppingCart, Users, Star } from "lucide-react";

/** Windows offered on the trend chart, and the one every delta is measured over. */
const VOLUME_RANGES = [
	{ value: "7", label: "7D" },
	{ value: "30", label: "30D" },
] as const;
const COMPARE_DAYS = 7;

// New page for task 8. Surfaces every analytics.dashboard dataset that
// dashboard.tsx doesn't: revenueByCategory, customerGrowth, orderVolumeTrend,
// ratingDistribution, orderHourlyDistribution, revenueByDayOfWeek, stockLevels,
// itemsPerOrderDistribution, stockMovementTrend, topSellingItems, lowStockItems
// — plus paymentStatusDistribution, which the old single-page dashboard.tsx
// also showed but which task-8-brief's split lists on neither page; dropping
// it would violate "keep every metric", so it landed here as a Sales chart.
//
// None of these shapes (categorical multi-series bars, a date x type pivot)
// fit ChartCard's two ported chart components (TrendAreaChart wants a single
// daily series, BreakdownDonut wants a flat label/count list), so CategoryBarChart
// below is a small local wrapper around recharts' BarChart, styled with the
// same tokens/tooltip TrendAreaChart uses, for the rest.

const RATING_COLORS = ["#dc2626", "#f97316", "#d97706", "#65a30d", "#0e9f6e"];

function shortDateLabel(iso: string): string {
	const [y, m, d] = iso.split("-").map(Number);
	if (!y || !m || !d) return iso;
	return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(y, m - 1, d));
}

function shortMonthLabel(bucket: string): string {
	const [y, m] = bucket.split("-").map(Number);
	if (!y || !m) return bucket;
	return new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(y, m - 1, 1));
}

interface CategoryBarChartProps {
	data: Record<string, any>[];
	xKey: string;
	bars: { key: string; name: string; color: string }[];
	xTickFormatter?: (v: any) => string;
	valueFormatter?: (v: number) => string;
	height?: number;
	layout?: "horizontal" | "vertical";
	angledLabels?: boolean;
	/** Per-bar colour override for a single-series chart (e.g. rating stars). */
	cellColors?: string[];
}

/** Categorical/grouped bar chart for the shapes TrendAreaChart and BreakdownDonut don't cover. */
function CategoryBarChart({
	data,
	xKey,
	bars,
	xTickFormatter,
	valueFormatter = (v) => v.toLocaleString(),
	height = 240,
	layout = "horizontal",
	angledLabels = false,
	cellColors,
}: CategoryBarChartProps) {
	const isVertical = layout === "vertical";
	return (
		<ResponsiveContainer width="100%" height={height}>
			<BarChart data={data} layout={isVertical ? "vertical" : undefined} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
				<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={!isVertical} vertical={isVertical} />
				{isVertical ? (
					<>
						<XAxis type="number" tickFormatter={valueFormatter} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
						<YAxis type="category" dataKey={xKey} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
					</>
				) : (
					<>
						<XAxis
							dataKey={xKey}
							tickFormatter={xTickFormatter}
							tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
							axisLine={false}
							tickLine={false}
							angle={angledLabels ? -30 : 0}
							textAnchor={angledLabels ? "end" : "middle"}
							height={angledLabels ? 56 : 24}
							interval={0}
						/>
						<YAxis tickFormatter={valueFormatter} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} width={44} allowDecimals={false} />
					</>
				)}
				<Tooltip content={<ChartTooltip formatValue={valueFormatter} />} cursor={{ fill: "var(--muted)" }} />
				{bars.map((b, bi) => (
					<Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color} radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]} barSize={bars.length > 1 ? 16 : 28}>
						{cellColors && bi === 0
							? data.map((_, i) => <Cell key={i} fill={cellColors[i % cellColors.length]} />)
							: null}
					</Bar>
				))}
			</BarChart>
		</ResponsiveContainer>
	);
}

interface TopSellingItem {
	id: string;
	name: string;
	product: string | null;
	soldQuantity: number;
	availableQuantity: number;
	price: number;
}

interface LowStockItem {
	id: string;
	name: string;
	product: string | null;
	availableQuantity: number;
}

const topSellingColumns: ColumnDef<TopSellingItem, any>[] = [
	{ accessorKey: "name", header: "ITEM" },
	{ accessorKey: "product", header: "PRODUCT", cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue() ?? "N/A")}</span> },
	{ accessorKey: "soldQuantity", header: "SOLD", cell: ({ getValue }) => <span className="font-semibold tabular-nums">{formatNumber(Number(getValue()))}</span> },
	{ accessorKey: "availableQuantity", header: "IN STOCK", cell: ({ getValue }) => <span className="tabular-nums">{formatNumber(Number(getValue()))}</span> },
	{ accessorKey: "price", header: "PRICE", cell: ({ getValue }) => <span className="tabular-nums">{formatCurrencyFull(Number(getValue()))}</span> },
];

const lowStockColumns: ColumnDef<LowStockItem, any>[] = [
	{ accessorKey: "name", header: "ITEM" },
	{ accessorKey: "product", header: "PRODUCT", cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue() ?? "N/A")}</span> },
	{
		accessorKey: "availableQuantity",
		header: "STOCK",
		cell: ({ getValue }) => {
			const qty = Number(getValue());
			return (
				<Badge variant={qty === 0 ? "error" : "warning"} size="sm">
					{qty} left
				</Badge>
			);
		},
	},
];

const AdminAnalytics: React.FC = () => {
	const dispatch = useAppDispatch();
	const [analytics, setAnalytics] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [volumeRange, setVolumeRange] = useState<"7" | "30">("30");

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

	const orderVolumeData = useMemo(
		() => lastDays((analytics?.orderVolumeTrend ?? []).map((r: any) => ({ date: toDayBucket(r.date), value: Number(r.count) || 0 })), Number(volumeRange))
			.map((p) => ({ bucket: p.date, value: p.value })),
		[analytics, volumeRange],
	);

	const paymentStatusData = useMemo(
		() => (analytics?.paymentStatusDistribution ?? []).map((p: any) => ({ label: p.status, count: p.count })),
		[analytics],
	);

	const itemsPerOrderData = useMemo(
		() => (analytics?.itemsPerOrderDistribution ?? []).map((r: any) => ({ label: `${r.items} items`, count: r.orders })),
		[analytics],
	);

	const stockMovementData = useMemo(() => {
		const rows: { date: string; type: string; quantity: number }[] = analytics?.stockMovementTrend ?? [];
		const byDate = new Map<string, { date: string; RESTOCK: number; SALE: number; ADJUSTMENT: number }>();
		for (const r of rows) {
			const bucket = toDayBucket(r.date);
			const row = byDate.get(bucket) ?? { date: bucket, RESTOCK: 0, SALE: 0, ADJUSTMENT: 0 };
			(row as any)[r.type] = r.quantity;
			byDate.set(bucket, row);
		}
		return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
	}, [analytics]);

	const ratingHasData = (analytics?.ratingDistribution ?? []).some((r: any) => r.count > 0);

	/* Prior-period deltas, derived client-side: the endpoint serves one window
	   of daily points and no baseline, so "vs prior" means the 7 days before
	   the last 7. Metrics with no series behind them show a value and no delta. */
	const revenuePoints: Point[] = useMemo(
		() => (analytics?.revenueTrend ?? []).map((r: any) => ({ date: toDayBucket(r.date), value: Number(r.revenue) || 0 })),
		[analytics],
	);
	const orderPoints: Point[] = useMemo(
		() => (analytics?.orderVolumeTrend ?? []).map((r: any) => ({ date: toDayBucket(r.date), value: Number(r.count) || 0 })),
		[analytics],
	);
	const customerPoints: Point[] = useMemo(
		() => (analytics?.customerGrowth ?? []).map((g: any) => ({ date: g.month, value: Number(g.count) || 0 })),
		[analytics],
	);

	const revenueCmp = useMemo(() => comparePeriods(revenuePoints, COMPARE_DAYS), [revenuePoints]);
	const orderCmp = useMemo(() => comparePeriods(orderPoints, COMPARE_DAYS), [orderPoints]);
	// Monthly series — one point per month, so the window is 1, not COMPARE_DAYS.
	const customerCmp = useMemo(() => comparePeriods(customerPoints, 1), [customerPoints]);

	const kpis = useMemo(() => {
		const overview = analytics?.overview;
		const delta = (cmp: { deltaPercent: number | null; prior: number }, unit: string, format: (n: number) => string) =>
			cmp.deltaPercent === null
				? {}
				: {
						subtitle: `vs prior ${unit}: ${format(cmp.prior)}`,
						trend: {
							direction: (cmp.deltaPercent >= 0 ? "up" : "down") as "up" | "down",
							text: `${Math.abs(cmp.deltaPercent).toFixed(1)}%`,
						},
					};
		return [
			{
				id: "revenue",
				label: "Revenue",
				icon: DollarSign,
				color: "brand" as MetricColor,
				value: overview ? formatCurrency(overview.totalRevenue) : undefined,
				...delta(revenueCmp, `${COMPARE_DAYS}d`, formatCurrency),
			},
			{
				id: "orders",
				label: "Orders",
				icon: ShoppingCart,
				color: "info" as MetricColor,
				value: overview?.totalOrders,
				...delta(orderCmp, `${COMPARE_DAYS}d`, (n) => String(Math.round(n))),
			},
			{
				id: "customers",
				label: "Customers",
				icon: Users,
				color: "success" as MetricColor,
				value: overview?.totalCustomers,
				...delta(customerCmp, "month", (n) => String(Math.round(n))),
			},
			{
				id: "rating",
				label: "Avg Rating",
				icon: Star,
				color: "warning" as MetricColor,
				value: overview ? `${Number(overview.averageRating).toFixed(1)}/5` : undefined,
				subtitle: `${overview?.totalReviews ?? 0} reviews`,
			},
		];
	}, [analytics, revenueCmp, orderCmp, customerCmp]);

	const volumeDays = Number(volumeRange);

	if (loading) {
		return (
			<AdminLayout>
				<PageLoader fullScreen={false} message="Loading analytics..." />
			</AdminLayout>
		);
	}

	return (
		<AdminLayout>
			<div className="space-y-6">
				<div>
					<h2 className="text-xl font-semibold tracking-tight">Analytics</h2>
					<p className="text-muted-foreground mt-1 text-sm">
						Deeper trends across sales, customers and inventory. Changes compare against the prior period.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{kpis.map((k) => (
						<MetricCard
							key={k.id}
							label={k.label}
							icon={k.icon}
							color={k.color}
							value={k.value}
							subtitle={(k as any).subtitle}
							trend={(k as any).trend}
							testId={`analytics-kpi-${k.id}`}
						/>
					))}
				</div>

				{/* Sales */}
				<div className="grid gap-4 lg:grid-cols-3">
					<ChartCard
						title="Order Volume"
						subtitle={`Daily order count, last ${volumeDays} days`}
						action={<RangeToggle options={VOLUME_RANGES as any} value={volumeRange} onChange={setVolumeRange} aria-label="Order volume range" />}
						isEmpty={(analytics?.orderVolumeTrend?.length ?? 0) === 0}
					>
						<TrendAreaChart data={orderVolumeData} color={TREND.orders} name="Orders" days={volumeDays} formatValue={formatNumber} />
					</ChartCard>
					<ChartCard title="Revenue by Category" subtitle="Product category performance" isEmpty={(analytics?.revenueByCategory?.length ?? 0) === 0}>
						<CategoryBarChart
							data={analytics?.revenueByCategory ?? []}
							xKey="category"
							layout="vertical"
							bars={[{ key: "revenue", name: "Revenue", color: CATEGORICAL[0] }]}
							valueFormatter={formatCurrency}
						/>
					</ChartCard>
					<ChartCard title="Payment Status" subtitle="Transaction breakdown" isEmpty={paymentStatusData.length === 0}>
						<BreakdownDonut data={paymentStatusData} colorFor={statusColor} />
					</ChartCard>
				</div>

				{/* Customers & reviews */}
				<div className="grid gap-4 lg:grid-cols-3">
					<ChartCard title="Customer Growth" subtitle="New customers, last 6 months" isEmpty={(analytics?.customerGrowth?.length ?? 0) === 0}>
						<CategoryBarChart
							data={analytics?.customerGrowth ?? []}
							xKey="month"
							xTickFormatter={shortMonthLabel}
							bars={[{ key: "count", name: "Customers", color: TREND.customers }]}
							valueFormatter={formatNumber}
						/>
					</ChartCard>
					<ChartCard title="Rating Distribution" subtitle="Customer review ratings" isEmpty={!ratingHasData} emptyMessage="No reviews yet.">
						<CategoryBarChart
							data={analytics?.ratingDistribution ?? []}
							xKey="stars"
							xTickFormatter={(v) => `${v}★`}
							bars={[{ key: "count", name: "Reviews", color: CATEGORICAL[0] }]}
							valueFormatter={formatNumber}
							cellColors={RATING_COLORS}
						/>
					</ChartCard>
					<ChartCard title="Cart Size" subtitle="Items per order" isEmpty={itemsPerOrderData.length === 0}>
						<BreakdownDonut data={itemsPerOrderData} colorFor={(_l, i) => CATEGORICAL[i % CATEGORICAL.length]} />
					</ChartCard>
				</div>

				{/* Operations */}
				<div className="grid gap-4 lg:grid-cols-3">
					<ChartCard title="Peak Order Hours" subtitle="When customers order most" isEmpty={(analytics?.orderHourlyDistribution?.length ?? 0) === 0}>
						<CategoryBarChart
							data={analytics?.orderHourlyDistribution ?? []}
							xKey="hour"
							xTickFormatter={(v) => `${v}:00`}
							bars={[{ key: "count", name: "Orders", color: CATEGORICAL[1] }]}
							valueFormatter={formatNumber}
						/>
					</ChartCard>
					<ChartCard title="Sales by Day" subtitle="Revenue by day of week" isEmpty={(analytics?.revenueByDayOfWeek?.length ?? 0) === 0}>
						<CategoryBarChart
							data={analytics?.revenueByDayOfWeek ?? []}
							xKey="day"
							bars={[{ key: "revenue", name: "Revenue", color: TREND.revenue }]}
							valueFormatter={formatCurrency}
						/>
					</ChartCard>
					<ChartCard title="Stock Movement" subtitle="Restocks, sales & adjustments, last 30 days" isEmpty={stockMovementData.length === 0}>
						<CategoryBarChart
							data={stockMovementData}
							xKey="date"
							xTickFormatter={shortDateLabel}
							bars={[
								{ key: "RESTOCK", name: "Restock", color: CATEGORICAL[0] },
								{ key: "SALE", name: "Sale", color: CATEGORICAL[1] },
								{ key: "ADJUSTMENT", name: "Adjustment", color: CATEGORICAL[2] },
							]}
							valueFormatter={formatNumber}
						/>
					</ChartCard>
				</div>

				{/* Inventory */}
				<ChartCard title="Inventory Levels" subtitle="Available vs sold, by product" isEmpty={(analytics?.stockLevels?.length ?? 0) === 0}>
					<CategoryBarChart
						data={analytics?.stockLevels ?? []}
						xKey="name"
						angledLabels
						bars={[
							{ key: "available", name: "Available", color: CATEGORICAL[0] },
							{ key: "sold", name: "Sold", color: CATEGORICAL[1] },
						]}
						valueFormatter={formatNumber}
						height={280}
					/>
				</ChartCard>

				{/* Share-of-total tables: the bar answers "which rows carry the
				    business", which a column of bare numbers doesn't. */}
				<Card>
					<CardHeader>
						<CardTitle>Category Performance</CardTitle>
					</CardHeader>
					<CardContent>
						<PerformanceTable
							rows={analytics?.revenueByCategory ?? []}
							rowKey={(r: any) => r.category ?? "uncategorised"}
							emptyMessage="No category revenue yet."
							columns={[
								{ key: "category", header: "Category", value: (r: any) => r.category ?? "Uncategorised" },
								{ key: "revenue", header: "Revenue", align: "right", value: (r: any) => formatCurrencyFull(Number(r.revenue) || 0), weight: (r: any) => Number(r.revenue) || 0 },
								{ key: "units", header: "Units Sold", align: "right", value: (r: any) => formatNumber(Number(r.unitsSold) || 0), weight: (r: any) => Number(r.unitsSold) || 0 },
							]}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Product Performance</CardTitle>
					</CardHeader>
					<CardContent>
						<PerformanceTable
							rows={analytics?.topSellingItems ?? []}
							rowKey={(r: any) => r.id}
							emptyMessage="No sales yet."
							columns={[
								{ key: "name", header: "Product", value: (r: any) => r.name },
								{ key: "category", header: "Category", value: (r: any) => r.product ?? "Uncategorised" },
								{ key: "sold", header: "Units Sold", align: "right", value: (r: any) => formatNumber(Number(r.soldQuantity) || 0), weight: (r: any) => Number(r.soldQuantity) || 0 },
								{ key: "revenue", header: "Revenue", align: "right", value: (r: any) => formatCurrencyFull((Number(r.price) || 0) * (Number(r.soldQuantity) || 0)), weight: (r: any) => (Number(r.price) || 0) * (Number(r.soldQuantity) || 0) },
								{ key: "stock", header: "In Stock", align: "right", value: (r: any) => formatNumber(Number(r.availableQuantity) || 0) },
							]}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Top Selling Items</CardTitle>
					</CardHeader>
					<CardContent>
						<DataTable
							columns={topSellingColumns}
							data={analytics?.topSellingItems ?? []}
							manualPagination={false}
							onRefresh={refresh}
							refreshing={refreshing}
							showSN
							emptyMessage="No sales yet"
							testId="top-selling-table"
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Low Stock Items</CardTitle>
					</CardHeader>
					<CardContent>
						<DataTable
							columns={lowStockColumns}
							data={analytics?.lowStockItems ?? []}
							manualPagination={false}
							onRefresh={refresh}
							refreshing={refreshing}
							showSN
							emptyMessage="All stocked up"
							testId="low-stock-table"
						/>
					</CardContent>
				</Card>
			</div>
		</AdminLayout>
	);
};

export default withAdminAuth(AdminAnalytics);
