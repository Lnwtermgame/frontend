"use client";

import { motion } from "@/lib/framer-exports";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CircleDollarSign,
  Package,
  Ticket,
  Users,
  TrendingUp,
  Activity,
  Loader2,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  analyticsApi,
  DashboardStats,
  RecentOrder,
  PopularProduct,
} from "@/lib/services/analytics-api";
import { getMinPrice, formatPrice } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/use-auth";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface DashboardData {
  stats: DashboardStats | null;
  recentOrders: RecentOrder[];
  popularProducts: PopularProduct[];
}

export default function AdminDashboard() {
  const t = useTranslations("AdminPage");
  const router = useRouter();
  const { isAdmin, isInitialized } = useAuth();

  const [data, setData] = useState<DashboardData>({
    stats: null,
    recentOrders: [],
    popularProducts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect non-admin users (wait for auth to initialize first)
  useEffect(() => {
    if (isInitialized && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, isInitialized, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Skip if not admin
      if (!isAdmin) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch all dashboard data in parallel
        const [statsRes, ordersRes, productsRes] = await Promise.all([
          analyticsApi.getDashboardStats(),
          analyticsApi.getRecentOrders(10),
          analyticsApi.getPopularProducts(5),
        ]);

        setData({
          stats: statsRes.data,
          recentOrders: ordersRes.data,
          popularProducts: productsRes.data,
        });
      } catch (err) {
        setError(t("dashboard.load_error"));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAdmin]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "PENDING":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30/20";
      case "PROCESSING":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "CANCELLED":
        return "text-red-400 bg-red-500/10 border-red-500/30/20";
      case "FAILED":
        return "text-red-400 bg-red-500/10 border-red-500/30/20";
      default:
        return "text-gray-400 bg-[#212328]/5 border-white/10";
    }
  };

  const getStatusText = (status: string) => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Show loading while auth is initializing or if not admin
  if (!isInitialized || !isAdmin) {
    return (
      <AdminLayout title="แดชบอร์ดผู้ดูแลระบบ">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-pink-500 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout title="แดชบอร์ดผู้ดูแลระบบ">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-pink-500 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const stats = data.stats;

  return (
    <AdminLayout title="แดชบอร์ดผู้ดูแลระบบ">
      <div className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30/30 rounded-[12px] text-red-400 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard
            title="ยอดขายทั้งหมด"
            value={stats ? formatCurrency(stats.sales.total) : "฿0"}
            change={stats?.sales.percent || 0}
            isPositive={stats?.sales.isUp ?? true}
            icon={<CircleDollarSign className="h-4 w-4" />}
            color="blue"
            subtitle={`วันนี้: ${stats ? formatCurrency(stats.sales.today) : "฿0"}`}
          />
          <StatsCard
            title="คำสั่งซื้อ"
            value={stats?.orders.total.toLocaleString() || "0"}
            change={stats?.orders.percent || 0}
            isPositive={stats?.orders.isUp ?? true}
            icon={<ShoppingCart className="h-4 w-4" />}
            color="purple"
            subtitle={`วันนี้: ${stats?.orders.today.toLocaleString() || "0"}`}
          />
          <StatsCard
            title="สินค้า"
            value={stats?.products.total.toLocaleString() || "0"}
            change={stats?.products.percent || 0}
            isPositive={true}
            icon={<Package className="h-4 w-4" />}
            color="emerald"
            subtitle={`ใช้งาน: ${stats?.products.active.toLocaleString() || "0"}`}
          />
          <StatsCard
            title="ผู้ใช้"
            value={stats?.users.total.toLocaleString() || "0"}
            change={stats?.users.percent || 0}
            isPositive={stats?.users.isUp ?? true}
            icon={<Users className="h-4 w-4" />}
            color="rose"
            subtitle={`ใหม่วันนี้: ${stats?.users.today.toLocaleString() || "0"}`}
          />
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <QuickStatCard
            title="สินค้าใกล้หมด"
            value={stats?.products.lowStock || 0}
            icon={<Package className="h-3 w-3" />}
            color="orange"
            link="/admin/products"
          />
          <QuickStatCard
            title="สินค้าหมดสต็อก"
            value={stats?.products.outOfStock || 0}
            icon={<Package className="h-3 w-3" />}
            color="red"
            link="/admin/products"
          />
          <QuickStatCard
            title="ออเดอร์รอดำเนินการ"
            value={stats?.orders.byStatus?.PENDING || 0}
            icon={<Ticket className="h-3 w-3" />}
            color="yellow"
            link="/admin/orders"
          />
        </div>

        {/* Recent Orders & Popular Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Orders */}
          <motion.div
            className="bg-[#212328] rounded-[16px] border border-white/5 overflow-hidden shadow-lg flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="px-4 py-3.5 border-b border-white/5 flex justify-between items-center bg-[#181A1D]/50">
              <h3 className="text-[13px] font-bold text-white flex items-center tracking-wide">
                <div className="w-1.5 h-4 bg-site-accent rounded-full mr-2.5"></div>
                <Activity className="mr-2 h-4 w-4 text-site-accent" />
                คำสั่งซื้อล่าสุด
              </h3>
              <Link
                href="/admin/orders"
                className="text-[11px] text-gray-400 hover:text-white transition-colors font-medium"
              >
                ดูทั้งหมด →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-[11px] border-b border-white/5 bg-[#181A1D]/30 w-full">
                    <th className="px-4 py-3 text-left font-medium tracking-wider">เลขที่</th>
                    <th className="px-4 py-3 text-left font-medium tracking-wider">ผู้ใช้</th>
                    <th className="px-4 py-3 text-left font-medium tracking-wider">จำนวน</th>
                    <th className="px-4 py-3 text-left font-medium tracking-wider">สถานะ</th>
                    <th className="px-4 py-3 text-left font-medium tracking-wider">วันที่</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.recentOrders.length > 0 ? (
                    data.recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="text-[11px] hover:bg-[#212328]/5 transition-colors group"
                      >
                        <td className="px-4 py-3 font-mono">
                          <Link
                            href={`/admin/orders?id=${order.id}`}
                            className="text-site-accent hover:text-white transition-colors font-medium"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-white font-medium">
                              {order.user.username}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {order.user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white font-bold">
                          {formatCurrency(order.finalAmount)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold whitespace-nowrap border ${getStatusStyle(order.status)}`}
                          >
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-[10px]">
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-gray-500 text-[12px]"
                      >
                        ไม่มีคำสั่งซื้อล่าสุด
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Popular Products */}
          <motion.div
            className="bg-[#212328] rounded-[16px] border border-white/5 overflow-hidden shadow-lg flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="px-4 py-3.5 border-b border-white/5 flex justify-between items-center bg-[#181A1D]/50">
              <h3 className="text-[13px] font-bold text-white flex items-center tracking-wide">
                <div className="w-1.5 h-4 bg-site-accent rounded-full mr-2.5"></div>
                <TrendingUp className="mr-2 h-4 w-4 text-site-accent" />
                สินค้าขายดี
              </h3>
              <Link
                href="/admin/products"
                className="text-[11px] text-gray-400 hover:text-white transition-colors font-medium"
              >
                ดูทั้งหมด →
              </Link>
            </div>
            <div className="p-3">
              {data.popularProducts.length > 0 ? (
                <div className="space-y-2">
                  {data.popularProducts.map((product, index) => {
                    const revenuePercent = product.totalRevenue && product.totalRevenue > 0
                      ? (product.revenue || 0) / product.totalRevenue * 100
                      : 0;
                    return (
                      <div
                        key={product.id}
                        className="relative flex items-center space-x-3.5 p-2.5 rounded-xl hover:bg-[#212328]/5 transition-colors border border-transparent hover:border-white/5 overflow-hidden group"
                      >
                        {/* Revenue percentage bar */}
                        {revenuePercent > 0 && (
                          <div
                            className="absolute left-0 top-0 bottom-0 bg-site-accent/5 pointer-events-none"
                            style={{ width: `${revenuePercent}%` }}
                          />
                        )}
                        <div className="relative flex items-center space-x-3.5 w-full">
                          <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-[#1A1C1E] rounded-md text-gray-400 font-bold text-[11px] group-hover:text-site-accent transition-colors">
                            {index + 1}
                          </div>
                          <div className="flex-shrink-0 w-9 h-9 bg-[#1A1C1E] rounded-lg overflow-hidden border border-white/10">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                <Package className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-white truncate">
                              {product.name}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              ขายแล้ว <span className="text-gray-300 font-medium">{product.salesCount.toLocaleString()}</span> ชิ้น
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-[12px] font-bold text-white">
                              {product.revenue ? formatCurrency(product.revenue) : formatPrice(getMinPrice(product.types))}
                            </p>
                            <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                              {revenuePercent > 0 ? `${revenuePercent.toFixed(1)}% ของรายได้` : `${product.salesCount.toLocaleString()} ชิ้น`}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-[10px]">
                  ไม่มีข้อมูลสินค้า
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Links */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <QuickLinkCard
            title="จัดการสินค้า"
            description="เพิ่ม แก้ไข ลบสินค้า"
            icon={<Package className="h-3 w-3" />}
            href="/admin/products"
          />
          <QuickLinkCard
            title="จัดการคำสั่งซื้อ"
            description="ตรวจสอบและอัปเดตสถานะ"
            icon={<ShoppingCart className="h-3 w-3" />}
            href="/admin/orders"
          />
          <QuickLinkCard
            title="ซิงค์ SEAGM"
            description="ดึงข้อมูลสินค้าจาก SEAGM"
            icon={<RefreshCw className="h-3 w-3" />}
            href="/admin/seagm-sync"
          />
          <QuickLinkCard
            title="ดูรายงาน"
            description="วิเคราะห์และสถิติ"
            icon={<TrendingUp className="h-3 w-3" />}
            href="/admin/analytics"
          />
        </motion.div>
      </div>
    </AdminLayout>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  change: number;
  isPositive: boolean;
  icon: React.ReactNode;
  color: "blue" | "purple" | "emerald" | "rose";
  subtitle?: string;
}

const colorClasses = {
  blue: "bg-blue-500/10 text-blue-400",
  purple: "bg-purple-500/10 text-purple-400",
  emerald: "bg-emerald-500/10 text-emerald-400",
  rose: "bg-rose-500/10 text-rose-400",
};

function StatsCard({
  title,
  value,
  change,
  isPositive,
  icon,
  color,
  subtitle,
}: StatsCardProps) {
  return (
    <motion.div
      className="bg-[#212328] rounded-[16px] border border-white/5 p-4 flex flex-col shadow-lg"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-gray-400 tracking-wide">
          {title}
        </span>
        <span className={`p-1.5 rounded-lg ${colorClasses[color]}`}>{icon}</span>
      </div>

      <div className="mt-2">
        <span className="text-xl font-bold text-white">{value}</span>
        {subtitle && <p className="text-[10px] text-gray-400 mt-1">{subtitle}</p>}
        <div className="flex items-center mt-1.5">
          <span
            className={`text-[10px] flex items-center font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="h-3 w-3 mr-0.5" />
            )}
            {change}%
          </span>
          <span className="text-[10px] text-gray-500 ml-1.5">
            เทียบกับเดือนที่แล้ว
          </span>
        </div>
      </div>
    </motion.div>
  );
}

interface QuickStatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "orange" | "red" | "yellow" | "blue";
  link: string;
}

const quickStatColorClasses = {
  orange: "bg-[#212328] border-orange-500/20 text-orange-400",
  red: "bg-[#212328] border-red-500/30/20 text-red-400",
  yellow: "bg-[#212328] border-yellow-500/30/20 text-yellow-400",
  blue: "bg-[#212328] border-blue-500/20 text-blue-400",
};

function QuickStatCard({
  title,
  value,
  icon,
  color,
  link,
}: QuickStatCardProps) {
  return (
    <Link href={link}>
      <motion.div
        className={`p-3 border rounded-[16px] ${quickStatColorClasses[color]} flex items-center justify-between hover:bg-[#212328]/5 transition-colors shadow-lg`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-[#212328]/5">{icon}</div>
          <span className="text-[11px] font-bold tracking-wide">
            {title}
          </span>
        </div>
        <span className="text-lg font-bold text-white">
          {value.toLocaleString()}
        </span>
      </motion.div>
    </Link>
  );
}

interface QuickLinkCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

function QuickLinkCard({ title, description, icon, href }: QuickLinkCardProps) {
  return (
    <Link href={href}>
      <motion.div
        className="bg-[#212328] rounded-[16px] border border-white/5 p-3.5 hover:border-site-accent/50 transition-colors shadow-lg"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-[#212328]/5 rounded-xl text-site-accent shrink-0">
            {icon}
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-white tracking-wide">
              {title}
            </h4>
            <p className="text-[10px] text-gray-400 mt-1">{description}</p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
