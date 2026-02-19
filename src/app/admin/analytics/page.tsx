"use client";

import { useCallback, useEffect, useMemo, useState, type ElementType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  Loader2,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  analyticsApi,
  DashboardStats,
  ProductAnalytics,
  RecentOrder,
  RevenueData,
  SalesAnalytics,
  UserAnalytics,
} from "@/lib/services/analytics-api";
import { motion } from "@/lib/framer-exports";
import { useAuth } from "@/lib/hooks/use-auth";

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

const getOrderStatusText = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "สำเร็จ";
    case "PENDING":
      return "รอดำเนินการ";
    case "PROCESSING":
      return "กำลังดำเนินการ";
    case "CANCELLED":
      return "ยกเลิก";
    case "FAILED":
      return "ล้มเหลว";
    default:
      return status;
  }
};

const getOrderStatusClassName = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-700 border-green-500";
    case "PENDING":
      return "bg-yellow-100 text-yellow-700 border-yellow-500";
    case "PROCESSING":
      return "bg-blue-100 text-blue-700 border-blue-500";
    case "CANCELLED":
    case "FAILED":
      return "bg-red-100 text-red-700 border-red-500";
    default:
      return "bg-gray-100 text-gray-700 border-gray-500";
  }
};

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { isAdmin, isInitialized } = useAuth();

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

  useEffect(() => {
    if (isInitialized && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, isInitialized, router]);

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
          (
            dateRange === "24h"
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

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string;
    change: number;
    icon: ElementType;
    color: string;
  }) => (
    <motion.div
      className="bg-white border-[3px] border-black p-6"
      style={{ boxShadow: "4px 4px 0 0 #000000" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div
          className={`flex items-center text-sm font-medium ${
            change >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {change >= 0 ? (
            <TrendingUp className="h-4 w-4 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 mr-1" />
          )}
          {formatPercent(change)}%
        </div>
      </div>
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-black mt-1">{value}</p>
    </motion.div>
  );

  if (!isInitialized || !isAdmin) {
    return (
      <AdminLayout title="วิเคราะห์">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-brutal-pink animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout title="วิเคราะห์">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-brutal-pink animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="วิเคราะห์">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <span className="w-1.5 h-6 bg-brutal-pink mr-2"></span>
            <h1 className="text-2xl font-bold text-black">วิเคราะห์</h1>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-white border-[2px] border-gray-300 text-black px-4 py-2 focus:border-black focus:outline-none"
            >
              <option value="24h">24 ชั่วโมง</option>
              <option value="7d">7 วัน</option>
              <option value="30d">30 วัน</option>
              <option value="90d">90 วัน</option>
            </select>
            <button
              onClick={fetchAnalyticsData}
              className="bg-white text-black border-[3px] border-black px-4 py-2 hover:bg-gray-50 transition-colors flex items-center font-medium"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              รีเฟรช
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="bg-black text-white border-[3px] border-black px-4 py-2 hover:bg-gray-800 transition-colors flex items-center font-medium disabled:opacity-70"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "กำลังส่งออก..." : "ส่งออก"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border-[3px] border-red-500 text-red-700 px-4 py-3">
            ไม่สามารถโหลดข้อมูลได้: {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="รายได้ทั้งหมด"
            value={formatCurrency(statValues.revenue.current)}
            change={statValues.revenue.change}
            icon={DollarSign}
            color="bg-brutal-pink"
          />
          <StatCard
            title="คำสั่งซื้อ"
            value={statValues.orders.current.toLocaleString()}
            change={statValues.orders.change}
            icon={ShoppingCart}
            color="bg-brutal-yellow"
          />
          <StatCard
            title="ลูกค้าใหม่"
            value={statValues.customers.current.toLocaleString()}
            change={statValues.customers.change}
            icon={Users}
            color="bg-brutal-blue"
          />
          <StatCard
            title="สินค้าทั้งหมด"
            value={statValues.products.current.toLocaleString()}
            change={statValues.products.change}
            icon={Package}
            color="bg-brutal-green"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            className="lg:col-span-2 bg-white border-[3px] border-black p-6"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 text-brutal-pink mr-2" />
                <h3 className="text-lg font-semibold text-black">ยอดขาย</h3>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between gap-2">
              {salesChartData.map((item, index) => {
                const rawHeight =
                  maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                const height = item.revenue > 0 ? Math.max(rawHeight, 8) : 0;
                const labelStep = salesChartData.length > 10 ? 2 : 1;
                const shouldShowLabel = index % labelStep === 0 || index === salesChartData.length - 1;
                return (
                  <div key={item.key} className="flex-1 h-full flex flex-col items-center justify-end">
                    <div
                      className={`w-full bg-brutal-pink transition-all duration-500 ${
                        item.revenue > 0 ? "min-h-[2px]" : ""
                      }`}
                      style={{ height: `${height}%` }}
                      title={`${item.label}: ${formatCurrency(item.revenue)} (${item.orders.toLocaleString()} ออเดอร์)`}
                    ></div>
                    <span className="text-[10px] sm:text-xs text-gray-500 mt-2 text-center leading-tight min-h-8">
                      {shouldShowLabel ? item.label : ""}
                    </span>
                  </div>
                );
              })}
              {salesChartData.length === 0 && (
                <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
                  ยังไม่มีข้อมูลยอดขาย
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            className="bg-white border-[3px] border-black p-6"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="flex items-center mb-6">
              <Package className="h-5 w-5 text-brutal-blue mr-2" />
              <h3 className="text-lg font-semibold text-black">สินค้าขายดี</h3>
            </div>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-gray-50 border-[2px] border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0
                          ? "bg-yellow-400 text-black"
                          : index === 1
                            ? "bg-gray-300 text-black"
                            : index === 2
                              ? "bg-orange-300 text-black"
                              : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-black">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.salesCount} ขาย</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-black">
                    {formatCurrency(product.revenue)}
                  </span>
                </div>
              ))}
              {topProducts.length === 0 && (
                <div className="text-sm text-gray-500">ยังไม่มีข้อมูลสินค้าขายดี</div>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          className="bg-white border-[3px] border-black overflow-hidden"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="p-5 border-b-[2px] border-black bg-gray-50">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-brutal-purple mr-2" />
              <h3 className="text-lg font-semibold text-black">กิจกรรมล่าสุด</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-[2px] border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-black">
                    วันที่
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-black">
                    รายการ
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-black">
                    ลูกค้า
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-black">
                    สถานะ
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-black">
                    จำนวน
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString("th-TH")}
                    </td>
                    <td className="py-3 px-4 text-sm text-black font-medium">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="underline decoration-transparent hover:decoration-black transition-all"
                        title={`ดูรายละเอียดคำสั่งซื้อ ${order.orderNumber}`}
                      >
                        คำสั่งซื้อ #{order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {order.user.username}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full border-[2px] ${getOrderStatusClassName(
                          order.status,
                        )}`}
                      >
                        {getOrderStatusText(order.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-black text-right font-medium">
                      {formatCurrency(order.finalAmount)}
                    </td>
                  </tr>
                ))}
                {data.recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 px-4 text-center text-sm text-gray-500">
                      ยังไม่มีกิจกรรมล่าสุด
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
