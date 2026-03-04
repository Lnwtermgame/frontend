"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  Package,
  Copy,
  Check,
  Download,
  CreditCard,
  Calendar,
  Mail,
  User,
  XCircle,
  RefreshCw,
  MapPin,
  Smartphone,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import { orderApi, Order } from "@/lib/services/order-api";
import { deliveryApi, OrderDeliveryStatus } from "@/lib/services/delivery-api";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function OrderDetailsPage() {
  const t = useTranslations("OrderDetail");
  const tCommon = useTranslations("Common");
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isInitialized } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [deliveryStatus, setDeliveryStatus] =
    useState<OrderDeliveryStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [revealedCodes, setRevealedCodes] = useState<Set<string>>(new Set());
  const [isCancelling, setIsCancelling] = useState(false);

  const orderId = params.orderId as string;

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isInitialized && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, router, isInitialized, pathname]);

  // Fetch order data
  useEffect(() => {
    if (orderId && user) {
      fetchOrderData();
    }
  }, [orderId, user]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      const [orderRes, deliveryRes] = await Promise.all([
        orderApi.getOrderById(orderId),
        deliveryApi.getDeliveryStatus(orderId).catch(() => null),
      ]);

      if (orderRes.success) {
        setOrder(orderRes.data);
      } else {
        toast.error(t("error_not_found"));
        router.push("/dashboard/orders");
      }

      if (deliveryRes) {
        setDeliveryStatus(deliveryRes);
      }
    } catch (error) {
      console.error("Failed to fetch order:", error);
      toast.error(t("error_loading"));
    } finally {
      setLoading(false);
    }
  };

  // Cancel order
  const handleCancelOrder = async () => {
    if (!confirm(t("actions.cancel_confirm"))) {
      return;
    }

    try {
      setIsCancelling(true);
      const response = await orderApi.cancelOrder(orderId);
      if (response.success) {
        toast.success(t("actions.cancel_success"));
        fetchOrderData();
      } else {
        toast.error(response.message || t("actions.cancel_failed"));
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Error occurred");
    } finally {
      setIsCancelling(false);
    }
  };

  // Copy code to clipboard
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(t("items.copy_success"));
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Toggle code visibility
  const toggleCodeVisibility = (codeId: string) => {
    setRevealedCodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(codeId)) {
        newSet.delete(codeId);
      } else {
        newSet.add(codeId);
      }
      return newSet;
    });
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 2,
    }).format(price);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    switch (s) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-3 py-1 border-[2px] border-black text-sm font-bold bg-brutal-green text-black">
            <CheckCircle className="w-4 h-4 mr-1.5" /> {tCommon("member")}
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center px-3 py-1 border-[2px] border-black text-sm font-bold bg-brutal-yellow text-black">
            <Clock className="w-4 h-4 mr-1.5" /> {t("payment.status_pending")}
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center px-3 py-1 border-[2px] border-black text-sm font-bold bg-brutal-blue text-black">
            <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> {t("delivery.statuses.processing")}
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-3 py-1 border-[2px] border-black text-sm font-bold bg-gray-300 text-black">
            <XCircle className="w-4 h-4 mr-1.5" /> Cancelled
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center px-3 py-1 border-[2px] border-black text-sm font-bold bg-red-100 text-red-700">
            <AlertCircle className="w-4 h-4 mr-1.5" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 border-[2px] border-black text-sm font-bold bg-gray-100 text-black">
            {status}
          </span>
        );
    }
  };

  // Get delivery status badge
  const getDeliveryStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center text-sm text-brutal-green font-medium">
            <CheckCircle className="w-4 h-4 mr-1" /> {t("delivery.statuses.completed")}
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center text-sm text-gray-600 font-medium">
            <Clock className="w-4 h-4 mr-1" /> {t("delivery.statuses.pending")}
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center text-sm text-brutal-blue font-medium">
            <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> {t("delivery.statuses.processing")}
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center text-sm text-red-600 font-medium">
            <XCircle className="w-4 h-4 mr-1" /> {t("delivery.statuses.failed")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-sm text-gray-600 font-medium">
            {status}
          </span>
        );
    }
  };

  // Get payment method display
  const getPaymentMethodDisplay = (method?: string) => {
    const methods: Record<string, string> = {
      CREDIT_CARD: t("payment.methods.credit_card"),
      PROMPTPAY: t("payment.methods.promptpay"),
      TRUEMONEY: t("payment.methods.truemoney"),
      BANK_TRANSFER: t("payment.methods.bank_transfer"),
    };
    return methods[method || ""] || method || t("payment.methods.unknown");
  };

  const getDisplayPlayerInfo = (
    playerInfo: Record<string, unknown>,
  ): Array<{ label: string; value: string }> => {
    const rows: Array<{ label: string; value: string }> = [];
    const phoneLikeKeys = new Set(["phone", "user id"]);

    const phoneValue = Object.entries(playerInfo).find(([key, value]) => {
      if (!phoneLikeKeys.has(key.toLowerCase())) {
        return false;
      }
      const strValue = String(value || "").trim();
      return strValue.length > 0;
    });

    if (phoneValue) {
      rows.push({ label: "Phone", value: String(phoneValue[1]).trim() });
    }

    for (const [key, value] of Object.entries(playerInfo)) {
      const normalizedKey = key.toLowerCase();
      if (phoneLikeKeys.has(normalizedKey)) {
        continue;
      }

      const strValue = String(value || "").trim();
      if (!strValue) {
        continue;
      }

      rows.push({ label: key, value: strValue });
    }

    return rows;
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

  // Show loading while fetching order
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 animate-spin text-black" />
          <p className="mt-4 text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  // If order not found
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-bold text-black mb-2">{t("error_not_found")}</h2>
        <p className="text-gray-600 mb-4">
          {t("error_not_found_desc")}
        </p>
        <Link
          href="/dashboard/orders"
          className="px-4 py-2 bg-black text-white font-medium border-[3px] border-black hover:bg-gray-800 transition-colors"
        >
          {t("back_to_orders")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="relative mb-4">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/dashboard/orders"
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-black transition-colors border-[2px] border-transparent hover:border-black"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <motion.h2
            className="text-lg font-bold text-black relative flex items-center"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="w-1.5 h-4 bg-brutal-blue mr-2"></span>
            {t("title")}
          </motion.h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600 ml-8">
          <span>
            {t("order_id_label")}:{" "}
            <span className="text-black font-mono font-bold">
              {order.orderNumber}
            </span>
          </span>
          <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
          <span>{formatDate(order.createdAt)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Order Status & Items */}
          <motion.div
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-3 border-b-[3px] border-black flex justify-between items-center bg-brutal-yellow">
              <h3 className="font-bold text-black flex items-center gap-2 text-sm">
                <Package className="h-4 w-4" />
                {t("items.title")}
              </h3>
              {getStatusBadge(order.status)}
            </div>

            <div className="divide-y divide-gray-200">
              {order.items.map((item) => (
                <div key={item.id} className="p-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="h-16 w-16 border-[2px] border-black bg-gray-100 flex-shrink-0">
                      <img
                        src={
                          item.product?.imageUrl ||
                          `https://placehold.co/100x100?text=${encodeURIComponent(item.product?.name || "Product")}`
                        }
                        alt={item.product?.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h4 className="font-bold text-black text-base">
                            {item.product?.name
                              ? item.productType?.name
                                ? `${item.product.name} - ${item.productType.name}`
                                : item.product.name
                              : "Product"}
                          </h4>
                          <p className="text-gray-600 text-xs font-bold">
                            {t("items.quantity")} {item.quantity}
                          </p>
                          {item.playerInfo &&
                            Object.keys(item.playerInfo).length > 0 &&
                            getDisplayPlayerInfo(
                              item.playerInfo as Record<string, unknown>,
                            ).length > 0 && (
                              <div className="mt-2 p-2 bg-brutal-gray border border-black/20 text-xs">
                                <p className="text-gray-600 text-[10px] mb-1 font-bold">
                                  {t("items.account_info")}
                                </p>
                                {getDisplayPlayerInfo(
                                  item.playerInfo as Record<string, unknown>,
                                ).map(({ label, value }) => (
                                  <div key={label} className="flex gap-2">
                                    <span className="text-gray-600 capitalize font-medium">
                                      {label}:
                                    </span>
                                    <span className="font-mono font-bold">
                                      {value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                        <p className="font-bold text-black text-sm">
                          {formatPrice(item.priceAtPurchase)}
                        </p>
                      </div>

                      {/* Delivery Status */}
                      {deliveryStatus && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-gray-600 font-bold">
                            {t("items.delivery_status")}
                          </span>
                          {getDeliveryStatusBadge(item.fulfillStatus)}
                        </div>
                      )}

                      {/* Digital Codes / PIN */}
                      {item.fulfillStatus === "COMPLETED" &&
                        item.pinCodes &&
                        item.pinCodes.length > 0 && (
                          <div className="mt-3 bg-brutal-green/20 border-[2px] border-black rounded-lg p-3">
                            <p className="text-[10px] text-black uppercase font-black mb-1">
                              {t("items.digital_codes")}
                            </p>
                            <div className="space-y-2">
                              {item.pinCodes.map((card: any, idx: number) => {
                                const codeValue =
                                  card.card_number || card.code || "";
                                const pinValue =
                                  card.card_pin || card.pin || "";
                                const codeId = `${item.id}-${idx}`;
                                const isRevealed = revealedCodes.has(codeId);

                                return (
                                  <div
                                    key={idx}
                                    className="bg-white p-2 border-[2px] border-black"
                                  >
                                    {/* card_number from SEAGM */}
                                    {codeValue && (
                                      <div className="flex items-center gap-2 group mb-1">
                                        <span className="text-[10px] text-gray-600 min-w-[40px] font-bold">
                                          {t("items.code_label")}
                                        </span>
                                        <code
                                          className={`flex-1 font-mono text-black text-xs tracking-wider break-all select-none ${!isRevealed ? "blur-sm hover:blur-none" : ""}`}
                                        >
                                          {codeValue}
                                        </code>
                                        <button
                                          onClick={() =>
                                            toggleCodeVisibility(codeId)
                                          }
                                          className="p-1 hover:bg-gray-100 text-gray-600 hover:text-black transition-colors shrink-0"
                                          title={
                                            isRevealed ? t("items.hide_code") : t("items.show_code")
                                          }
                                        >
                                          {isRevealed ? (
                                            <EyeOff size={14} />
                                          ) : (
                                            <Eye size={14} />
                                          )}
                                        </button>
                                        <button
                                          onClick={() =>
                                            copyToClipboard(codeValue)
                                          }
                                          className="p-1 hover:bg-gray-100 text-gray-600 hover:text-black transition-colors shrink-0"
                                          title="Copy Code"
                                        >
                                          {copiedCode === codeValue ? (
                                            <Check
                                              size={14}
                                              className="text-brutal-green"
                                            />
                                          ) : (
                                            <Copy size={14} />
                                          )}
                                        </button>
                                      </div>
                                    )}
                                    {/* card_pin from SEAGM */}
                                    {pinValue && (
                                      <div className="flex items-center gap-2 group">
                                        <span className="text-[10px] text-gray-600 min-w-[40px] font-bold">
                                          {t("items.pin_label")}
                                        </span>
                                        <code
                                          className={`flex-1 font-mono text-black text-xs tracking-wider break-all select-none ${!isRevealed ? "blur-sm hover:blur-none" : ""}`}
                                        >
                                          {pinValue}
                                        </code>
                                        <button
                                          onClick={() =>
                                            toggleCodeVisibility(codeId)
                                          }
                                          className="p-1 hover:bg-gray-100 text-gray-600 hover:text-black transition-colors shrink-0"
                                          title={
                                            isRevealed ? "Hide PIN" : "Show PIN"
                                          }
                                        >
                                          {isRevealed ? (
                                            <EyeOff size={14} />
                                          ) : (
                                            <Eye size={14} />
                                          )}
                                        </button>
                                        <button
                                          onClick={() =>
                                            copyToClipboard(pinValue)
                                          }
                                          className="p-1 hover:bg-gray-100 text-gray-600 hover:text-black transition-colors shrink-0"
                                          title="Copy PIN"
                                        >
                                          {copiedCode === pinValue ? (
                                            <Check
                                              size={14}
                                              className="text-brutal-green"
                                            />
                                          ) : (
                                            <Copy size={14} />
                                          )}
                                        </button>
                                      </div>
                                    )}
                                    {/* serial number if exists */}
                                    {card.serial && (
                                      <div className="flex items-center gap-2 group mt-1 pt-1 border-t border-gray-200">
                                        <span className="text-[10px] text-gray-600 min-w-[40px] font-bold">
                                          {t("items.serial_label")}
                                        </span>
                                        <code className="flex-1 font-mono text-black text-xs tracking-wider break-all">
                                          {card.serial}
                                        </code>
                                        <button
                                          onClick={() =>
                                            copyToClipboard(card.serial)
                                          }
                                          className="p-1 hover:bg-gray-100 text-gray-600 hover:text-black transition-colors shrink-0"
                                          title="Copy Serial"
                                        >
                                          {copiedCode === card.serial ? (
                                            <Check
                                              size={14}
                                              className="text-brutal-green"
                                            />
                                          ) : (
                                            <Copy size={14} />
                                          )}
                                        </button>
                                      </div>
                                    )}
                                    {/* expiration date if exists */}
                                    {card.expired && (
                                      <div className="mt-1 pt-1 border-t border-gray-200">
                                        <span className="text-[10px] text-gray-500 font-medium">
                                          {t("items.expired_label")} {card.expired}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-[10px] text-gray-600 mt-2 flex items-center gap-1 font-medium">
                              <AlertCircle size={10} />
                              {t("items.usage_hint")}
                            </p>
                          </div>
                        )}

                      {/* Failed Status */}
                      {item.fulfillStatus === "FAILED" && (
                        <div className="mt-3 bg-red-50 border-[2px] border-red-500 rounded-lg p-3">
                          <p className="text-xs text-red-700 flex items-center gap-2 font-bold">
                            <AlertCircle size={14} />
                            {t("items.delivery_failed")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Payment Info */}
          <motion.div
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="p-3 border-b-[3px] border-black bg-brutal-blue">
              <h3 className="font-bold text-black flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4" />
                {t("payment.title")}
              </h3>
            </div>

            <div className="p-3 space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-600">{t("payment.subtotal")}</span>
                <span className="text-black">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-gray-600">{t("payment.discount")}</span>
                  <span className="text-green-600">
                    -{formatPrice(order.discountAmount)}
                  </span>
                </div>
              )}
              <div className="border-t-[2px] border-black my-2 pt-2 flex justify-between items-center">
                <span className="font-bold text-black text-sm">
                  {t("payment.total")}
                </span>
                <span className="font-black text-lg text-black">
                  {formatPrice(order.finalAmount)}
                </span>
              </div>

              {order.payment && (
                <div className="bg-gray-100 rounded-lg p-2 mt-3 text-xs flex items-center gap-2 border-[2px] border-black">
                  <div className="p-1.5 bg-brutal-blue border-[2px] border-black">
                    <CreditCard size={14} className="text-black" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-[10px] font-bold">{t("payment.method")}</p>
                    <p className="text-black font-bold">
                      {getPaymentMethodDisplay(order.payment.paymentMethod)}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold border-[2px] border-black ${
                        order.payment.status === "COMPLETED"
                          ? "bg-brutal-green text-black"
                          : order.payment.status === "PENDING"
                            ? "bg-brutal-yellow text-black"
                            : "bg-gray-300 text-black"
                      }`}
                    >
                      {order.payment.status === "COMPLETED"
                        ? t("payment.status_paid")
                        : order.payment.status === "PENDING"
                          ? t("payment.status_pending")
                          : order.payment.status}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Order Actions */}
          {order.status === "PENDING" && (
            <motion.div
              className="bg-white border-[3px] border-black overflow-hidden"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="p-3 border-b-[3px] border-black bg-red-50">
                <h3 className="font-bold text-red-700 flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {t("actions.cancel")}
                </h3>
              </div>
              <div className="p-3">
                <p className="text-xs text-gray-600 mb-3 font-medium">
                  {t("actions.cancel_hint")}
                </p>
                <button
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="w-full flex items-center justify-center gap-2 p-2 border-[2px] border-red-500 text-red-600 hover:bg-red-50 transition-colors text-xs font-bold disabled:opacity-50"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      {t("actions.cancelling")}
                    </>
                  ) : (
                    <>
                      <XCircle size={14} />
                      {t("actions.cancel")}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Customer Info */}
          <motion.div
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="p-3 border-b-[3px] border-black bg-brutal-pink">
              <h3 className="font-bold text-black flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                {t("customer.title")}
              </h3>
            </div>
            <div className="p-3 space-y-3">
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  <User size={14} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 font-bold">{t("customer.username")}</p>
                  <p className="text-xs text-black font-bold">
                    {order.user?.username || user?.username || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  <Mail size={14} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 font-bold">{t("customer.email")}</p>
                  <p className="text-xs text-black font-bold">
                    {order.user?.email || user?.email || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  <Calendar size={14} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 font-bold">{t("customer.date")}</p>
                  <p className="text-xs text-black font-bold">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Delivery Info */}
          {deliveryStatus && (
            <motion.div
              className="bg-white border-[3px] border-black overflow-hidden"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="p-3 border-b-[3px] border-black bg-brutal-green">
                <h3 className="font-bold text-black flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  {t("delivery.title")}
                </h3>
              </div>
              <div className="p-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 font-bold">{t("delivery.status_summary")}</span>
                    {getDeliveryStatusBadge(deliveryStatus.status)}
                  </div>
                  {deliveryStatus.completedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 font-bold">
                        {t("delivery.completed_at")}
                      </span>
                      <span className="text-xs font-bold">
                        {formatDate(deliveryStatus.completedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="p-3 border-b-[3px] border-black bg-gray-100">
              <h3 className="font-bold text-black text-sm">{t("actions.title")}</h3>
            </div>
            <div className="p-2 space-y-2">
              <Link
                href="/support"
                className="w-full flex items-center gap-2 p-2 border-[2px] border-black hover:bg-gray-100 text-black transition-colors text-xs font-bold"
              >
                <AlertCircle size={16} />
                {t("actions.report_issue")}
              </Link>
            </div>
          </motion.div>

          <div className="text-center">
            <Link
              href="/support"
              className="text-xs text-black underline hover:no-underline font-bold"
            >
              {t("actions.need_help")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
