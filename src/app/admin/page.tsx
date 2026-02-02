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
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { productApi } from "@/lib/services/product-api";
import { orderApi } from "@/lib/services/order-api";
import { useAuth } from "@/lib/hooks/use-auth";
import Link from "next/link";

interface DashboardStats {
  sales: {
    total: string;
    percent: number;
    isUp: boolean;
  };
  orders: {
    total: number;
    percent: number;
    isUp: boolean;
  };
  products: {
    total: number;
    percent: number;
    isUp: boolean;
  };
  users: {
    total: number;
    percent: number;
    isUp: boolean;
  };
}

interface RecentOrder {
  id: string;
  user: string;
  product: string;
  amount: number;
  status: string;
  date: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { isAdmin, isInitialized } = useAuth();

  // Redirect non-admin users (wait for auth to initialize first)
  useEffect(() => {
    if (isInitialized && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, isInitialized, router]);

  const [stats, setStats] = useState<DashboardStats>({
    sales: { total: "0.00", percent: 0, isUp: true },
    orders: { total: 0, percent: 0, isUp: true },
    products: { total: 0, percent: 0, isUp: true },
    users: { total: 0, percent: 0, isUp: true },
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Skip if not admin
      if (!isAdmin) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch products
        const productsRes = await productApi.getProducts({ limit: 1 });
        const productsTotal = productsRes.meta.total;

        // Fetch orders
        const ordersRes = await orderApi.getAllOrders(1, 5);
        const ordersTotal = ordersRes.meta?.total || 0;
        const orders = ordersRes.data;

        // Calculate total sales from orders
        const totalSales = orders.reduce(
          (sum, order: any) => sum + (order.totalAmount || 0),
          0,
        );

        setStats({
          sales: {
            total: totalSales.toFixed(2),
            percent: 12.5, // Placeholder - need analytics API
            isUp: true,
          },
          orders: {
            total: ordersTotal,
            percent: 8.2, // Placeholder
            isUp: true,
          },
          products: {
            total: productsTotal,
            percent: 3.1, // Placeholder
            isUp: false,
          },
          users: {
            total: 2489, // Placeholder - need user API
            percent: 18.3,
            isUp: true,
          },
        });

        // Map recent orders
        const mappedOrders: RecentOrder[] = orders
          .slice(0, 5)
          .map((order: any) => ({
            id: order.id,
            user: order.user?.email || order.user?.username || "Unknown",
            product: order.items?.[0]?.productName || "Multiple items",
            amount: order.totalAmount || 0,
            status: order.status,
            date: new Date(order.createdAt).toLocaleDateString("th-TH"),
          }));

        setRecentOrders(mappedOrders);
      } catch (err) {
        setError("Failed to load dashboard data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAdmin]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400 bg-green-900/30";
      case "pending":
        return "text-yellow-400 bg-yellow-900/30";
      case "processing":
        return "text-blue-400 bg-blue-900/30";
      case "cancelled":
        return "text-red-400 bg-red-900/30";
      default:
        return "text-gray-400 bg-gray-900/30";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "เสร็จสมบูรณ์";
      case "pending":
        return "รอดำเนินการ";
      case "processing":
        return "กำลังดำเนินการ";
      case "cancelled":
        return "ยกเลิก";
      default:
        return status;
    }
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
            value={`${stats.sales.total} ฿`}
            change={stats.sales.percent}
            isPositive={stats.sales.isUp}
            icon={<CircleDollarSign className="h-6 w-6" />}
            color="blue"
          />
          <StatsCard
            title="คำสั่งซื้อ"
            value={stats.orders.total}
            change={stats.orders.percent}
            isPositive={stats.orders.isUp}
            icon={<Package className="h-6 w-6" />}
            color="purple"
          />
          <StatsCard
            title="สินค้า"
            value={stats.products.total}
            change={stats.products.percent}
            isPositive={stats.products.isUp}
            icon={<Ticket className="h-6 w-6" />}
            color="emerald"
          />
          <StatsCard
            title="ผู้ใช้"
            value={stats.users.total}
            change={stats.users.percent}
            isPositive={stats.users.isUp}
            icon={<Users className="h-6 w-6" />}
            color="rose"
          />
        </div>

        {/* Recent Transactions */}
        <motion.div
          className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="p-5 border-b border-mali-blue/20 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white flex items-center thai-font">
              <Activity className="mr-2 h-5 w-5 text-mali-blue" />
              ธุรกรรมล่าสุด
            </h3>
            <Link href="/admin/orders">
              <button className="text-sm text-mali-blue hover:text-white transition-colors">
                ดูทั้งหมด →
              </button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-mali-blue/70 text-sm">
                  <th className="px-5 py-3 text-left">ID</th>
                  <th className="px-5 py-3 text-left thai-font">ผู้ใช้</th>
                  <th className="px-5 py-3 text-left thai-font">สินค้า</th>
                  <th className="px-5 py-3 text-left thai-font">จำนวน</th>
                  <th className="px-5 py-3 text-left thai-font">สถานะ</th>
                  <th className="px-5 py-3 text-left thai-font">วันที่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mali-blue/10">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order, i) => (
                    <tr
                      key={order.id}
                      className="text-sm hover:bg-mali-blue/5 transition-colors"
                    >
                      <td className="px-5 py-4">#{order.id.slice(0, 8)}</td>
                      <td className="px-5 py-4">{order.user}</td>
                      <td className="px-5 py-4">{order.product}</td>
                      <td className="px-5 py-4">{order.amount.toFixed(2)} ฿</td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${getStatusStyle(order.status)}`}
                        >
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-mali-blue/70">
                        {order.date}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-gray-400"
                    >
                      ไม่มีธุรกรรมล่าสุด
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Reports and Analytics */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="bg-mali-card rounded-xl border border-mali-blue/20 p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center thai-font">
              <TrendingUp className="mr-2 h-5 w-5 text-mali-blue" />
              ภาพรวมการขาย
            </h3>
            <div className="h-64 flex items-center justify-center">
              <div className="text-mali-blue/50 thai-font">
                แผนภูมิการขายจะแสดงที่นี่ (ต้องการ Analytics API)
              </div>
            </div>
          </div>

          <div className="bg-mali-card rounded-xl border border-mali-blue/20 p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center thai-font">
              <Package className="mr-2 h-5 w-5 text-mali-blue" />
              สินค้ายอดนิยม
            </h3>
            <div className="space-y-4">
              <div className="text-mali-blue/50 thai-font text-center py-8">
                ข้อมูลสินค้ายอดนิยมจะแสดงที่นี่ (ต้องการ Analytics API)
              </div>
            </div>
          </div>
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
        <div className="flex items-center mt-1">
          <span
            className={`text-xs ${isPositive ? "text-green-400" : "text-red-400"}`}
          >
            {isPositive ? "↑" : "↓"} {change}%
          </span>
          <span className="text-xs text-gray-400 ml-1 thai-font">
            เทียบกับเดือนที่แล้ว
          </span>
        </div>
      </div>
    </motion.div>
  );
}
