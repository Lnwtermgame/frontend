"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Clock,
  DollarSign,
  Download,
  Flame,
  Inbox,
  Layers,
  Loader2,
  Package,
  Percent,
  Receipt,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import {
  AdminLayout,
  AdminPageHeader,
  PageContainer,
  StatCard as StatCardPrimitive,
  StatusBadge,
} from "@/components/admin";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  analyticsApi,
  DashboardStats,
  ProductAnalytics,
  RecentOrder,
  RevenueData,
  SalesAnalytics,
  UserAnalytics,
} from "@/lib/services/analytics-api";
import { useAuth } from "@/lib/hooks/use-auth";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface AnalyticsPageData {
  dashboardStats: DashboardStats | null;
  salesAnalytics: SalesAnalytics | null;
  userAnalytics: UserAnalytics | null;
  productAnalytics: ProductAnalytics | null;
  revenueDaily: RevenueData["daily"];
  recentOrders: RecentOrder[];
}

interface SalesChartPoint {
  key: string;
  label: string;
  revenue: number;
  orders: number;
}

const DATE_RANGE_CONFIG: Record<
  string,
  { days: number; period: "7d" | "30d" | "90d"; label: string }
> = {
  "24h": { days: 1, period: "7d", label: "24 ชั่วโมง" },
  "7d": { days: 7, period: "7d", label: "7 วัน" },
  "30d": { days: 30, period: "30d", label: "30 วัน" },
  "90d": { days: 90, period: "90d", label: "90 วัน" },
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(amount);

const formatCompact = (amount: number) =>
  new Intl.NumberFormat("th-TH", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);

const formatShortDate = (date: Date) =>
  date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });

const buildSalesChartPoints = (
  dailyData: RevenueData["daily"],
  range: string,
): SalesChartPoint[] => {
  if (dailyData.length === 0) return [];

  if (range === "7d" || range === "24h") {
    return dailyData.map((entry) => {
      const date = new Date(entry.date);
      return {
        key: entry.date,
        label: date.toLocaleDateString("th-TH", { weekday: "short" }),
        revenue: entry.revenue,
        orders: entry.orders,
      };
    });
  }

  const chunkSize = range === "90d" ? 7 : 5;
  const points: SalesChartPoint[] = [];

  for (let i = 0; i < dailyData.length; i += chunkSize) {
    const chunk = dailyData.slice(i, i + chunkSize);
    if (chunk.length === 0) continue;

    const start = new Date(chunk[0].date);
    const end = new Date(chunk[chunk.length - 1].date);
    const revenue = chunk.reduce((sum, item) => sum + item.revenue, 0);
    const orders = chunk.reduce((sum, item) => sum + item.orders, 0);
    const label =
      formatShortDate(start) === formatShortDate(end)
        ? formatShortDate(start)
        : `${formatShortDate(start)}`;

    points.push({
      key: `${chunk[0].date}-${chunk[chunk.length - 1].date}`,
      label,
      revenue,
      orders,
    });
  }

  return points;
};

/* ------------------------------------------------------------------ */
/* Revenue area chart — dependency-free SVG chart in shadcn style      */
/* ------------------------------------------------------------------ */

const CHART_W = 720;
const CHART_H = 260;
const CHART_PAD = { top: 16, right: 12, bottom: 26, left: 46 };

