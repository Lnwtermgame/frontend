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
        return "text-green-600 bg-green-100 border-green-200";
      case "PENDING":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "PROCESSING":
        return "text-blue-600 bg-blue-100 border-blue-200";
      case "CANCELLED":
        return "text-red-600 bg-red-100 border-red-200";
      case "FAILED":
        return "text-red-600 bg-red-100 border-red-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
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
          <Loader2 className="h-8 w-8 text-brutal-pink animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout title="แดชบอร์ดผู้ดูแลระบบ">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-brutal-pink animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const stats = data.stats;

  return (
    <AdminLayout title="แดชบอร์ดผู้ดูแลระบบ">
      <div className="space-y-4">
        {error && (
          <div className="bg-red-100 border-[3px] border-red-500 text-red-700 px-3 py-2 text-sm">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Recent Orders */}
          <motion.div
            className="bg-white border-[3px] border-black  overflow-hidden"
            style={{ boxShadow: "3px 3px 0 0 #000000" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="p-3 border-b-[2px] border-black flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-semibold text-black flex items-center thai-font">
                <span className="w-1.5 h-4 bg-brutal-pink mr-2"></span>
                <Activity className="mr-2 h-4 w-4 text-brutal-pink" />
                คำสั่งซื้อล่าสุด
              </h3>
              <Link
                href="/admin/orders"
                className="text-[10px] text-black hover:text-brutal-pink transition-colors font-medium"
              >
                ดูทั้งหมด →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-600 text-[10px] border-b border-gray-200">
                    <th className="px-3 py-2 text-left">เลขที่</th>
                    <th className="px-3 py-2 text-left thai-font">ผู้ใช้</th>
                    <th className="px-3 py-2 text-left thai-font">จำนวน</th>
                    <th className="px-3 py-2 text-left thai-font">สถานะ</th>
                    <th className="px-3 py-2 text-left thai-font">วันที่</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.recentOrders.length > 0 ? (
                    data.recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="text-[10px] hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-3 py-2 font-mono">
                          <Link
                            href={`/admin/orders?id=${order.id}`}
                            className="text-brutal-pink hover:underline font-medium"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-3 py-2">
                          <div>
                            <div className="text-black font-medium">
                              {order.user.username}
                            </div>
                            <div className="text-[9px] text-gray-500">
                              {order.user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-black font-medium">
                          {formatCurrency(order.finalAmount)}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs border-[1px] font-medium whitespace-nowrap ${getStatusStyle(order.status)}`}
                          >
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500 text-[9px]">
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-4 text-center text-gray-500 text-[10px]"
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
            className="bg-white border-[3px] border-black  overflow-hidden"
            style={{ boxShadow: "3px 3px 0 0 #000000" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="p-3 border-b-[2px] border-black flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-semibold text-black flex items-center thai-font">
                <span className="w-1.5 h-4 bg-brutal-blue mr-2"></span>
                <TrendingUp className="mr-2 h-4 w-4 text-brutal-blue" />
                สินค้าขายดี
              </h3>
              <Link
                href="/admin/products"
                className="text-[10px] text-black hover:text-brutal-pink transition-colors font-medium"
              >
                ดูทั้งหมด →
              </Link>
            </div>
            <div className="p-3">
              {data.popularProducts.length > 0 ? (
                <div className="space-y-2">
                  {data.popularProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="flex items-center space-x-3 p-2 bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-brutal-yellow border-[2px] border-black rounded text-black font-bold text-[10px]">
                        {index + 1}
                      </div>
                      <div className="flex-shrink-0 w-8 h-8 bg-white border-[2px] border-black overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-black truncate">
                          {product.name}
                        </p>
                        <p className="text-[9px] text-gray-500">
                          ขายแล้ว {product.salesCount.toLocaleString()} ชิ้น
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-medium text-black">
                          {formatPrice(getMinPrice(product.types))}
                        </p>
                        <p className="text-[9px] text-green-600 font-medium">
                          ขายแล้ว: {product.salesCount.toLocaleString()} ชิ้น
                        </p>
                      </div>
                    </div>
                  ))}
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
  blue: "bg-brutal-blue",
  purple: "bg-brutal-purple",
  emerald: "bg-brutal-green",
  rose: "bg-brutal-pink",
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
      className="bg-white border-[3px] border-black p-3 flex flex-col"
      style={{ boxShadow: "3px 3px 0 0 #000000" }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-gray-600 thai-font">
          {title}
        </span>
        <span className={`p-1 text-white ${colorClasses[color]}`}>{icon}</span>
      </div>

      <div className="mt-1.5">
        <span className="text-lg font-bold text-black">{value}</span>
        {subtitle && <p className="text-[9px] text-gray-500 mt-0.5">{subtitle}</p>}
        <div className="flex items-center mt-1">
          <span
            className={`text-[9px] flex items-center font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
          >
            {isPositive ? (
              <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="h-2.5 w-2.5 mr-0.5" />
            )}
            {change}%
          </span>
          <span className="text-[9px] text-gray-500 ml-1 thai-font">
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
  orange: "bg-orange-100 border-orange-300 text-orange-700",
  red: "bg-red-100 border-red-300 text-red-700",
  yellow: "bg-yellow-100 border-yellow-300 text-yellow-700",
  blue: "bg-blue-100 border-blue-300 text-blue-700",
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
        className={`p-2.5 border-[2px] ${quickStatColorClasses[color]} flex items-center justify-between hover:opacity-80 transition-opacity`}
        style={{ boxShadow: "3px 3px 0 0 #000000" }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center space-x-2">
          {icon}
          <span className="text-[10px] font-medium thai-font text-black">
            {title}
          </span>
        </div>
        <span className="text-base font-bold text-black">
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
        className="bg-white border-[3px] border-black p-2.5 hover:border-brutal-pink transition-colors"
        style={{ boxShadow: "3px 3px 0 0 #000000" }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-start space-x-2">
          <div className="p-1 bg-brutal-yellow border-[2px] border-black text-black">
            {icon}
          </div>
          <div>
            <h4 className="text-[10px] font-medium text-black thai-font">
              {title}
            </h4>
            <p className="text-[9px] text-gray-500 mt-0.5">{description}</p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
