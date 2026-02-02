"use client";

import { useState } from "react";
import { motion } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  BarChart3,
  Users,
  TrendingUp,
  LineChart,
  PieChart,
  Target,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Table as TableIcon,
} from "lucide-react";
import ABTestingPanel from "@/components/analytics/ABTestingPanel";
import CustomReports from "@/components/analytics/CustomReports";

// Dummy translation helper
const t = (str: any) => str;

// Mock data for analytics metrics
const mockMetrics = {
  userMetrics: {
    totalUsers: 32548,
    activeUsers: 18245,
    newUsers: 756,
    newUsersTrend: 12.4,
    bounceRate: 24.8,
    bounceRateTrend: -3.2,
    avgSessionTime: "4:32",
    avgSessionTimeTrend: 8.5,
  },
  salesMetrics: {
    totalRevenue: 245879.56,
    revenueTrend: 15.7,
    avgOrderValue: 42.38,
    avgOrderTrend: 3.2,
    conversionRate: 3.8,
    conversionTrend: 1.5,
    topSellingCategories: [
      { name: "เกมมือถือ", value: 42 },
      { name: "เกม PC", value: 28 },
      { name: "เกมคอนโซล", value: 18 },
      { name: "บัตรของขวัญ", value: 12 },
    ],
  },
  engagementMetrics: {
    pageViews: 187432,
    pageViewsTrend: 8.3,
    uniqueVisitors: 45621,
    uniqueVisitorsTrend: 5.7,
    mostVisitedPages: [
      { name: "/games/pubg-mobile", views: 24563 },
      { name: "/games/free-fire", views: 18432 },

      { name: "/special-events", views: 9876 },
    ],
  },
};

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState(mockMetrics);
  const [timeRange, setTimeRange] = useState("30days");
  const [activeTab, setActiveTab] = useState<
    "overview" | "testing" | "reports"
  >("overview");

  const tabItems = [
    {
      id: "overview",
      label: "ภาพรวม",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: "testing",
      label: "A/B Testing",
      icon: <Target className="w-4 h-4" />,
    },
    {
      id: "reports",
      label: "รายงานที่กำหนดเอง",
      icon: <TableIcon className="w-4 h-4" />,
    },
  ];

  return (
    <AdminLayout title={"วิเคราะห์ขั้นสูง" as any}>
      <div className="space-y-8">
        {/* Tab Navigation */}
        <div className="flex border-b border-mali-blue/20">
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-mali-blue text-white"
                  : "border-transparent text-mali-blue/70 hover:text-mali-blue hover:border-mali-blue/30"
              }`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Time Range (only for Overview) */}
        {activeTab === "overview" && (
          <motion.div
            className="flex flex-wrap items-center justify-between gap-4 bg-mali-card rounded-xl border border-mali-blue/20 p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-mali-blue mr-2" />
              <span className="text-sm text-white mr-4">ช่วงเวลา:</span>
              <div className="flex bg-mali-900/50 rounded-lg overflow-hidden">
                {["7days", "30days", "90days", "year"].map((range) => (
                  <button
                    key={range}
                    className={`px-4 py-2 text-sm transition-colors ${
                      timeRange === range
                        ? "bg-mali-blue text-white"
                        : "text-mali-blue/70 hover:bg-mali-blue/10"
                    }`}
                    onClick={() => setTimeRange(range)}
                  >
                    {range === "7days"
                      ? "7 วัน"
                      : range === "30days"
                        ? "30 วัน"
                        : range === "90days"
                          ? "3 เดือน"
                          : "1 ปี"}
                  </button>
                ))}
              </div>
            </div>
            <button className="flex items-center bg-mali-blue/20 hover:bg-mali-blue/30 transition-colors rounded-lg px-4 py-2 text-mali-blue">
              <Filter className="h-4 w-4 mr-2" />
              <span className="text-sm">ตัวกรองขั้นสูง</span>
            </button>
          </motion.div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            {/* User Behavior Metrics */}
            <div className="space-y-5">
              <motion.h2
                className="text-xl font-semibold text-white flex items-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Users className="mr-2 h-5 w-5 text-mali-blue" />
                {t("สถิติพฤติกรรมผู้ใช้" as any)}
              </motion.h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="ผู้ใช้ทั้งหมด"
                  value={metrics.userMetrics.totalUsers.toLocaleString()}
                  trend={null}
                  icon={<Users className="h-5 w-5" />}
                  color="blue"
                />
                <MetricCard
                  title="ผู้ใช้ที่ใช้งาน"
                  value={metrics.userMetrics.activeUsers.toLocaleString()}
                  trend={null}
                  icon={<Activity className="h-5 w-5" />}
                  color="purple"
                />
                <MetricCard
                  title="ผู้ใช้ใหม่"
                  value={metrics.userMetrics.newUsers.toLocaleString()}
                  trend={metrics.userMetrics.newUsersTrend}
                  icon={<Users className="h-5 w-5" />}
                  color="emerald"
                />
                <MetricCard
                  title="อัตราออกจากหน้า"
                  value={`${metrics.userMetrics.bounceRate}%`}
                  trend={metrics.userMetrics.bounceRateTrend}
                  invertTrend={true}
                  icon={<ArrowUpRight className="h-5 w-5" />}
                  color="rose"
                />
              </div>

              <motion.div
                className="bg-mali-card rounded-xl border border-mali-blue/20 p-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <LineChart className="mr-2 h-5 w-5 text-mali-blue" />
                  {t("การมีส่วนร่วมของผู้ใช้ตามเวลา" as any)}
                </h3>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-mali-blue/50">
                    {t("แผนภูมิการมีส่วนร่วมของผู้ใช้จะแสดงที่นี่" as any)}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sales Performance Metrics */}
            <div className="space-y-5">
              <motion.h2
                className="text-xl font-semibold text-white flex items-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <TrendingUp className="mr-2 h-5 w-5 text-mali-blue" />
                {t("สถิติประสิทธิภาพการขาย" as any)}
              </motion.h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard
                  title="รายได้ทั้งหมด"
                  value={`฿${metrics.salesMetrics.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                  trend={metrics.salesMetrics.revenueTrend}
                  icon={<TrendingUp className="h-5 w-5" />}
                  color="blue"
                />
                <MetricCard
                  title="มูลค่าคำสั่งซื้อเฉลี่ย"
                  value={`฿${metrics.salesMetrics.avgOrderValue.toFixed(2)}`}
                  trend={metrics.salesMetrics.avgOrderTrend}
                  icon={<ArrowUpRight className="h-5 w-5" />}
                  color="purple"
                />
                <MetricCard
                  title="อัตราการแปลง"
                  value={`${metrics.salesMetrics.conversionRate}%`}
                  trend={metrics.salesMetrics.conversionTrend}
                  icon={<Target className="h-5 w-5" />}
                  color="emerald"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <motion.div
                  className="bg-mali-card rounded-xl border border-mali-blue/20 p-5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5 text-mali-blue" />
                    {t("รายได้ตามหมวดหมู่สินค้า" as any)}
                  </h3>
                  <div className="h-64">
                    <div className="space-y-4">
                      {metrics.salesMetrics.topSellingCategories.map(
                        (category, i) => (
                          <div key={i} className="flex items-center">
                            <div className="w-full bg-mali-blue/10 rounded-full h-2.5">
                              <div
                                className="h-2.5 rounded-full bg-gradient-to-r from-mali-blue to-indigo-500"
                                style={{ width: `${category.value}%` }}
                              ></div>
                            </div>
                            <span className="ml-3 text-sm">
                              {category.name}
                            </span>
                            <span className="ml-auto text-sm text-mali-blue">
                              {category.value}%
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-mali-card rounded-xl border border-mali-blue/20 p-5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <PieChart className="mr-2 h-5 w-5 text-mali-blue" />
                    {t("การกระจายการขาย" as any)}
                  </h3>
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-mali-blue/50">
                      {t("แผนภูมิการกระจายการขายจะแสดงที่นี่" as any)}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </>
        )}

        {/* A/B Testing Tab */}
        {activeTab === "testing" && (
          <motion.div
            key="testing"
            className="bg-mali-card rounded-xl border border-mali-blue/20 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ABTestingPanel />
          </motion.div>
        )}

        {/* Custom Reports Tab */}
        {activeTab === "reports" && (
          <motion.div
            key="reports"
            className="bg-mali-card rounded-xl border border-mali-blue/20 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <CustomReports />
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  trend: number | null;
  invertTrend?: boolean;
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

function MetricCard({
  title,
  value,
  trend,
  invertTrend = false,
  icon,
  color,
}: MetricCardProps) {
  // Determine if trend is positive (for display purposes)
  const isPositive = invertTrend
    ? trend !== null
      ? trend < 0
      : false
    : trend !== null
      ? trend > 0
      : false;

  return (
    <motion.div
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl border p-6 flex flex-col`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">{title}</span>
        <span
          className={`p-2 rounded-full bg-mali-card/40 ${iconColorClasses[color]}`}
        >
          {icon}
        </span>
      </div>

      <div className="mt-3">
        <span className="text-2xl font-bold text-white">{value}</span>
        {trend !== null && (
          <div className="flex items-center mt-1">
            <span
              className={`text-xs ${isPositive ? "text-green-400" : "text-red-400"} flex items-center`}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {Math.abs(trend)}%
            </span>
            <span className="text-xs text-gray-400 ml-1">
              เทียบกับช่วงก่อนหน้า
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
