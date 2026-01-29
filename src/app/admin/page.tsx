"use client";

import { motion } from "@/lib/framer-exports";
import { useState } from "react";
import { CircleDollarSign, Package, Ticket, Users, TrendingUp, Activity } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";

// Mock data for dashboard stats
const mockStats = {
  sales: {
    total: "9,845.20",
    percent: 12.5,
    isUp: true
  },
  orders: {
    total: 284,
    percent: 8.2,
    isUp: true
  },
  products: {
    total: 156,
    percent: 3.1,
    isUp: false
  },
  users: {
    total: 2489,
    percent: 18.3,
    isUp: true
  }
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(mockStats);

  return (
    <AdminLayout title="แดชบอร์ดผู้ดูแลระบบ">
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard
            title="ยอดขายทั้งหมด"
            value={`$${stats.sales.total}`}
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
          <div className="p-5 border-b border-mali-blue/20">
            <h3 className="text-lg font-semibold text-white flex items-center thai-font">
              <Activity className="mr-2 h-5 w-5 text-mali-blue" />
              ธุรกรรมล่าสุด
            </h3>
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
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="text-sm hover:bg-mali-blue/5 transition-colors">
                    <td className="px-5 py-4">#TX-{10023 + i}</td>
                    <td className="px-5 py-4">user{i + 1}@example.com</td>
                    <td className="px-5 py-4">
                      {["PUBG Mobile", "Valorant Points", "Steam Wallet", "Google Play", "Razer Gold"][i]}
                    </td>
                    <td className="px-5 py-4">${(25 + i * 15).toFixed(2)}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${["text-green-400 bg-green-900/30",
                          "text-blue-400 bg-blue-900/30",
                          "text-green-400 bg-green-900/30",
                          "text-yellow-400 bg-yellow-900/30",
                          "text-blue-400 bg-blue-900/30"][i]
                        }`}>
                        {["เสร็จสมบูรณ์", "กำลังดำเนินการ", "เสร็จสมบูรณ์", "รอดำเนินการ", "กำลังดำเนินการ"][i]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-mali-blue/70">
                      {new Date(Date.now() - 1000 * 60 * 60 * (i + 1) * 3).toLocaleDateString('th-TH')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-mali-blue/20 flex justify-center">
            <button className="px-4 py-2 text-sm text-mali-blue hover:text-white hover:bg-mali-blue/20 rounded-md transition-colors thai-font">
              ดูธุรกรรมทั้งหมด
            </button>
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
                แผนภูมิการขายจะแสดงที่นี่
              </div>
            </div>
          </div>

          <div className="bg-mali-card rounded-xl border border-mali-blue/20 p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center thai-font">
              <Package className="mr-2 h-5 w-5 text-mali-blue" />
              สินค้ายอดนิยม
            </h3>
            <div className="space-y-4">
              {["PUBG Mobile UC", "Valorant Points", "Steam Wallet", "Free Fire Diamonds", "Razer Gold"].map((product, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-full bg-mali-blue/10 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-mali-blue to-indigo-500"
                      style={{ width: `${85 - (i * 10)}%` }}
                    ></div>
                  </div>
                  <span className="ml-3 text-sm">{product}</span>
                  <span className="ml-auto text-sm text-mali-blue">{85 - (i * 10)}%</span>
                </div>
              ))}
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

function StatsCard({ title, value, change, isPositive, icon, color }: StatsCardProps) {
  return (
    <motion.div
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl border p-6 flex flex-col`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300 thai-font">{title}</span>
        <span className={`p-2 rounded-full bg-mali-card/40 ${iconColorClasses[color]}`}>
          {icon}
        </span>
      </div>

      <div className="mt-3">
        <span className="text-2xl font-bold text-white">{value}</span>
        <div className="flex items-center mt-1">
          <span className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '↑' : '↓'} {change}%
          </span>
          <span className="text-xs text-gray-400 ml-1 thai-font">เทียบกับเดือนที่แล้ว</span>
        </div>
      </div>
    </motion.div>
  );
}