function RevenueAreaChart({
  points,
}: {
  points: SalesChartPoint[];
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const innerW = CHART_W - CHART_PAD.left - CHART_PAD.right;
  const innerH = CHART_H - CHART_PAD.top - CHART_PAD.bottom;

  const maxRevenue = Math.max(...points.map((p) => p.revenue), 0);
  const niceMax = niceCeil(maxRevenue);

  const x = (i: number) =>
    CHART_PAD.left +
    (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) =>
    CHART_PAD.top + innerH - (Math.min(v, niceMax) / niceMax) * innerH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.revenue).toFixed(1)}`)
    .join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L ${x(points.length - 1).toFixed(1)} ${(
          CHART_PAD.top + innerH
        ).toFixed(1)} L ${x(0).toFixed(1)} ${(
          CHART_PAD.top + innerH
        ).toFixed(1)} Z`
      : "";

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * CHART_W;
    const idx = Math.round(
      ((relX - CHART_PAD.left) / innerW) * (points.length - 1),
    );
    setHoverIdx(Math.max(0, Math.min(points.length - 1, idx)));
  };

  const hovered = hoverIdx !== null ? points[hoverIdx] : null;

  if (points.length === 0 || maxRevenue === 0) {
    return (
      <div className="h-[260px] flex flex-col items-center justify-center gap-2 text-site-dim">
        <BarChart3 className="w-8 h-8 opacity-40" />
        <p className="text-sm">ยังไม่มีข้อมูลยอดขายในช่วงเวลานี้</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full h-[260px] select-none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
        role="img"
        aria-label="กราฟรายได้"
      >
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--site-accent)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--site-accent)" stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* horizontal grid + y labels */}
        {gridLines.map((g) => {
          const gy = CHART_PAD.top + innerH - g * innerH;
          return (
            <g key={g}>
              <line
                x1={CHART_PAD.left}
                x2={CHART_W - CHART_PAD.right}
                y1={gy}
                y2={gy}
                className="stroke-site-border-soft"
                strokeWidth={1}
                strokeDasharray={g === 0 ? undefined : "4 4"}
              />
              <text
                x={CHART_PAD.left - 8}
                y={gy + 3}
                textAnchor="end"
                className="fill-site-dim text-[9px]"
              >
                {formatCompact(niceMax * g)}
              </text>
            </g>
          );
        })}

        {/* area + line */}
        <path d={areaPath} fill="url(#revFill)" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--site-accent)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* points + x labels */}
        {points.map((p, i) => {
          const labelStep = points.length > 10 ? 2 : 1;
          return (
            <g key={p.key}>
              <circle
                cx={x(i)}
                cy={y(p.revenue)}
                r={hoverIdx === i ? 4 : 2.5}
                className="fill-site-accent transition-all"
              />
              {i % labelStep === 0 || i === points.length - 1 ? (
                <text
                  x={x(i)}
                  y={CHART_H - 8}
                  textAnchor="middle"
                  className={cn(
                    "text-[9px]",
                    hoverIdx === i ? "fill-site-text" : "fill-site-dim",
                  )}
                >
                  {p.label}
                </text>
              ) : null}
            </g>
          );
        })}

        {/* hover guide */}
        {hoverIdx !== null && (
          <line
            x1={x(hoverIdx)}
            x2={x(hoverIdx)}
            y1={CHART_PAD.top}
            y2={CHART_PAD.top + innerH}
            className="stroke-site-border"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}
      </svg>

      {/* tooltip */}
      {hovered && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full bg-site-raised border border-site-border rounded-lg px-3 py-2 shadow-lg min-w-[140px]"
          style={{
            left: `${(x(hoverIdx!) / CHART_W) * 100}%`,
            top: `${(y(hovered.revenue) / CHART_H) * 100}%`,
            marginTop: -8,
          }}
        >
          <p className="text-[10px] font-semibold text-site-dim uppercase tracking-wider mb-1">
            {hovered.label}
          </p>
          <p className="text-sm font-bold text-site-text leading-tight">
            {formatCurrency(hovered.revenue)}
          </p>
          <p className="text-[10px] text-site-muted mt-0.5">
            {hovered.orders.toLocaleString()} คำสั่งซื้อ
          </p>
        </div>
      )}
    </div>
  );
}

