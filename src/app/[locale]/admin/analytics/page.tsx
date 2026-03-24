"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ElementType,
} from "react";
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
      return "bg-[#181A1D]0/10 text-blue-400 border-blue-500/30";
    case "CANCELLED":
    case "FAILED":
      return "bg-red-500/10 text-red-400 border-red-500/30/30";
    default:
      return "bg-[#1A1C1E] text-gray-300 border-gray-500";
  }
};

export default function AdminAnalyticsPage() {
  const t = useTranslations("AdminPage");
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
      className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm p-2"
      
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className={`p-1.5 ${color}`}>
          <Icon className="h-3 w-3 text-white" />
        </div>
        <div
          className={`flex items-center text-[9px] font-medium ${
            change>= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {change >= 0 ? (
            <TrendingUp className="h-2.5 w-2.5 mr-1" />
          ) : (
            <TrendingDown className="h-2.5 w-2.5 mr-1" />
          )}
          {formatPercent(change)}%
        </div>
      </div>
      <h3 className="text-gray-400 text-[9px] font-medium">{title}</h3>
      <p className="text-base font-bold text-white mt-0.5">{value}</p>
    </motion.div>
  );

  if (!isInitialized || !isAdmin) {
    return (
      <AdminLayout title="วิเคราะห์">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-pink-400 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout title="วิเคราะห์">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-pink-400 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="วิเคราะห์">
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center">
            <span className="w-1.5 h-3.5 bg-pink-500 mr-2"></span>
            <h1 className="text-base font-bold text-white">วิเคราะห์</h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 text-white px-2 py-1 text-[10px] focus:border-site-accent focus:outline-none">
              <option value="24h">24 ชั่วโมง</option>
              <option value="7d">7 วัน</option>
              <option value="30d">30 วัน</option>
              <option value="90d">90 วัน</option>
            </select>
            <button
              onClick={fetchAnalyticsData}
              className="bg-[#212328] text-white border border-site-border/30 rounded-[12px] shadow-sm px-2 py-1 text-[10px] hover:bg-[#212328]/5 transition-colors flex items-center font-medium">
              <RefreshCw className="h-3 w-3 mr-1" />
              รีเฟรช
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="bg-black text-white border border-site-border/30 rounded-[12px] shadow-sm px-2 py-1 text-[10px] hover:bg-gray-800 transition-colors flex items-center font-medium disabled:opacity-70">
              <Download className="h-3 w-3 mr-1" />
              {isExporting ? "กำลังส่งออก..." : "ส่งออก"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-site-border/30 rounded-[12px] shadow-sm border-red-500/30/30 text-red-400 px-3 py-2 text-[10px]">
            ไม่สามารถโหลดข้อมูลได้: {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <StatCard
            title="รายได้ทั้งหมด"
            value={formatCurrency(statValues.revenue.current)}
            change={statValues.revenue.change}
            icon={DollarSign}
            color="bg-pink-500"
          />
          <StatCard
            title="คำสั่งซื้อ"
            value={statValues.orders.current.toLocaleString()}
            change={statValues.orders.change}
            icon={ShoppingCart}
            color="bg-orange-500/10"
          />
          <StatCard
            title="ลูกค้าใหม่"
            value={statValues.customers.current.toLocaleString()}
            change={statValues.customers.change}
            icon={Users}
            color="bg-site-accent"
          />
          <StatCard
            title="สินค้าทั้งหมด"
            value={statValues.products.current.toLocaleString()}
            change={statValues.products.change}
            icon={Package}
            color="bg-green-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          <motion.div
            className="lg:col-span-2 bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm p-2"
            
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <BarChart3 className="h-3 w-3 text-pink-400 mr-1.5" />
                <h3 className="text-xs font-semibold text-white">ยอดขาย</h3>
              </div>
            </div>
            <div className="h-40 flex items-end justify-between gap-2">
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
                    className="flex-1 h-full flex flex-col items-center justify-end">
                    <div
                      className={`w-full bg-pink-500 transition-all duration-500 ${
                        item.revenue > 0 ? "min-h-[2px]" : ""
                      }`}
                      style={{ height: `${height}%` }}
                      title={`${item.label}: ${formatCurrency(item.revenue)} (${item.orders.toLocaleString()} ออเดอร์)`}
                    ></div>
                    <span className="text-[8px] text-gray-500 mt-1.5 text-center leading-tight min-h-5">
                      {shouldShowLabel ? item.label : ""}
                    </span>
                  </div>
                );
              })}
              {salesChartData.length === 0 && (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">
                  ยังไม่มีข้อมูลยอดขาย
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm p-2"
            
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="flex items-center mb-2">
              <Package className="h-3 w-3 text-site-accent mr-1.5" />
              <h3 className="text-xs font-semibold text-white">สินค้าขายดี</h3>
            </div>
            <div className="space-y-1.5">
              {topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-1.5 bg-[#181A1D] border-[1px] border-site-border/30">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                        index === 0
                          ? "bg-yellow-400 text-white"
                          : index === 1
                            ? "bg-gray-300 text-white"
                            : index === 2
                              ? "bg-orange-300 text-white"
                              : "bg-site-border/30 text-gray-400"
                      }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-[10px] font-medium text-white">
                        {product.name}
                      </p>
                      <p className="text-[8px] text-gray-500">
                        {product.salesCount} ขาย
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-semibold text-white">
                    {formatCurrency(product.revenue)}
                  </span>
                </div>
              ))}
              {topProducts.length === 0 && (
                <div className="text-[10px] text-gray-500">
                  ยังไม่มีข้อมูลสินค้าขายดี
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm overflow-hidden"
          
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="p-2 border-b-[2px] border-site-border/50 bg-[#181A1D]">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 text-purple-400 mr-1.5" />
              <h3 className="text-xs font-semibold text-white">
                กิจกรรมล่าสุด
              </h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#181A1D] border-b-[1px] border-site-border/30">
                <tr>
                  <th className="text-left py-1.5 px-2 text-[9px] font-semibold text-white">
                    วันที่
                  </th>
                  <th className="text-left py-1.5 px-2 text-[9px] font-semibold text-white">
                    รายการ
                  </th>
                  <th className="text-left py-1.5 px-2 text-[9px] font-semibold text-white">
                    ลูกค้า
                  </th>
                  <th className="text-left py-1.5 px-2 text-[9px] font-semibold text-white">
                    สถานะ
                  </th>
                  <th className="text-right py-1.5 px-2 text-[9px] font-semibold text-white">
                    จำนวน
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-site-border/30">
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#212328]/5">
                    <td className="py-1.5 px-2 text-[9px] text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("th-TH")}
                    </td>
                    <td className="py-1.5 px-2 text-[9px] text-white font-medium">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="underline decoration-transparent hover:decoration-white transition-all"
                        title={`ดูรายละเอียดคำสั่งซื้อ ${order.orderNumber}`}
                      >
                        คำสั่งซื้อ #{order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-1.5 px-2 text-[9px] text-gray-400">
                      {order.user.username}
                    </td>
                    <td className="py-1.5 px-2">
                      <span
                        className={`px-1 py-0.5 text-[8px] font-medium rounded-full border-[1px] ${getOrderStatusClassName(
                          order.status,
                        )}`}>
                        {t(`orders.status.${getOrderStatusKey(order.status)}`)}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-[9px] text-white text-right font-medium">
                      {formatCurrency(order.finalAmount)}
                    </td>
                  </tr>
                ))}
                {data.recentOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-3 px-2 text-center text-[9px] text-gray-500">
                      {t("dashboard.no_data")}
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
