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
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { analyticsApi, DashboardStats, RecentOrder, PopularProduct } from "@/lib/services/analytics-api";
import { useAuth } from "@/lib/hooks/use-auth";
import Link from "next/link";

interface DashboardData {
  stats: DashboardStats | null;
  recentOrders: RecentOrder[];
  popularProducts: PopularProduct[];
}

export default function AdminDashboard() {
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
        setError("ไม่สามารถโหลดข้อมูลแดชบอร์ดได้");
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
        return "text-green-400 bg-green-900/30";
      case "PENDING":
        return "text-yellow-400 bg-yellow-900/30";
      case "PROCESSING":
        return "text-blue-400 bg-blue-900/30";
      case "CANCELLED":
        return "text-red-400 bg-red-900/30";
      case "FAILED":
        return "text-red-400 bg-red-900/30";
      default:
        return "text-gray-400 bg-gray-900/30";
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
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Show loading while auth is initializing or if not admin
  if (!isInitialized || !isAdmin) {
    return (
      <AdminLayout title="แดชบอร์ดผู้ดูแลระบบ">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-mali-blue animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout title="แดชบอร์ดผู้ดูแลระบบ">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-mali-blue animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const stats = data.stats;

  return (
    <AdminLayout title="แดชบอร์ดผู้ดูแลระบบ">
      <div className="space-y-8">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard
            title="ยอดขายทั้งหมด"
            value={stats ? formatCurrency(stats.sales.total) : "฿0"}
            change={stats?.sales.percent || 0}
            isPositive={stats?.sales.isUp ?? true}
            icon={<CircleDollarSign className="h-6 w-6" />}
            color="blue"
            subtitle={`วันนี้: ${stats ? formatCurrency(stats.sales.today) : "฿0"}`}
          />
          <StatsCard
            title="คำสั่งซื้อ"
            value={stats?.orders.total.toLocaleString() || "0"}
            change={stats?.orders.percent || 0}
            isPositive={stats?.orders.isUp ?? true}
            icon={<ShoppingCart className="h-6 w-6" />}
            color="purple"
            subtitle={`วันนี้: ${stats?.orders.today.toLocaleString() || "0"}`}
          />
          <StatsCard
            title="สินค้า"
            value={stats?.products.total.toLocaleString() || "0"}
            change={stats?.products.percent || 0}
            isPositive={true}
            icon={<Package className="h-6 w-6" />}
            color="emerald"
            subtitle={`ใช้งาน: ${stats?.products.active.toLocaleString() || "0"}`}
          />
          <StatsCard
            title="ผู้ใช้"
            value={stats?.users.total.toLocaleString() || "0"}
            change={stats?.users.percent || 0}
            isPositive={stats?.users.isUp ?? true}
            icon={<Users className="h-6 w-6" />}
            color="rose"
            subtitle={`ใหม่วันนี้: ${stats?.users.today.toLocaleString() || "0"}`}
          />
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickStatCard
            title="สินค้าใกล้หมด"
            value={stats?.products.lowStock || 0}
            icon={<Package className="h-5 w-5" />}
            color="orange"
            link="/admin/products"
          />
          <QuickStatCard
            title="สินค้าหมดสต็อก"
            value={stats?.products.outOfStock || 0}
            icon={<Package className="h-5 w-5" />}
            color="red"
            link="/admin/products"
          />
          <QuickStatCard
            title="ออเดอร์รอดำเนินการ"
            value={stats?.orders.byStatus?.PENDING || 0}
            icon={<Ticket className="h-5 w-5" />}
            color="yellow"
            link="/admin/orders"
          />
        </div>

        {/* Recent Orders & Popular Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <motion.div
            className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="p-5 border-b border-mali-blue/20 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white flex items-center thai-font">
                <Activity className="mr-2 h-5 w-5 text-mali-blue" />
                คำสั่งซื้อล่าสุด
              </h3>
              <Link href="/admin/orders" className="text-sm text-mali-blue hover:text-white transition-colors">
                ดูทั้งหมด →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-mali-blue/70 text-sm">
                    <th className="px-5 py-3 text-left">เลขที่</th>
                    <th className="px-5 py-3 text-left thai-font">ผู้ใช้</th>
                    <th className="px-5 py-3 text-left thai-font">จำนวน</th>
                    <th className="px-5 py-3 text-left thai-font">สถานะ</th>
                    <th className="px-5 py-3 text-left thai-font">วันที่</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mali-blue/10">
                  {data.recentOrders.length > 0 ? (
                    data.recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="text-sm hover:bg-mali-blue/5 transition-colors"
                      >
                        <td className="px-5 py-4 font-mono">
                          <Link href={`/admin/orders?id=${order.id}`} className="text-mali-blue hover:underline">
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <div className="text-white">{order.user.username}</div>
                            <div className="text-xs text-mali-blue/50">{order.user.email}</div>
                          </div>
                        </td>
                        <td className="px-5 py-4">{formatCurrency(order.finalAmount)}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusStyle(order.status)}`}
                          >
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-mali-blue/70 text-xs">
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-8 text-center text-gray-400"
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
            className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="p-5 border-b border-mali-blue/20 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white flex items-center thai-font">
                <TrendingUp className="mr-2 h-5 w-5 text-mali-blue" />
                สินค้าขายดี
              </h3>
              <Link href="/admin/products" className="text-sm text-mali-blue hover:text-white transition-colors">
                ดูทั้งหมด →
              </Link>
            </div>
            <div className="p-5">
              {data.popularProducts.length > 0 ? (
                <div className="space-y-4">
                  {data.popularProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="flex items-center space-x-4 p-3 rounded-lg bg-mali-background/50 hover:bg-mali-background transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-mali-blue/20 rounded-full text-mali-blue font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-mali-background overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-mali-blue/60">
                          ขายแล้ว {product.salesCount.toLocaleString()} ชิ้น
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          {formatCurrency(product.price)}
                        </p>
                        <p className={`text-xs ${product.stockQuantity <= 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                          คงเหลือ: {product.stockQuantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  ไม่มีข้อมูลสินค้า
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Links */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <QuickLinkCard
            title="จัดการสินค้า"
            description="เพิ่ม แก้ไข ลบสินค้า"
            icon={<Package className="h-5 w-5" />}
            href="/admin/products"
          />
          <QuickLinkCard
            title="จัดการคำสั่งซื้อ"
            description="ตรวจสอบและอัปเดตสถานะ"
            icon={<ShoppingCart className="h-5 w-5" />}
            href="/admin/orders"
          />
          <QuickLinkCard
            title="จัดการสินค้า"
            description="จัดการสินค้าทั้งหมด"
            icon={<Package className="h-5 w-5" />}
            href="/admin/products"
          />
          <QuickLinkCard
            title="ดูรายงาน"
            description="วิเคราะห์และสถิติ"
            icon={<TrendingUp className="h-5 w-5" />}
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
  blue: "from-blue-600/20 to-blue-800/20 border-blue-600/30",
  purple: "from-purple-600/20 to-purple-800/20 border-purple-600/30",
  emerald: "from-emerald-600/20 to-emerald-800/20 border-emerald-600/30",
  rose: "from-rose-600/20 to-rose-800/20 border-rose-600/30",
};

const iconColorClasses = {
  blue: "text-blue-500",
  purple: "text-purple-500",
  emerald: "text-emerald-500",
  rose: "text-rose-500",
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
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl border p-6 flex flex-col`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300 thai-font">
          {title}
        </span>
        <span
          className={`p-2 rounded-full bg-mali-card/40 ${iconColorClasses[color]}`}
        >
          {icon}
        </span>
      </div>

      <div className="mt-3">
        <span className="text-2xl font-bold text-white">{value}</span>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        )}
        <div className="flex items-center mt-2">
          <span
            className={`text-xs flex items-center ${isPositive ? "text-green-400" : "text-red-400"}`}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="h-3 w-3 mr-0.5" />
            )}
            {change}%
          </span>
          <span className="text-xs text-gray-400 ml-1 thai-font">
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
  orange: "bg-orange-500/20 border-orange-500/30 text-orange-400",
  red: "bg-red-500/20 border-red-500/30 text-red-400",
  yellow: "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
  blue: "bg-blue-500/20 border-blue-500/30 text-blue-400",
};

function QuickStatCard({ title, value, icon, color, link }: QuickStatCardProps) {
  return (
    <Link href={link}>
      <motion.div
        className={`p-4 rounded-xl border ${quickStatColorClasses[color]} flex items-center justify-between hover:opacity-80 transition-opacity`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center space-x-3">
          {icon}
          <span className="text-sm font-medium thai-font">{title}</span>
        </div>
        <span className="text-xl font-bold">{value.toLocaleString()}</span>
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
        className="bg-mali-card rounded-xl border border-mali-blue/20 p-4 hover:border-mali-blue/40 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-mali-blue/20 text-mali-blue">
            {icon}
          </div>
          <div>
            <h4 className="text-sm font-medium text-white thai-font">{title}</h4>
            <p className="text-xs text-gray-400 mt-0.5">{description}</p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
