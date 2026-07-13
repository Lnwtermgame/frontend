"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  Loader2,
  Package,
  RefreshCw,
  ShoppingCart,
  Users,
} from "lucide-react";
import {
  AdminLayout,
  AdminPageHeader,
  PageContainer,
  StatCard as StatCardPrimitive,
  StatusBadge,
} from "@/components/admin";
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
  { days: number; period: "7d" | "30d" | "90d" }
> = {
  "24h": { days: 1, period: "7d" },
  "7d": { days: 7, period: "7d" },
  "30d": { days: 30, period: "30d" },
  "90d": { days: 90, period: "90d" },
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(amount);

const formatPercent = (value: number) => Number(Math.abs(value).toFixed(2));

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
        : `${formatShortDate(start)}-${formatShortDate(end)}`;

    points.push({
      key: `${chunk[0].date}-${chunk[chunk.length - 1].date}`,
      label,
      revenue,
      orders,
    });
  }

  return points;
};

const getOrderStatusKey = (status: string): string => {
  switch (status) {
    case "COMPLETED":
      return "completed";
    case "PENDING":
      return "pending";
    case "PROCESSING":
      return "processing";
    case "CANCELLED":
      return "cancelled";
    case "FAILED":
      return "failed";
    default:
      return status.toLowerCase();
  }
};

const getOrderStatusClassName = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "bg-green-500/10 text-green-400 border-green-500/30/30";
    case "PENDING":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30/30";
    case "PROCESSING":
      return "bg-site-surface0/10 text-site-accent border-blue-500/30";
    case "CANCELLED":
    case "FAILED":
      return "bg-red-500/10 text-red-400 border-red-500/30/30";
    default:
      return "bg-site-raised text-gray-300 border-gray-500";
  }
};

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

  const salesChartData = useMemo(
    () => buildSalesChartPoints(data.revenueDaily, dateRange),
    [data.revenueDaily, dateRange],
  );

  const maxRevenue = useMemo(
    () => Math.max(...salesChartData.map((d) => d.revenue), 0),
    [salesChartData],
  );

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

      const csv = rows.map((row) => row.join(",")).join("\n");
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-site-accent animate-spin" />
        </div>
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
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="h-9 px-3 bg-site-raised border border-site-border rounded-lg text-sm font-medium text-site-text focus:outline-none focus:border-site-accent/60 transition-colors cursor-pointer"
              >
                <option value="24h">24 ชั่วโมง</option>
                <option value="7d">7 วัน</option>
                <option value="30d">30 วัน</option>
                <option value="90d">90 วัน</option>
              </select>
              <button
                onClick={fetchAnalyticsData}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-site-border bg-site-raised text-sm font-medium text-site-muted hover:bg-site-surface hover:text-site-text transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                รีเฟรช
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-site-border bg-site-raised text-sm font-medium text-site-muted hover:bg-site-surface hover:text-site-text transition-colors disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {isExporting ? "กำลังส่งออก..." : "ส่งออก"}
              </button>
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
          <div className="lg:col-span-2 bg-site-surface border border-site-border-soft rounded-12 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-site-text flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-site-accent" />
                ยอดขาย
              </h3>
            </div>
            <div className="h-48 flex items-end justify-between gap-2">
              {salesChartData.map((item, index) => {
                const rawHeight =
                  maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                const height = item.revenue > 0 ? Math.max(rawHeight, 8) : 0;
                const labelStep = salesChartData.length > 10 ? 2 : 1;
                const shouldShowLabel =
                  index % labelStep === 0 ||
                  index === salesChartData.length - 1;
                return (
                  <div
                    key={item.key}
                    className="flex-1 h-full flex flex-col items-center justify-end"
                  >
                    <div
                      className="w-full bg-site-accent rounded-t-md transition-all duration-500 min-h-[2px]"
                      style={{ height: `${height}%` }}
                      title={`${item.label}: ${formatCurrency(item.revenue)} (${item.orders.toLocaleString()} ออเดอร์)`}
                    />
                    <span className="text-[10px] text-site-dim mt-2 text-center leading-tight min-h-5">
                      {shouldShowLabel ? item.label : ""}
                    </span>
                  </div>
                );
              })}
              {salesChartData.length === 0 && (
                <div className="w-full h-full flex items-center justify-center text-sm text-site-dim">
                  ยังไม่มีข้อมูลยอดขาย
                </div>
              )}
            </div>
          </div>

          <div className="bg-site-surface border border-site-border-soft rounded-12 p-4">
            <h3 className="text-sm font-bold text-site-text flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-site-accent" />
              สินค้าขายดี
            </h3>
            <div className="space-y-2">
              {topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-site-raised border border-site-border-soft"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold ${
                        index === 0
                          ? "bg-semantic-amber/15 text-semantic-amber border border-semantic-amber/20"
                          : index === 1
                            ? "bg-site-raised text-site-muted border border-site-border"
                            : index === 2
                              ? "bg-site-accent/12 text-site-accent border border-site-accent/20"
                              : "bg-site-raised text-site-dim border border-site-border"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-site-text truncate">
                        {product.name}
                      </p>
                      <p className="text-[10px] text-site-dim">
                        {product.salesCount} ขาย
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-site-text shrink-0">
                    {formatCurrency(product.revenue)}
                  </span>
                </div>
              ))}
              {topProducts.length === 0 && (
                <div className="text-xs text-site-dim text-center py-6">
                  ยังไม่มีข้อมูลสินค้าขายดี
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent activity table */}
        <div className="bg-site-surface border border-site-border-soft rounded-12 overflow-hidden">
          <div className="px-4 py-3 border-b border-site-border-soft">
            <h3 className="text-sm font-bold text-site-text flex items-center gap-2">
              <Calendar className="w-4 h-4 text-site-accent" />
              กิจกรรมล่าสุด
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-site-raised">
                <tr className="border-b border-site-border-soft">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">วันที่</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">รายการ</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">ลูกค้า</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">สถานะ</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">จำนวน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-site-border-soft">
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-site-raised/50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-site-dim">
                      {new Date(order.createdAt).toLocaleDateString("th-TH")}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-medium">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-site-accent hover:underline"
                        title={`ดูรายละเอียดคำสั่งซื้อ ${order.orderNumber}`}
                      >
                        คำสั่งซื้อ #{order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-site-muted">
                      {order.user.username}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-site-text text-right">
                      {formatCurrency(order.finalAmount)}
                    </td>
                  </tr>
                ))}
                {data.recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-site-dim">
                      {t("dashboard.no_data")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageContainer>
    </AdminLayout>
  );
}
