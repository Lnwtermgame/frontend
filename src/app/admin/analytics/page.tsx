"use client";

import { useState } from "react";
import { motion } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Calendar,
  Download,
  Filter,
} from "lucide-react";

// Mock data for analytics
const mockStats = {
  revenue: {
    current: 125000,
    previous: 98000,
    change: 27.5,
  },
  orders: {
    current: 450,
    previous: 380,
    change: 18.4,
  },
  customers: {
    current: 120,
    previous: 95,
    change: 26.3,
  },
  products: {
    current: 85,
    previous: 80,
    change: 6.25,
  },
};

const mockSalesData = [
  { date: "2024-01-01", sales: 12000, orders: 45 },
  { date: "2024-01-02", sales: 15000, orders: 52 },
  { date: "2024-01-03", sales: 11000, orders: 38 },
  { date: "2024-01-04", sales: 18000, orders: 65 },
  { date: "2024-01-05", sales: 22000, orders: 78 },
  { date: "2024-01-06", sales: 25000, orders: 85 },
  { date: "2024-01-07", sales: 20000, orders: 70 },
];

const mockTopProducts = [
  { name: "PUBG Mobile UC", sales: 125, revenue: 45000 },
  { name: "Roblox Gift Card", sales: 98, revenue: 32000 },
  { name: "Steam Wallet", sales: 87, revenue: 28000 },
  { name: "Genshin Impact", sales: 76, revenue: 24000 },
  { name: "Free Fire Diamonds", sales: 65, revenue: 19500 },
];

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState("7d");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    // Simulate export
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsExporting(false);
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
    icon: React.ElementType;
    color: string;
  }) => (
    <motion.div
      className="bg-white border-[3px] border-black p-6"
      style={{ boxShadow: '4px 4px 0 0 #000000' }}
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
          {Math.abs(change)}%
        </div>
      </div>
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-black mt-1">{value}</p>
    </motion.div>
  );

  return (
    <AdminLayout title="วิเคราะห์">
      <div className="space-y-6">
        {/* Header */}
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
              onClick={handleExport}
              disabled={isExporting}
              className="bg-black text-white border-[3px] border-black px-4 py-2 hover:bg-gray-800 transition-colors flex items-center font-medium disabled:opacity-70"
              style={{ boxShadow: '4px 4px 0 0 #000000' }}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "กำลังส่งออก..." : "ส่งออก"}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="รายได้ทั้งหมด"
            value={`฿${mockStats.revenue.current.toLocaleString()}`}
            change={mockStats.revenue.change}
            icon={DollarSign}
            color="bg-brutal-pink"
          />
          <StatCard
            title="คำสั่งซื้อ"
            value={mockStats.orders.current.toString()}
            change={mockStats.orders.change}
            icon={ShoppingCart}
            color="bg-brutal-yellow"
          />
          <StatCard
            title="ลูกค้าใหม่"
            value={mockStats.customers.current.toString()}
            change={mockStats.customers.change}
            icon={Users}
            color="bg-brutal-blue"
          />
          <StatCard
            title="สินค้าที่ขาย"
            value={mockStats.products.current.toString()}
            change={mockStats.products.change}
            icon={Package}
            color="bg-brutal-green"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <motion.div
            className="lg:col-span-2 bg-white border-[3px] border-black p-6"
            style={{ boxShadow: '4px 4px 0 0 #000000' }}
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
              {mockSalesData.map((data, index) => {
                const maxSales = Math.max(...mockSalesData.map((d) => d.sales));
                const height = (data.sales / maxSales) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-brutal-pink transition-all duration-500"
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2">
                      {new Date(data.date).toLocaleDateString("th-TH", {
                        weekday: "short",
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Top Products */}
          <motion.div
            className="bg-white border-[3px] border-black p-6"
            style={{ boxShadow: '4px 4px 0 0 #000000' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="flex items-center mb-6">
              <Package className="h-5 w-5 text-brutal-blue mr-2" />
              <h3 className="text-lg font-semibold text-black">สินค้าขายดี</h3>
            </div>
            <div className="space-y-4">
              {mockTopProducts.map((product, index) => (
                <div
                  key={index}
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
                      <p className="text-sm font-medium text-black">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.sales} ขาย
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-black">
                    ฿{product.revenue.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Activity Table */}
        <motion.div
          className="bg-white border-[3px] border-black overflow-hidden"
          style={{ boxShadow: '4px 4px 0 0 #000000' }}
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
                {mockSalesData.slice(0, 5).map((data, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(data.date).toLocaleDateString("th-TH")}
                    </td>
                    <td className="py-3 px-4 text-sm text-black font-medium">
                      คำสั่งซื้อ #{1000 + index}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      ลูกค้า {index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full border-[2px] border-green-500">
                        สำเร็จ
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-black text-right font-medium">
                      ฿{data.sales.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
