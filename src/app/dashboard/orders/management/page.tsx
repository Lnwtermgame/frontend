"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { Search, Filter, Calendar, Download, MoreHorizontal, ChevronLeft, ChevronRight, Package, Truck, CheckCircle, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";

// Mock management orders (perhaps for a seller or power user view?)
const managementOrders = [
  {
    id: "MNG-5001",
    customer: "Alice Walker",
    date: "2023-11-21",
    total: "$120.00",
    status: "processing",
    items: 3
  },
  {
    id: "MNG-5002",
    customer: "Bob Martin",
    date: "2023-11-20",
    total: "$45.50",
    status: "shipped",
    items: 1
  },
  {
    id: "MNG-5003",
    customer: "Charlie Brown",
    date: "2023-11-19",
    total: "$210.00",
    status: "delivered",
    items: 5
  },
  {
    id: "MNG-5004",
    customer: "Diana Prince",
    date: "2023-11-18",
    total: "$15.00",
    status: "cancelled",
    items: 1
  }
];

export default function OrderManagementPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOrders, setFilteredOrders] = useState(managementOrders);
  const [statusFilter, setStatusFilter] = useState("all");

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, router, isInitialized]);

  // Filter orders
  useEffect(() => {
    let result = managementOrders;

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(order => order.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      result = result.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(result);
  }, [searchTerm, statusFilter]);

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-mali-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-mali-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mali-green/20 text-mali-green border border-mali-green/20">
            <CheckCircle className="w-3 h-3 mr-1" /> Delivered
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mali-blue/20 text-mali-blue-light border border-mali-blue/20">
            <Clock className="w-3 h-3 mr-1" /> Processing
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mali-purple/20 text-mali-purple border border-mali-purple/20">
            <Truck className="w-3 h-3 mr-1" /> Shipped
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mali-red/20 text-mali-red border border-mali-red/20">
            <AlertCircle className="w-3 h-3 mr-1" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="relative mb-6">
        <div className="flex justify-between items-start">
          <div>
            <motion.h2
              className="text-xl font-bold text-white mb-1 relative"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              Order Management
            </motion.h2>
            <p className="text-mali-text-secondary text-sm relative">
              Manage and track all orders
            </p>
          </div>
          <button className="bg-mali-blue hover:bg-mali-blue/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center shadow-button-glow">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search order ID or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-mali-blue/10 border border-mali-blue/20 rounded-lg text-white placeholder-mali-text-secondary focus:outline-none focus:ring-1 focus:ring-mali-blue-accent transition-colors"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mali-text-secondary" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-mali-blue/10 border border-mali-blue/20 rounded-lg text-white px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-mali-blue-accent cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button className="bg-mali-blue/10 border border-mali-blue/20 p-2 rounded-lg text-mali-text-secondary hover:text-white transition-colors">
            <Filter className="h-4 w-4" />
          </button>

          <button className="bg-mali-blue/10 border border-mali-blue/20 p-2 rounded-lg text-mali-text-secondary hover:text-white transition-colors">
            <Calendar className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <motion.div
        className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-mali-blue/10 border-b border-mali-blue/20 text-xs uppercase text-mali-text-secondary font-medium">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mali-blue/10">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    className="hover:bg-mali-blue/5 transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="px-6 py-4 font-medium text-white">{order.id}</td>
                    <td className="px-6 py-4 text-mali-text-secondary text-sm">{order.customer}</td>
                    <td className="px-6 py-4 text-mali-text-secondary text-sm">{order.date}</td>
                    <td className="px-6 py-4 text-mali-text-secondary text-sm">{order.items}</td>
                    <td className="px-6 py-4 text-white font-medium">{order.total}</td>
                    <td className="px-6 py-4">{renderStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 hover:bg-mali-blue/20 rounded-lg text-mali-text-secondary hover:text-white transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-mali-text-secondary">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No orders found matching your criteria</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-mali-blue/20 flex items-center justify-between">
          <p className="text-xs text-mali-text-secondary">
            Showing <span className="font-medium text-white">1</span> to <span className="font-medium text-white">{filteredOrders.length}</span> of <span className="font-medium text-white">{filteredOrders.length}</span> results
          </p>
          <div className="flex gap-2">
            <button className="p-1.5 rounded-lg border border-mali-blue/20 text-mali-text-secondary opacity-50 cursor-not-allowed">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="p-1.5 rounded-lg border border-mali-blue/20 text-mali-text-secondary hover:text-white hover:bg-mali-blue/10 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 
