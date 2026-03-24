"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { orderApi, Order } from "@/lib/services/order-api";
import {
  ShoppingBag,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  FileText,
  Eye,
  Calendar,
  Package,
  XCircle,
  Check,
} from "lucide-react";
import { motion } from "@/lib/framer-exports";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { useTranslations } from "next-intl";

export default function OrdersPage() {
  const t = useTranslations("Orders");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const { user, isInitialized } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch orders from API
  useEffect(() => {
    if (isInitialized && user) {
      fetchOrders();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isInitialized, user, statusFilter]);

  const fetchOrders = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      const response = await orderApi.getOrders(
        1,
        50,
        statusFilter,
        controller.signal,
      );
      if (response.success) {
        setOrders(response.data);
        setFilteredOrders(response.data);
      }
    } catch (error: any) {
      if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
        toast.error(t("error_loading"));
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  // Filter orders based on search term
  useEffect(() => {
    if (searchTerm) {
      setFilteredOrders(
        orders.filter(
          (order) =>
            order.orderNumber
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            order.items.some((item) =>
              item.productName
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()),
            ),
        ),
      );
    } else {
      setFilteredOrders(orders);
    }
  }, [searchTerm, orders]);

  // Set view mode based on screen size
  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth < 768 ? "card" : "table");
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Helper to get safe image URL
  const getSafeImageUrl = (url?: string | null) => {
    if (!url) return null;
    return url.replace(/`/g, "").trim();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-site-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border border-green-500/30/20 rounded-full text-xs font-bold bg-green-500/10 text-green-500 whitespace-nowrap">
            <CheckCircle className="w-3 h-3 mr-1" /> {t("status.completed")}
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border border-yellow-500/30/20 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-500 whitespace-nowrap">
            <Clock className="w-3 h-3 mr-1" /> {t("status.pending")}
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border border-blue-500/20 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 whitespace-nowrap">
            <Clock className="w-3 h-3 mr-1" /> {t("status.processing")}
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border border-red-500/30/20 rounded-full text-xs font-bold bg-red-500/10 text-red-500 whitespace-nowrap">
            <XCircle className="w-3 h-3 mr-1" /> {t("status.cancelled")}
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border border-gray-500/20 rounded-full text-xs font-bold bg-[#181A1D]0/10 text-gray-400 whitespace-nowrap">
            <AlertCircle className="w-3 h-3 mr-1" /> {t("status.refunded")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border border-gray-600 rounded-full text-xs font-bold bg-gray-800 text-gray-300 whitespace-nowrap">
            {status}
          </span>
        );
    }
  };

  const STATUS_OPTIONS = [
    { value: "", label: t("status.all") },
    { value: "PENDING", label: t("status.pending") },
    { value: "PROCESSING", label: t("status.processing") },
    { value: "COMPLETED", label: t("status.completed") },
    { value: "CANCELLED", label: t("status.cancelled") },
  ];

  // Render card view for mobile
  const renderCardView = () => {
    return (
      <div className="grid grid-cols-1 gap-3 p-3">
        {filteredOrders.map((order) => (
          <motion.div
            key={order.id}
            className="bg-[#1A1C1E] border border-site-border rounded-xl overflow-hidden"
            whileHover={{ y: -3 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start p-3">
              <div className="h-14 w-14 border border-site-border rounded-lg mr-3 flex-shrink-0 bg-[#222427] overflow-hidden relative">
                {getSafeImageUrl(order.items[0]?.product?.imageUrl) ? (
                  <img
                    src={getSafeImageUrl(order.items[0]?.product?.imageUrl)!}
                    alt={order.items[0].product?.name || "Product"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-500" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-bold text-xs line-clamp-1">
                    {order.items[0]?.product?.name
                      ? order.items[0]?.productType?.name
                        ? `${order.items[0].product.name} - ${order.items[0].productType.name}`
                        : order.items[0].product.name
                      : order.items[0]?.productName || t("table.product")}
                  </h3>
                  <div>{renderStatusBadge(order.status)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500 font-bold uppercase text-[10px]">{t("order_id_label")}</p>
                    <p className="text-white font-medium">
                      {order.orderNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-bold uppercase text-[10px]">{t("amount_label")}</p>
                    <p className="text-[var(--site-accent)] font-bold">
                      {formatCurrency(order.finalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-bold uppercase text-[10px]">{t("date_label")}</p>
                    <p className="text-gray-400">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end mt-2">
                  <Link href={`/dashboard/orders/${order.id}`}>
                    <Button variant="outline" size="sm" className="text-xs h-7 px-2 border-site-border text-white hover:bg-[#212328]/5">
                      <Eye className="h-3 w-3 mr-1" />
                      {t("view_details")}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div className="relative mb-6">
        <motion.h2
          className="text-xl font-bold text-white mb-1 relative flex items-center"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="w-1.5 h-5 bg-[var(--site-accent)] mr-2 rounded-full shadow-[0_0_10px_rgba(103,176,186,0.5)]"></span>
          {t("title")}
        </motion.h2>
        <p className="text-gray-400 text-sm relative">
          {t("subtitle")}
        </p>
      </div>

      {/* Search and filter bar */}
      <motion.div
        className="flex flex-col md:flex-row gap-3 justify-between mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative md:w-80">
          <Input
            placeholder={t("search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search size={16} className="text-gray-400" />}
            className="text-sm h-11 bg-[#1A1C1E] border-site-border text-white placeholder-gray-500 rounded-lg focus:border-site-accent"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop Filter */}
          <div className="hidden md:block">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-[#1A1C1E] border border-site-border rounded-lg text-white text-sm focus:outline-none focus:border-[var(--site-accent)] h-11"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Mobile Filter Button */}
          <Button
            variant="outline"
            className="md:hidden h-11 text-sm border-site-border text-white bg-[#1A1C1E] rounded-lg"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter size={16} className="mr-2" /> {t("filter_title")}
          </Button>

          <div className="hidden md:flex bg-[#1A1C1E] border border-site-border rounded-lg p-1 h-11 items-center">
            <button
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === "table" ? "bg-[#222427] text-[var(--site-accent)]" : "text-gray-400 hover:text-white"}`}
              onClick={() => setViewMode("table")}
            >
              {t("view_mode.table")}
            </button>
            <button
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === "card" ? "bg-[#222427] text-[var(--site-accent)]" : "text-gray-400 hover:text-white"}`}
              onClick={() => setViewMode("card")}
            >
              {t("view_mode.card")}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Mobile Filter Sheet */}
      <Sheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title={t("filter_title")}
      >
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-white mb-3 flex items-center">
              <Filter size={18} className="mr-2 text-[var(--site-accent)]" /> {t("table.status")}
            </h3>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setStatusFilter(option.value);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border font-medium transition-all ${statusFilter === option.value
                    ? "bg-[var(--site-accent)]/10 border-[var(--site-accent)] text-[var(--site-accent)]"
                    : "bg-[#1A1C1E] border-site-border text-gray-400 hover:border-gray-500"
                    }`}
                >
                  <span>{option.label}</span>
                  {statusFilter === option.value && <Check size={18} />}
                </button>
              ))}
            </div>
          </div>

          <Button fullWidth onClick={() => setIsFilterOpen(false)}>
            {t("view_results")}
          </Button>
        </div>
      </Sheet>

      {/* Orders list */}
      <motion.div
        className="bg-[#222427] border border-site-border rounded-xl shadow-ocean overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-site-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#1A1C1E] border-b border-site-border">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {t("table.order_number")}
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {t("table.product")}
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {t("table.date")}
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {t("table.amount")}
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {t("table.status")}
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-site-border">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <motion.tr
                      key={order.id}
                      className="hover:bg-[#212328]/5 transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td className="px-5 py-4 text-sm font-medium text-white">
                        {order.orderNumber}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-lg border border-site-border mr-3 bg-[#1A1C1E] overflow-hidden flex-shrink-0">
                            {getSafeImageUrl(
                              order.items[0]?.product?.imageUrl,
                            ) ? (
                              <img
                                src={
                                  getSafeImageUrl(
                                    order.items[0]?.product?.imageUrl,
                                  )!
                                }
                                alt={order.items[0].product?.name || "Product"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <span className="text-white text-sm line-clamp-1 font-medium">
                            {order.items[0]?.product?.name
                              ? order.items[0]?.productType?.name
                                ? `${order.items[0].product.name} - ${order.items[0].productType.name}`
                                : order.items[0].product.name
                              : order.items[0]?.productName || t("table.product")}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-sm text-[var(--site-accent)] font-semibold">
                        {formatCurrency(order.finalAmount)}
                      </td>
                      <td className="px-5 py-4">
                        {renderStatusBadge(order.status)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <Button variant="outline" size="sm" className="text-xs h-8 px-3 border-site-border text-white hover:bg-[#212328]/5 bg-transparent">
                            <Eye className="h-4 w-4 mr-2" />
                            {t("view_short")}
                          </Button>
                        </Link>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <ShoppingBag className="h-12 w-12 mx-auto opacity-20 mb-4" />
                        <p className="text-white text-lg font-medium mb-1">
                          {t("no_orders")}
                        </p>
                        <p className="text-sm max-w-md mx-auto">
                          {searchTerm
                            ? t("no_search_results", { query: searchTerm })
                            : t("no_orders_desc")}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          renderCardView()
        )}
      </motion.div>
    </div>
  );
}