/** Round up to a human-friendly axis maximum (1/2/5 × 10^n). */
function niceCeil(value: number): number {
  if (value <= 0) return 100;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const unit = value / base;
  const niceUnit = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10;
  return niceUnit * base;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AdminAnalyticsPage() {
  const t = useTranslations("AdminPage");
  const { isAdmin } = useAuth();

  const [dateRange, setDateRange] = useState("7d");
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsPageData>({
    dashboardStats: null,
    salesAnalytics: null,
    userAnalytics: null,
    productAnalytics: null,
    revenueDaily: [],
    recentOrders: [],
  });

  const fetchAnalyticsData = useCallback(async () => {
    if (!isAdmin) return;

    const rangeConfig = DATE_RANGE_CONFIG[dateRange] || DATE_RANGE_CONFIG["7d"];

    try {
      setLoading(true);
      setError(null);

      const [
        dashboardStatsRes,
        salesAnalyticsRes,
        userAnalyticsRes,
        productAnalyticsRes,
        recentOrdersRes,
        revenueDataRes,
      ] = await Promise.all([
        analyticsApi.getDashboardStats(),
        analyticsApi.getSalesAnalytics(rangeConfig.period),
        analyticsApi.getUserAnalytics(),
        analyticsApi.getProductAnalytics(),
        analyticsApi.getRecentOrders(5),
        analyticsApi.getRevenueData(rangeConfig.days),
      ]);

      setData({
        dashboardStats: dashboardStatsRes.data,
        salesAnalytics: salesAnalyticsRes.data,
        userAnalytics: userAnalyticsRes.data,
        productAnalytics: productAnalyticsRes.data,
        recentOrders: recentOrdersRes.data,
        revenueDaily: revenueDataRes.data.daily,
      });
    } catch (err) {
      setError(analyticsApi.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [dateRange, isAdmin]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const statValues = useMemo(() => {
    const stats = data.dashboardStats;
    const sales = data.salesAnalytics;
    const users = data.userAnalytics;

    const usersValue =
      dateRange === "24h"
        ? users?.newUsers.today || 0
        : dateRange === "7d"
          ? users?.newUsers.thisWeek || 0
          : users?.newUsers.thisMonth || 0;

    return {
      revenue: {
        current: sales?.totalRevenue || 0,
        change: sales?.revenueGrowth || 0,
      },
      orders: {
        current: sales?.totalOrders || 0,
        change: sales?.orderGrowth || 0,
      },
      customers: {
        current: usersValue,
        change: stats?.users.percent || 0,
      },
      products: {
        current: stats?.products.total || 0,
        change: stats?.products.percent || 0,
      },
    };
  }, [data.dashboardStats, data.salesAnalytics, data.userAnalytics, dateRange]);

  const topProducts = useMemo(
    () => (data.productAnalytics?.bestsellers || []).slice(0, 5),
    [data.productAnalytics],
  );

  const categoryPerformance = useMemo(
    () => (data.productAnalytics?.categoryPerformance || []).slice(0, 5),
    [data.productAnalytics],
  );

  const topUsers = useMemo(
    () => (data.userAnalytics?.topUsers || []).slice(0, 5),
    [data.userAnalytics],
  );

  const salesChartData = useMemo(
    () => buildSalesChartPoints(data.revenueDaily, dateRange),
    [data.revenueDaily, dateRange],
  );

  const rangeLabel = DATE_RANGE_CONFIG[dateRange]?.label ?? "7 วัน";

  const summary = useMemo(() => {
    const sales = data.salesAnalytics;
    const revenueTotal = salesChartData.reduce((s, p) => s + p.revenue, 0);
    const ordersTotal = salesChartData.reduce((s, p) => s + p.orders, 0);
    const bestDay =
      salesChartData.length > 0
        ? salesChartData.reduce((best, p) => (p.revenue > best.revenue ? p : best))
        : null;

    return {
      avgOrderValue: sales?.averageOrderValue ?? 0,
      conversionRate: sales?.conversionRate ?? 0,
      chartRevenue: revenueTotal,
      chartOrders: ordersTotal,
      bestDay,
    };
  }, [data.salesAnalytics, salesChartData]);

  const handleExport = async () => {
    if (!data.salesAnalytics || !data.userAnalytics || !data.dashboardStats) {
      return;
    }

    setIsExporting(true);
    try {
      const rows = [
        ["Metric", "Value"],
        ["Date Range", dateRange],
        ["Revenue", data.salesAnalytics.totalRevenue.toString()],
        ["Orders", data.salesAnalytics.totalOrders.toString()],
        ["Average Order Value", data.salesAnalytics.averageOrderValue.toString()],
        ["Conversion Rate", data.salesAnalytics.conversionRate.toString()],
        [
          "New Users",
          (dateRange === "24h"
            ? data.userAnalytics.newUsers.today
            : dateRange === "7d"
              ? data.userAnalytics.newUsers.thisWeek
              : data.userAnalytics.newUsers.thisMonth
          ).toString(),
        ],
        ["Products", data.dashboardStats.products.total.toString()],
        [],
        ["Recent Orders", "", "", "", ""],
        ["Order Number", "Customer", "Status", "Amount", "Created At"],
        ...data.recentOrders.map((order) => [
          order.orderNumber,
          order.user.username,
          order.status,
          order.finalAmount.toString(),
          new Date(order.createdAt).toISOString(),
        ]),
      ];

      // Prefix with BOM so Thai text opens correctly in Excel.
      const csv = "\uFEFF" + rows.map((row) => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `analytics-${dateRange}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading && !data.dashboardStats) {
    return (
      <AdminLayout>
        <PageContainer>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-12" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Skeleton className="lg:col-span-2 h-[360px] rounded-12" />
            <Skeleton className="h-[360px] rounded-12" />
          </div>
          <Skeleton className="h-[300px] rounded-12" />
        </PageContainer>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageContainer>
        <AdminPageHeader
          title="วิเคราะห์"
          actions={
            <div className="flex items-center gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="h-9 px-3 bg-site-raised border-site-border text-sm font-medium text-site-text w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 ชั่วโมง</SelectItem>
                  <SelectItem value="7d">7 วัน</SelectItem>
                  <SelectItem value="30d">30 วัน</SelectItem>
                  <SelectItem value="90d">90 วัน</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchAnalyticsData}
                className="gap-2 text-sm font-medium"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                รีเฟรช
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                className="gap-2 text-sm font-medium"
              >
                <Download className="h-4 w-4" />
                {isExporting ? "กำลังส่งออก..." : "ส่งออก"}
              </Button>
            </div>
          }
        />

        {error && (
          <div className="bg-semantic-rose/10 border border-semantic-rose/30 rounded-lg text-semantic-rose px-3 py-2 text-sm">
            ไม่สามารถโหลดข้อมูลได้: {error}
          </div>
        )}

        {/* Stat cards using shared StatCard primitive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCardPrimitive
            title="รายได้ทั้งหมด"
            value={formatCurrency(statValues.revenue.current)}
            change={statValues.revenue.change}
            trend={statValues.revenue.change >= 0 ? "up" : "down"}
            icon={DollarSign}
            semantic="blue"
          />
          <StatCardPrimitive
            title="คำสั่งซื้อ"
            value={statValues.orders.current.toLocaleString()}
            change={statValues.orders.change}
            trend={statValues.orders.change >= 0 ? "up" : "down"}
            icon={ShoppingCart}
            semantic="violet"
          />
          <StatCardPrimitive
            title="ลูกค้าใหม่"
            value={statValues.customers.current.toLocaleString()}
            change={statValues.customers.change}
            trend={statValues.customers.change >= 0 ? "up" : "down"}
            icon={Users}
            semantic="amber"
          />
          <StatCardPrimitive
            title="สินค้าทั้งหมด"
            value={statValues.products.current.toLocaleString()}
            change={statValues.products.change}
            trend={statValues.products.change >= 0 ? "up" : "down"}
            icon={Package}
            semantic="green"
          />
        </div>

        {/* Sales chart + top products */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 bg-site-surface border-site-border-soft rounded-12 shadow-none">
            <CardHeader className="p-4 pb-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-bold text-site-text flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-site-accent" />
                    ยอดขาย · {rangeLabel}
                  </CardTitle>
                  <CardDescription className="text-[11px] text-site-dim mt-1">
                    รายได้รวมในกราฟ{" "}
                    <span className="font-semibold text-site-text">
                      {formatCurrency(summary.chartRevenue)}
                    </span>{" "}
                    · {summary.chartOrders.toLocaleString()} คำสั่งซื้อ
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="info">
                    <Receipt />
                    เฉลี่ย {formatCurrency(summary.avgOrderValue)}/ออเดอร์
                  </Badge>
                  {summary.bestDay && summary.bestDay.revenue > 0 && (
                    <Badge variant="warning">
                      <Flame />
                      สูงสุด {summary.bestDay.label}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <RevenueAreaChart points={salesChartData} />
            </CardContent>
          </Card>

          <Card className="bg-site-surface border-site-border-soft rounded-12 shadow-none">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-site-text flex items-center gap-2">
                <Trophy className="w-4 h-4 text-site-accent" />
                สินค้าขายดี
              </CardTitle>
              <CardDescription className="text-[11px] text-site-dim mt-1">
                5 อันดับสินค้ายอดขายสูงสุด
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-2">
                {topProducts.map((product, index) => {
                  const maxSales =
                    topProducts[0]?.salesCount > 0
                      ? topProducts[0].salesCount
                      : 1;
                  return (
                    <div
                      key={product.id}
                      className="p-2 rounded-lg bg-site-raised border border-site-border-soft"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={cn(
                              "w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0",
                              index === 0
                                ? "bg-semantic-amber/15 text-semantic-amber border border-semantic-amber/20"
                                : index === 1
                                  ? "bg-site-raised text-site-muted border border-site-border"
                                  : index === 2
                                    ? "bg-site-accent/12 text-site-accent border border-site-accent/20"
                                    : "bg-site-raised text-site-dim border border-site-border",
                            )}
                          >
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-site-text truncate">
                              {product.name}
                            </p>
                            <p className="text-[10px] text-site-dim">
                              {product.salesCount.toLocaleString()} ขาย
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-site-text shrink-0">
                          {formatCurrency(product.revenue)}
                        </span>
                      </div>
                      {/* relative volume bar */}
                      <div className="mt-1.5 h-1 w-full rounded-full bg-site-border-soft overflow-hidden">
                        <div
                          className="h-full rounded-full bg-site-accent/70"
                          style={{
                            width: `${Math.max(
                              (product.salesCount / maxSales) * 100,
                              4,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {topProducts.length === 0 && (
                  <div className="flex flex-col items-center py-8 gap-2 text-site-dim">
                    <Package className="w-6 h-6 opacity-40" />
                    <span className="text-xs">
                      ยังไม่มีข้อมูลสินค้าขายดี
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary metrics: conversion + categories + top customers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-site-surface border-site-border-soft rounded-12 shadow-none">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-site-text flex items-center gap-2">
                <Percent className="w-4 h-4 text-site-accent" />
                ภาพรวมเชิงลึก
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-site-raised border border-site-border-soft">
                <span className="text-xs text-site-muted">มูลค่าเฉลี่ย/ออเดอร์</span>
                <span className="text-sm font-bold text-site-text">
                  {formatCurrency(summary.avgOrderValue)}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-site-raised border border-site-border-soft">
                <span className="text-xs text-site-muted">อัตราการซื้อสำเร็จ</span>
                <span className="text-sm font-bold text-site-text">
                  {summary.conversionRate.toFixed(2)}%
                </span>
              </div>
              {data.dashboardStats && (
                <>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-site-raised border border-site-border-soft">
                    <span className="text-xs text-site-muted">สต็อกใกล้หมด</span>
                    <Badge variant={data.dashboardStats.products.lowStock > 0 ? "warning" : "neutral"}>
                      {data.dashboardStats.products.lowStock.toLocaleString()} รายการ
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-site-raised border border-site-border-soft">
                    <span className="text-xs text-site-muted">สต็อกหมด</span>
                    <Badge variant={data.dashboardStats.products.outOfStock > 0 ? "danger" : "neutral"}>
                      {data.dashboardStats.products.outOfStock.toLocaleString()} รายการ
                    </Badge>
                  </div>
                </>
              )}
              {data.userAnalytics && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-site-raised border border-site-border-soft">
                  <span className="text-xs text-site-muted">ผู้ใช้ทั้งหมด</span>
                  <span className="text-sm font-bold text-site-text">
                    {data.userAnalytics.totalUsers.toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-site-surface border-site-border-soft rounded-12 shadow-none">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-site-text flex items-center gap-2">
                <Layers className="w-4 h-4 text-site-accent" />
                หมวดหมู่ยอดนิยม
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {categoryPerformance.map((cat, index) => {
                const maxRevenue =
                  categoryPerformance[0]?.revenue > 0
                    ? categoryPerformance[0].revenue
                    : 1;
                return (
                  <div key={cat.categoryId}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-site-text truncate">
                        {index + 1}. {cat.categoryName}
                      </span>
                      <span className="text-[11px] text-site-muted shrink-0">
                        {formatCurrency(cat.revenue)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-site-border-soft overflow-hidden">
                      <div
                        className="h-full rounded-full bg-semantic-violet/70"
                        style={{
                          width: `${Math.max(
                            (cat.revenue / maxRevenue) * 100,
                            4,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {categoryPerformance.length === 0 && (
                <div className="flex flex-col items-center py-8 gap-2 text-site-dim">
                  <Layers className="w-6 h-6 opacity-40" />
                  <span className="text-xs">ยังไม่มีข้อมูลหมวดหมู่</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-site-surface border-site-border-soft rounded-12 shadow-none">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-site-text flex items-center gap-2">
                <Users className="w-4 h-4 text-site-accent" />
                ลูกค้ายอดซื้อสูงสุด
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {topUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-site-raised border border-site-border-soft"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold bg-site-accent/12 text-site-accent border border-site-accent/20 shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-site-text truncate">
                        {user.username}
                      </p>
                      <p className="text-[10px] text-site-dim">
                        {user.totalOrders.toLocaleString()} ออเดอร์
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-site-text shrink-0">
                    {formatCurrency(user.totalSpent)}
                  </span>
                </div>
              ))}
              {topUsers.length === 0 && (
                <div className="flex flex-col items-center py-8 gap-2 text-site-dim">
                  <Users className="w-6 h-6 opacity-40" />
                  <span className="text-xs">ยังไม่มีข้อมูลลูกค้า</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent activity table */}
        <Card className="bg-site-surface border-site-border-soft rounded-12 shadow-none overflow-hidden py-0 gap-0">
          <CardHeader className="px-4 py-3 border-b border-site-border-soft">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-site-text flex items-center gap-2">
                <Calendar className="w-4 h-4 text-site-accent" />
                กิจกรรมล่าสุด
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] text-site-muted"
                asChild
              >
                <Link href="/admin/orders">
                  ดูทั้งหมด
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="border-site-border-soft bg-site-raised hover:bg-transparent">
                  <TableHead className="h-auto px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> วันที่
                    </span>
                  </TableHead>
                  <TableHead className="h-auto px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">
                    รายการ
                  </TableHead>
                  <TableHead className="h-auto px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">
                    ลูกค้า
                  </TableHead>
                  <TableHead className="h-auto px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">
                    สถานะ
                  </TableHead>
                  <TableHead className="h-auto px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-site-dim">
                    จำนวนเงิน
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="border-site-border-soft hover:bg-site-raised/50"
                  >
                    <TableCell className="px-4 py-2.5 text-xs text-site-dim whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-xs font-medium">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-site-accent hover:underline"
                        title={`ดูรายละเอียดคำสั่งซื้อ ${order.orderNumber}`}
                      >
                        คำสั่งซื้อ #{order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-xs text-site-muted">
                      {order.user.username}
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-xs font-semibold text-site-text text-right whitespace-nowrap">
                      {formatCurrency(order.finalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
                {data.recentOrders.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="py-10">
                      <div className="flex flex-col items-center gap-2 text-site-dim">
                        <Inbox className="w-7 h-7 opacity-40" />
                        <span className="text-sm">
                          {t("dashboard.no_data")}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* subtle trend footnote */}
        {data.salesAnalytics && (
          <p className="flex items-center gap-1.5 text-[11px] text-site-dim">
            <TrendingUp className="w-3 h-3" />
            แนวโน้มรายได้
            <span
              className={cn(
                "inline-flex items-center font-semibold",
                data.salesAnalytics.revenueGrowth >= 0
                  ? "text-semantic-green"
                  : "text-semantic-rose",
              )}
            >
              {data.salesAnalytics.revenueGrowth >= 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {Math.abs(data.salesAnalytics.revenueGrowth).toFixed(2)}%
            </span>
            เทียบช่วงก่อนหน้า · อัปเดตล่าสุด{" "}
            {new Date().toLocaleTimeString("th-TH", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}

        {loading && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-site-raised border border-site-border rounded-full px-3 py-1.5 shadow-lg">
            <Loader2 className="w-3.5 h-3.5 text-site-accent animate-spin" />
            <span className="text-[11px] text-site-muted">กำลังรีเฟรช…</span>
          </div>
        )}
      </PageContainer>
    </AdminLayout>
  );
}
