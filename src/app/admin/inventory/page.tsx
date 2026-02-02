"use client";

import { useState } from "react";
import { motion } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import { Package, AlertTriangle, History, BarChart3 } from "lucide-react";
import { StockAlertManager } from "@/components/admin/inventory/StockAlertManager";
import { StockHistoryViewer } from "@/components/admin/inventory/StockHistoryViewer";

type Tab = "alerts" | "history";

export default function AdminInventory() {
  const [activeTab, setActiveTab] = useState<Tab>("alerts");

  return (
    <AdminLayout title={"Inventory" as any}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Inventory Management</h2>
            <p className="text-gray-400 mt-1">
              Manage stock alerts, view history, and track inventory changes
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-mali-blue/20">
          <button
            onClick={() => setActiveTab("alerts")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === "alerts"
                ? "border-mali-blue text-mali-blue"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            Stock Alerts
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-mali-blue text-mali-blue"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <History className="h-4 w-4" />
            Stock History
          </button>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {activeTab === "alerts" ? (
            <StockAlertManager />
          ) : (
            <StockHistoryViewer />
          )}
        </motion.div>
      </div>
    </AdminLayout>
  );
}
