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
  Eye,
  Package,
  XCircle,
  Check,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonListRow } from "@/components/ui/Skeleton";

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
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-8" />
          <p className="text-site-muted">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="success">
            <CheckCircle className="w-3 h-3" /> {t("status.completed")}
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="warning">
            <Clock className="w-3 h-3" /> {t("status.pending")}
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge variant="info">
            <Clock className="w-3 h-3" /> {t("status.processing")}
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="danger">
            <XCircle className="w-3 h-3" /> {t("status.cancelled")}
          </Badge>
        );
      case "REFUNDED":
        return (
          <Badge variant="neutral">
            <AlertCircle className="w-3 h-3" /> {t("status.refunded")}
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral">
            {status}
          </Badge>
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
      <div className="grid grid-cols-1 gap-2 p-3">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="site-card overflow-hidden"
          >
            <div className="flex items-start p-3">
              <div className="h-12 w-12 border border-site-border-soft rounded-6 mr-3 flex-shrink-0 bg-site-raised overflow-hidden relative">
                {getSafeImageUrl(order.items[0]?.product?.imageUrl) ? (
                  <img
                    src={getSafeImageUrl(order.items[0]?.product?.imageUrl)!}
                    alt={order.items[0].product?.name || "Product"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-site-dim" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-site-text font-bold text-xs line-clamp-1">
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
                    <p className="text-[11px] uppercase text-site-dim font-bold">{t("order_id_label")}</p>
                    <p className="text-site-text font-medium">
                      {order.orderNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-site-dim font-bold">{t("amount_label")}</p>
                    <p className="text-site-accent font-bold">
                      {formatCurrency(order.finalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-site-dim font-bold">{t("date_label")}</p>
                    <p className="text-site-muted">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end mt-2">
                  <Link href={`/dashboard/orders/${order.id}`}>
                    <Button variant="outline" size="sm" className="text-xs h-7 px-2 border-site-border-soft text-site-text hover:bg-site-raised">
                      <Eye className="h-3 w-3 mr-1" />
                      {t("view_details")}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <SectionHeader level={1} title={t("title")} sublabel={t("subtitle")} />

      {/* Search and filter bar */}
      <div className="flex flex-col md:flex-row gap-3 justify-between mb-6">
        <div className="relative md:w-80">
          <Input
            placeholder={t("search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search size={16} className="text-site-dim" />}
            className="text-sm h-11 site-input"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop Filter */}
          <div className="hidden md:block">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="site-input px-4 py-2 h-11"
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
            className="md:hidden h-11 text-sm border-site-border-soft text-site-text bg-site-surface rounded-6"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter size={16} className="mr-2" /> {t("filter_title")}
          </Button>

          <div className="hidden md:flex bg-site-surface border border-site-border-soft rounded-6 p-1 h-11 items-center">
            <button
              className={`px-4 py-1.5 rounded-4 text-sm font-medium transition-colors ${viewMode === "table" ? "bg-site-raised text-site-accent" : "text-site-muted hover:text-site-text"}`}
              onClick={() => setViewMode("table")}
            >
              {t("view_mode.table")}
            </button>
            <button
              className={`px-4 py-1.5 rounded-4 text-sm font-medium transition-colors ${viewMode === "card" ? "bg-site-raised text-site-accent" : "text-site-muted hover:text-site-text"}`}
              onClick={() => setViewMode("card")}
            >
              {t("view_mode.card")}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <Sheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title={t("filter_title")}
      >
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-site-text mb-3 flex items-center">
              <Filter size={18} className="mr-2 text-site-accent" /> {t("table.status")}
            </h3>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setStatusFilter(option.value);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-6 border font-medium transition-colors ${statusFilter === option.value
                    ? "bg-site-accent/10 border-site-accent text-site-accent"
                    : "bg-site-surface border-site-border-soft text-site-muted hover:border-site-muted"
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
      <div className="site-card overflow-hidden">
        {isLoading ? (
          <div className="space-y-0 p-4">
            {[1, 2, 3, 4].map((i) => <SkeletonListRow key={i} />)}
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-site-raised border-b border-site-border-soft">
                <tr>
                  <th className="px-5 py-3 text-[11px] uppercase text-site-dim font-bold tracking-wider">
                    {t("table.order_number")}
                  </th>
                  <th className="px-5 py-3 text-[11px] uppercase text-site-dim font-bold tracking-wider">
                    {t("table.product")}
                  </th>
                  <th className="px-5 py-3 text-[11px] uppercase text-site-dim font-bold tracking-wider">
                    {t("table.date")}
                  </th>
                  <th className="px-5 py-3 text-[11px] uppercase text-site-dim font-bold tracking-wider">
                    {t("table.amount")}
                  </th>
                  <th className="px-5 py-3 text-[11px] uppercase text-site-dim font-bold tracking-wider">
                    {t("table.status")}
                  </th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-site-border-soft last:border-b-0 hover:bg-site-raised transition-colors"
                    >
                      <td className="px-5 py-3 text-sm font-medium text-site-text">
                        {order.orderNumber}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-6 border border-site-border-soft mr-3 bg-site-raised overflow-hidden flex-shrink-0">
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
                                <Package className="h-4 w-4 text-site-dim" />
                              </div>
                            )}
                          </div>
                          <span className="text-site-text text-sm line-clamp-1 font-medium">
                            {order.items[0]?.product?.name
                              ? order.items[0]?.productType?.name
                                ? `${order.items[0].product.name} - ${order.items[0].productType.name}`
                                : order.items[0].product.name
                              : order.items[0]?.productName || t("table.product")}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-site-muted">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-sm text-site-accent font-semibold">
                        {formatCurrency(order.finalAmount)}
                      </td>
                      <td className="px-5 py-3">
                        {renderStatusBadge(order.status)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <Button variant="outline" size="sm" className="text-xs h-7 px-3 border-site-border-soft text-site-text hover:bg-site-raised bg-transparent">
                            <Eye className="h-3 w-3 mr-1.5" />
                            {t("view_short")}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <EmptyState icon={ShoppingBag} message={
                        searchTerm
                          ? t("no_search_results", { query: searchTerm })
                          : t("no_orders_desc")
                      } />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          renderCardView()
        )}
      </div>
    </div>
  );
}
