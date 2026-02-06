"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "@/lib/framer-exports";
import {
  TrendingUp,
  Users,
  Package,
  ShoppingCart,
  Loader2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  analyticsApi,
  SalesAnalytics,
  UserAnalytics,
  ProductAnalytics,
  OrderAnalytics,
} from "@/lib/services/analytics-api";

type TabType = "sales" | "users" | "products" | "orders";

export default function AnalyticsPage() {
  const router = useRouter();
  const { isAdmin, isInitialized } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("sales");
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [salesData, setSalesData] = useState<SalesAnalytics | null>(null);
  const [usersData, setUsersData] = useState<UserAnalytics | null>(null);
  const [productsData, setProductsData] = useState<ProductAnalytics | null>(null);
  const [ordersData, setOrdersData] = useState<OrderAnalytics | null>(null);

  useEffect(() => {
    if (isInitialized && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, isInitialized, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAdmin) return;

      try {
        setLoading(true);
        setError(null);

        switch (activeTab) {
          case "sales":
            const salesRes = await analyticsApi.getSalesAnalytics(period);
            setSalesData(salesRes.data);
            break;
          case "users":
            const usersRes = await analyticsApi.getUserAnalytics();
            setUsersData(usersRes.data);
            break;
          case "products":
            const productsRes = await analyticsApi.getProductAnalytics();
            setProductsData(productsRes.data);
            break;
          case "orders":
            const ordersRes = await analyticsApi.getOrderAnalytics();
            setOrdersData(ordersRes.data);
            break;
        }
      } catch (err) {
        setError("ไม่สามารถโหลดข้อมูล analytics ได้");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, period, isAdmin]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('th-TH').format(num);
  };

  if (!isInitialized || !isAdmin) {
    return (
      <AdminLayout title="Analytics & Statistics">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-mali-blue animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Analytics & Statistics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white thai-font">วิเคราะห์และสถิติ</h1>
            <p className="text-gray-400 mt-1">ดูข้อมูลเชิงลึกเกี่ยวกับยอดขาย ผู้ใช้ สินค้า และคำสั่งซื้อ</p>
          </div>

          {/* Period Selector */}
          {activeTab === "sales" && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-mali-blue" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-mali-card border border-mali-blue/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-mali-blue"
              >
                <option value="7d">7 วัน</option>
                <option value="30d">30 วัน</option>
                <option value="90d">90 วัน</option>
                <option value="1y">1 ปี</option>
              </select>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <TabButton
            active={activeTab === "sales"}
            onClick={() => setActiveTab("sales")}
            icon={<TrendingUp className="h-5 w-5" />}
            label="ยอดขาย"
          />
          <TabButton
            active={activeTab === "users"}
            onClick={() => setActiveTab("users")}
            icon={<Users className="h-5 w-5" />}
            label="ผู้ใช้"
          />
          <TabButton
            active={activeTab === "products"}
            onClick={() => setActiveTab("products")}
            icon={<Package className="h-5 w-5" />}
            label="สินค้า"
          />
          <TabButton
            active={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
            icon={<ShoppingCart className="h-5 w-5" />}
            label="คำสั่งซื้อ"
          />
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 text-mali-blue animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === "sales" && salesData && (
              <SalesTab data={salesData} formatCurrency={formatCurrency} formatNumber={formatNumber} />
            )}
            {activeTab === "users" && usersData && (
              <UsersTab data={usersData} formatNumber={formatNumber} />
            )}
            {activeTab === "products" && productsData && (
              <ProductsTab data={productsData} formatCurrency={formatCurrency} formatNumber={formatNumber} />
            )}
            {activeTab === "orders" && ordersData && (
              <OrdersTab data={ordersData} formatCurrency={formatCurrency} formatNumber={formatNumber} />
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
        active
          ? "bg-mali-blue text-white"
          : "bg-mali-card text-gray-400 hover:text-white border border-mali-blue/20"
      }`}
    >
      {icon}
      <span className="thai-font">{label}</span>
    </button>
  );
}

function SalesTab({
  data,
  formatCurrency,
  formatNumber,
}: {
  data: SalesAnalytics;
  formatCurrency: (amount: number) => string;
  formatNumber: (num: number) => string;
}) {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="รายได้ทั้งหมด"
          value={formatCurrency(data.totalRevenue)}
          change={data.revenueGrowth}
          icon={<TrendingUp className="h-6 w-6" />}
          color="blue"
        />
        <MetricCard
          title="จำนวนคำสั่งซื้อ"
          value={formatNumber(data.totalOrders)}
          change={data.orderGrowth}
          icon={<ShoppingCart className="h-6 w-6" />}
          color="purple"
        />
        <MetricCard
          title="มูลค่าคำสั่งซื้อเฉลี่ย"
          value={formatCurrency(data.averageOrderValue)}
          change={0}
          icon={<TrendingUp className="h-6 w-6" />}
          color="emerald"
        />
      </div>

      {/* Conversion Rate */}
      <motion.div
        className="bg-mali-card rounded-xl border border-mali-blue/20 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-lg font-semibold text-white mb-4 thai-font">อัตราการแปลง</h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Conversion Rate</span>
              <span className="text-white font-bold">{data.conversionRate.toFixed(2)}%</span>
            </div>
            <div className="h-3 bg-mali-background rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-mali-blue to-mali-gold rounded-full"
                style={{ width: `${Math.min(data.conversionRate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function UsersTab({
  data,
  formatNumber,
}: {
  data: UserAnalytics;
  formatNumber: (num: number) => string;
}) {
  return (
    <div className="space-y-6">
      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="ผู้ใช้ทั้งหมด" value={formatNumber(data.totalUsers)} icon={<Users />} />
        <StatCard title="ใหม่วันนี้" value={formatNumber(data.newUsers.today)} icon={<Users />} />
        <StatCard title="ใหม่สัปดาห์นี้" value={formatNumber(data.newUsers.thisWeek)} icon={<Users />} />
        <StatCard title="ใหม่เดือนนี้" value={formatNumber(data.newUsers.thisMonth)} icon={<Users />} />
      </div>

      {/* Top Users */}
      <motion.div
        className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-5 border-b border-mali-blue/20">
          <h3 className="text-lg font-semibold text-white thai-font">ผู้ใช้ที่ใช้จ่ายมากที่สุด</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-mali-blue/70 text-sm">
                <th className="px-5 py-3 text-left">ผู้ใช้</th>
                <th className="px-5 py-3 text-left">อีเมล</th>
                <th className="px-5 py-3 text-right">จำนวนคำสั่งซื้อ</th>
                <th className="px-5 py-3 text-right">ใช้จ่ายทั้งหมด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mali-blue/10">
              {data.topUsers.map((user) => (
                <tr key={user.id} className="text-sm">
                  <td className="px-5 py-4 text-white">{user.username}</td>
                  <td className="px-5 py-4 text-gray-400">{user.email}</td>
                  <td className="px-5 py-4 text-right text-white">{formatNumber(user.totalOrders)}</td>
                  <td className="px-5 py-4 text-right text-mali-gold">
                    ฿{formatNumber(user.totalSpent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

function ProductsTab({
  data,
  formatCurrency,
  formatNumber,
}: {
  data: ProductAnalytics;
  formatCurrency: (amount: number) => string;
  formatNumber: (num: number) => string;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bestsellers */}
        <motion.div
          className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="p-5 border-b border-mali-blue/20">
            <h3 className="text-lg font-semibold text-white thai-font">สินค้าขายดี</h3>
          </div>
          <div className="p-5 space-y-4">
            {data.bestsellers.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-mali-blue/20 text-mali-blue text-sm flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-white">{product.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-white">{formatNumber(product.salesCount)} ขาย</p>
                  <p className="text-mali-gold text-sm">{formatCurrency(product.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Category Performance */}
        <motion.div
          className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="p-5 border-b border-mali-blue/20">
            <h3 className="text-lg font-semibold text-white thai-font">ประสิทธิภาพตามหมวดหมู่</h3>
          </div>
          <div className="p-5 space-y-4">
            {data.categoryPerformance.map((category) => (
              <div key={category.categoryId} className="flex items-center justify-between">
                <span className="text-white">{category.categoryName}</span>
                <div className="text-right">
                  <p className="text-white">{formatNumber(category.salesCount)} ขาย</p>
                  <p className="text-mali-gold text-sm">{formatCurrency(category.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function OrdersTab({
  data,
  formatCurrency,
  formatNumber,
}: {
  data: OrderAnalytics;
  formatCurrency: (amount: number) => string;
  formatNumber: (num: number) => string;
}) {
  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400",
    PROCESSING: "bg-blue-500/20 text-blue-400",
    COMPLETED: "bg-green-500/20 text-green-400",
    CANCELLED: "bg-red-500/20 text-red-400",
    FAILED: "bg-red-500/20 text-red-400",
    REFUNDED: "bg-gray-500/20 text-gray-400",
  };

  const statusLabels: Record<string, string> = {
    PENDING: "รอดำเนินการ",
    PROCESSING: "กำลังดำเนินการ",
    COMPLETED: "สำเร็จ",
    CANCELLED: "ยกเลิก",
    FAILED: "ล้มเหลว",
    REFUNDED: "คืนเงิน",
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="คำสั่งซื้อทั้งหมด"
          value={formatNumber(data.totalOrders)}
          icon={<ShoppingCart />}
        />
        <StatCard
          title="มูลค่าเฉลี่ยต่อคำสั่งซื้อ"
          value={formatCurrency(data.averageOrderValue)}
          icon={<TrendingUp />}
        />
        <StatCard
          title="อัตราการเติมเต็ม"
          value={`${data.fulfillmentRate.toFixed(1)}%`}
          icon={<Package />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <motion.div
          className="bg-mali-card rounded-xl border border-mali-blue/20 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4 thai-font">คำสั่งซื้อตามสถานะ</h3>
          <div className="space-y-3">
            {Object.entries(data.ordersByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-sm ${statusColors[status] || "bg-gray-500/20 text-gray-400"}`}>
                  {statusLabels[status] || status}
                </span>
                <span className="text-white font-medium">{formatNumber(count)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Orders by Payment Method */}
        <motion.div
          className="bg-mali-card rounded-xl border border-mali-blue/20 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4 thai-font">วิธีการชำระเงิน</h3>
          <div className="space-y-3">
            {Object.entries(data.ordersByPaymentMethod).map(([method, count]) => (
              <div key={method} className="flex items-center justify-between"
              >
                <span className="text-white">
                  {method === 'CREDIT_CARD' && 'Credit Card'}
                  {method === 'PROMPTPAY' && 'PromptPay'}
                  {method === 'TRUEMONEY' && 'TrueMoney'}
                  {method === 'BANK_TRANSFER' && 'Bank Transfer'}
                  {!['CREDIT_CARD', 'PROMPTPAY', 'TRUEMONEY', 'BANK_TRANSFER'].includes(method) && method}
                </span>
                <span className="text-white font-medium">{formatNumber(count)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  icon,
  color,
}: {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  color: "blue" | "purple" | "emerald";
}) {
  const isPositive = change >= 0;

  return (
    <motion.div
      className="bg-mali-card rounded-xl border border-mali-blue/20 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-400 thai-font">{title}</span>
        <div className={`p-2 rounded-lg bg-${color}-500/20 text-${color}-400`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {change !== 0 && (
        <div className={`flex items-center mt-2 ${isPositive ? "text-green-400" : "text-red-400"}`}>
          {isPositive ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
          <span className="text-sm">{Math.abs(change).toFixed(1)}%</span>
        </div>
      )}
    </motion.div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      className="bg-mali-card rounded-xl border border-mali-blue/20 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm thai-font">{title}</span>
        <div className="text-mali-blue">{icon}</div>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </motion.div>
  );
}
