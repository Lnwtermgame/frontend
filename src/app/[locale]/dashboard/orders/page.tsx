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
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border-[2px] border-black text-xs font-bold bg-brutal-green text-black whitespace-nowrap shadow-[2px_2px_0_0_#000]">
            <CheckCircle className="w-3 h-3 mr-1" /> {t("status.completed")}
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border-[2px] border-black text-xs font-bold bg-brutal-yellow text-black whitespace-nowrap shadow-[2px_2px_0_0_#000]">
            <Clock className="w-3 h-3 mr-1" /> {t("status.pending")}
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border-[2px] border-black text-xs font-bold bg-brutal-blue text-black whitespace-nowrap shadow-[2px_2px_0_0_#000]">
            <Clock className="w-3 h-3 mr-1" /> {t("status.processing")}
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border-[2px] border-black text-xs font-bold bg-gray-300 text-black whitespace-nowrap shadow-[2px_2px_0_0_#000]">
            <XCircle className="w-3 h-3 mr-1" /> {t("status.cancelled")}
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border-[2px] border-black text-xs font-bold bg-gray-200 text-gray-600 whitespace-nowrap shadow-[2px_2px_0_0_#000]">
            <AlertCircle className="w-3 h-3 mr-1" /> {t("status.refunded")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border-[2px] border-black text-xs font-bold bg-gray-200 text-black whitespace-nowrap shadow-[2px_2px_0_0_#000]">
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
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            whileHover={{ y: -3 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start p-3">
              <div className="h-14 w-14 border-[2px] border-black mr-3 flex-shrink-0 bg-gray-100 overflow-hidden relative shadow-[2px_2px_0_0_#000]">
                {getSafeImageUrl(order.items[0]?.product?.imageUrl) ? (
                  <img
                    src={getSafeImageUrl(order.items[0]?.product?.imageUrl)!}
                    alt={order.items[0].product?.name || "Product"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Package className="h-6 w-6 text-black" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-black font-bold text-xs line-clamp-1">
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
                    <p className="text-gray-600 font-bold uppercase text-[10px]">{t("order_id_label")}</p>
                    <p className="text-black font-medium">
                      {order.orderNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-bold uppercase text-[10px]">{t("amount_label")}</p>
                    <p className="text-black font-bold">
                      {formatCurrency(order.finalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-bold uppercase text-[10px]">{t("date_label")}</p>
                    <p className="text-gray-600">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end mt-2">
                  <Link href={`/dashboard/orders/${order.id}`}>
                    <Button size="sm" className="text-xs h-7 px-2">
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
      <div className="relative mb-4">
        <motion.h2
          className="text-lg font-bold text-black mb-1 relative flex items-center"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="w-1.5 h-4 bg-brutal-blue mr-2"></span>
          {t("title")}
        </motion.h2>
        <p className="text-gray-600 text-xs relative">
          {t("subtitle")}
        </p>
      </div>

      {/* Search and filter bar */}
      <motion.div
        className="flex flex-col md:flex-row gap-3 justify-between mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative md:w-72">
          <Input
            placeholder={t("search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search size={16} />}
            className="text-sm h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop Filter */}
          <div className="hidden md:block">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border-[2px] border-black text-black text-xs focus:outline-none shadow-[2px_2px_0_0_#000] h-10"
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
            className="md:hidden h-10 text-xs"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter size={14} className="mr-2" /> {t("filter_title")}
          </Button>

          <div className="hidden md:flex bg-white border-[2px] border-black p-1 shadow-[2px_2px_0_0_#000]">
            <button
              className={`px-3 py-1 text-xs font-bold transition-colors ${viewMode === "table" ? "bg-black text-white" : "text-gray-600 hover:text-black"}`}
              onClick={() => setViewMode("table")}
            >
              {t("view_mode.table")}
            </button>
            <button
              className={`px-3 py-1 text-xs font-bold transition-colors ${viewMode === "card" ? "bg-black text-white" : "text-gray-600 hover:text-black"}`}
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
            <h3 className="font-bold mb-3 flex items-center">
              <Filter size={18} className="mr-2" /> {t("table.status")}
            </h3>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setStatusFilter(option.value);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 border-[2px] border-black font-bold transition-all ${statusFilter === option.value
                      ? "bg-brutal-yellow text-black shadow-[2px_2px_0_0_#000]"
                      : "bg-white text-gray-700"
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
        className="bg-white border-[3px] border-black overflow-hidden"
        style={{ boxShadow: "4px 4px 0 0 #000000" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100 border-b-[3px] border-black">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t("table.order_number")}
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t("table.product")}
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t("table.date")}
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t("table.amount")}
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t("table.status")}
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <motion.tr
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td className="px-4 py-3 text-xs font-bold text-black">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="h-8 w-8 border-[2px] border-black mr-3 bg-gray-100 overflow-hidden relative shadow-[1px_1px_0_0_#000]">
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
                                <Package className="h-4 w-4 text-black" />
                              </div>
                            )}
                          </div>
                          <span className="text-black text-xs line-clamp-1 font-medium">
                            {order.items[0]?.product?.name
                              ? order.items[0]?.productType?.name
                                ? `${order.items[0].product.name} - ${order.items[0].productType.name}`
                                : order.items[0].product.name
                              : order.items[0]?.productName || t("table.product")}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 font-medium">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-xs text-black font-black">
                        {formatCurrency(order.finalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        {renderStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <Button size="sm" className="text-xs h-7 px-2">
                            <Eye className="h-3 w-3 mr-1" />
                            {t("view_short")}
                          </Button>
                        </Link>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <div className="text-gray-600">
                        <ShoppingBag className="h-10 w-10 mx-auto opacity-50 mb-3" />
                        <p className="text-black text-base font-bold mb-1">
                          {t("no_orders")}
                        </p>
                        <p className="text-xs max-w-md mx-auto">
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
