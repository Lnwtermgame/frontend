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
        return "text-site-accent bg-site-accent/10 border-site-accent/20";
      case "PENDING":
        return "text-site-muted bg-site-raised border-site-border";
      case "PROCESSING":
        return "text-site-muted bg-site-raised border-site-border";
      case "CANCELLED":
      case "FAILED":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      default:
        return "text-site-muted bg-site-raised border-site-border";
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
          <Loader2 className="h-8 w-8 text-site-accent animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout title="แดชบอร์ดผู้ดูแลระบบ">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-site-accent animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const stats = data.stats;

  return (
    <AdminLayout title="แดชบอร์ดผู้ดูแลระบบ">
      <div className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30/30 rounded-xl text-red-400 px-3 py-2 text-sm">
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
            className="bg-site-surface rounded-2xl border border-white/5 overflow-hidden shadow-xl flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-site-accent/5 to-transparent">
              <h3 className="text-[14px] font-bold text-white flex items-center tracking-wide">
                <div className="w-1.5 h-4 bg-gradient-to-b from-site-accent to-site-accent/50 rounded-full mr-3 shadow-accent-glow"></div>
                <Activity className="mr-2 h-4 w-4 text-site-accent" />
                คำสั่งซื้อล่าสุด
              </h3>
              <Link
                href="/admin/orders"
                className="text-[11px] text-gray-400 hover:text-white hover:bg-white/5 px-2 py-1 rounded-lg transition-all font-medium"
              >
                ดูทั้งหมด →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-[11px] border-b border-white/5 bg-site-raised/50 w-full uppercase tracking-wider">
                    <th className="px-5 py-3 text-left font-bold">เลขที่</th>
                    <th className="px-5 py-3 text-left font-bold">ผู้ใช้</th>
                    <th className="px-5 py-3 text-left font-bold">จำนวน</th>
                    <th className="px-5 py-3 text-left font-bold">สถานะ</th>
                    <th className="px-5 py-3 text-left font-bold">วันที่</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.recentOrders.length > 0 ? (
                    data.recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="text-[12px] hover:bg-site-raised transition-colors group cursor-pointer"
                        onClick={() => router.push(`/admin/orders?id=${order.id}`)}
                      >
                        <td className="px-5 py-3.5 font-mono">
                          <span
                            className="text-gray-300 group-hover:text-site-accent transition-colors font-medium"
                          >
                            {order.orderNumber}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-site-raised flex items-center justify-center text-[10px] font-bold text-gray-400 border border-white/5 group-hover:border-site-accent/30 group-hover:text-site-accent transition-all">
                              {order.user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                {order.user.username}
                              </div>
                              <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
                                {order.user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-white font-bold opacity-90 group-hover:opacity-100">
                          {formatCurrency(order.finalAmount)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold whitespace-nowrap border tracking-wide uppercase ${getStatusStyle(order.status)}`}
                          >
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 text-[11px] group-hover:text-gray-400 transition-colors">
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-8 text-center text-gray-400 text-[12px]"
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
            className="bg-site-surface rounded-2xl border border-white/5 overflow-hidden shadow-xl flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-site-accent/5 to-transparent">
              <h3 className="text-[14px] font-bold text-white flex items-center tracking-wide">
                <div className="w-1.5 h-4 bg-gradient-to-b from-site-accent to-site-accent/50 rounded-full mr-3 shadow-accent-glow"></div>
                <TrendingUp className="mr-2 h-4 w-4 text-site-accent" />
                สินค้าขายดี
              </h3>
              <Link
                href="/admin/products"
                className="text-[11px] text-gray-400 hover:text-white hover:bg-white/5 px-2 py-1 rounded-lg transition-all font-medium"
              >
                ดูทั้งหมด →
              </Link>
            </div>
            <div className="p-4">
              {data.popularProducts.length > 0 ? (
                <div className="space-y-3">
                  {data.popularProducts.map((product, index) => {
                    const revenuePercent = product.totalRevenue && product.totalRevenue > 0
                      ? (product.revenue || 0) / product.totalRevenue * 100
                      : 0;
                    return (
                      <div
                        key={product.id}
                        className="relative flex items-center space-x-4 p-3 rounded-xl hover:bg-site-raised transition-all border border-transparent hover:border-white/5 overflow-hidden group cursor-pointer"
                        onClick={() => router.push(`/admin/products`)}
                      >
                        {/* Revenue percentage bar */}
                        {revenuePercent > 0 && (
                          <div
                            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-site-accent/10 to-transparent pointer-events-none"
                            style={{ width: `${revenuePercent}%` }}
                          />
                        )}
                        <div className="relative flex items-center space-x-4 w-full">
                          <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-[11px] font-bold ${index === 0 ? "bg-site-accent/10 text-site-accent border border-site-accent/20" :
                              index === 1 ? "bg-gray-400/10 text-gray-300 border border-gray-400/20" :
                                index === 2 ? "bg-site-accent/5 text-site-accent border border-site-accent/10" :
                                  "bg-site-raised text-gray-400 border border-white/5"
                            }`}>
                            {index + 1}
                          </div>
                          <div className="flex-shrink-0 w-10 h-10 bg-site-raised rounded-xl overflow-hidden border border-white/10 group-hover:border-white/20 transition-colors">
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
                            <p className="text-[13px] font-bold text-white truncate group-hover:text-site-accent transition-colors">
                              {product.name}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1">
                              ขายแล้ว <span className="text-gray-300 font-medium">{product.salesCount.toLocaleString()}</span> ชิ้น
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-[13px] font-black text-white">
                              {product.revenue ? formatCurrency(product.revenue) : formatPrice(getMinPrice(product.types))}
                            </p>
                            <p className="text-[10px] text-site-accent/80 font-bold mt-1 uppercase tracking-wider">
                              {revenuePercent > 0 ? `${revenuePercent.toFixed(1)}% REV` : `${product.salesCount.toLocaleString()} TOTAL`}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400 text-[11px]">
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
            icon={<Package className="h-3.5 w-3.5" />}
            href="/admin/products"
            color="orange"
          />
          <QuickLinkCard
            title="จัดการคำสั่งซื้อ"
            description="ตรวจสอบคำสั่งซื้อ"
            icon={<ShoppingCart className="h-3.5 w-3.5" />}
            href="/admin/orders"
            color="blue"
          />
          <QuickLinkCard
            title="ซิงค์ SEAGM"
            description="ดึงสินค้าจาก SEAGM"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            href="/admin/seagm-sync"
            color="emerald"
          />
          <QuickLinkCard
            title="ผู้ใช้งาน"
            description="จัดการสมาชิกระบบ"
            icon={<Users className="h-3.5 w-3.5" />}
            href="/admin/users"
            color="purple"
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
  blue: "bg-site-accent/10 text-site-accent border-site-accent/10",
  purple: "bg-site-accent/10 text-site-accent border-site-accent/10",
  emerald: "bg-site-accent/10 text-site-accent border-site-accent/10",
  rose: "bg-site-accent/10 text-site-accent border-site-accent/10",
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
      className="bg-site-surface rounded-2xl border border-white/5 p-5 flex flex-col shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${colorClasses[color]}`}></div>

      <div className="flex items-center justify-between relative z-10">
        <span className="text-[12px] font-bold text-gray-400 tracking-wider uppercase">
          {title}
        </span>
        <span className={`p-2 rounded-xl border ${colorClasses[color]} shadow-inner`}>{icon}</span>
      </div>

      <div className="mt-4 relative z-10">
        <span className="text-2xl font-black text-white">{value}</span>
        {subtitle && <p className="text-[11px] text-gray-400 mt-1 font-mono">{subtitle}</p>}
        <div className="flex items-center mt-3 pt-3 border-t border-white/5">
          <span
            className={`text-[11px] flex items-center font-bold px-1.5 py-0.5 rounded-md ${isPositive ? "bg-site-accent/10 text-site-accent border border-site-accent/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="h-3 w-3 mr-0.5" />
            )}
            {change}%
          </span>
          <span className="text-[10px] text-gray-400/80 ml-2 uppercase font-bold tracking-wider">
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
  orange: "from-site-accent/5 to-site-surface border-site-accent/20 text-site-accent",
  red: "from-site-accent/5 to-site-surface border-site-accent/20 text-site-accent",
  yellow: "from-site-accent/5 to-site-surface border-site-accent/20 text-site-accent",
  blue: "from-site-accent/5 to-site-surface border-site-accent/20 text-site-accent",
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
        className={`p-4 border rounded-2xl bg-gradient-to-r ${quickStatColorClasses[color]} flex items-center justify-between hover:border-white/20 transition-all shadow-xl hover:shadow-2xl overflow-hidden relative group`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center space-x-3 relative z-10">
          <div className="p-2 rounded-xl bg-site-raised/80 border border-white/5 shadow-inner group-hover:bg-[#2a2d35] transition-colors">{icon}</div>
          <span className="text-[12px] font-bold tracking-wide">
            {title}
          </span>
        </div>
        <span className="text-xl font-black text-white relative z-10">
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
  color?: "orange" | "blue" | "emerald" | "purple" | "default";
}

const linkColorClasses = {
  orange: "text-site-accent bg-site-accent/10 border-site-accent/20",
  blue: "text-site-accent bg-site-accent/10 border-site-accent/20",
  emerald: "text-site-accent bg-site-accent/10 border-site-accent/20",
  purple: "text-site-accent bg-site-accent/10 border-site-accent/20",
  default: "text-site-accent bg-site-accent/10 border-site-accent/20",
};

function QuickLinkCard({ title, description, icon, href, color = "default" }: QuickLinkCardProps) {
  return (
    <Link href={href}>
      <motion.div
        className="bg-site-surface rounded-2xl border border-white/5 p-4 hover:border-white/10 hover:bg-[#1a1c21] transition-all shadow-xl group relative overflow-hidden"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/[0.02] pointer-events-none"></div>
        <div className="flex flex-col space-y-3">
          <div className={`p-2.5 rounded-xl border w-fit ${linkColorClasses[color]} shrink-0 shadow-inner group-hover:scale-105 transition-transform`}>
            {icon}
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-white tracking-wide group-hover:text-gray-100 transition-colors">
              {title}
            </h4>
            <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{description}</p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
