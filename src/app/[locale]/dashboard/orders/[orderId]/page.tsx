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
                    <span className="inline-flex items-center px-3 py-1 border border-green-500/30/20 rounded-full text-sm font-bold bg-green-500/10 text-green-500">
                        <CheckCircle className="w-4 h-4 mr-1.5" /> {tCommon("member")}
                    </span>
                );
            case "PENDING":
                return (
                    <span className="inline-flex items-center px-3 py-1 border border-yellow-500/30/20 rounded-full text-sm font-bold bg-yellow-500/10 text-yellow-500">
                        <Clock className="w-4 h-4 mr-1.5" /> {t("payment.status_pending")}
                    </span>
                );
            case "PROCESSING":
                return (
                    <span className="inline-flex items-center px-3 py-1 border border-blue-500/20 rounded-full text-sm font-bold bg-blue-500/10 text-blue-500">
                        <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> {t("delivery.statuses.processing")}
                    </span>
                );
            case "CANCELLED":
                return (
                    <span className="inline-flex items-center px-3 py-1 border border-red-500/30/20 rounded-full text-sm font-bold bg-red-500/10 text-red-500">
                        <XCircle className="w-4 h-4 mr-1.5" /> Cancelled
                    </span>
                );
            case "FAILED":
                return (
                    <span className="inline-flex items-center px-3 py-1 border border-red-500/30/20 rounded-full text-sm font-bold bg-red-500/10 text-red-500">
                        <AlertCircle className="w-4 h-4 mr-1.5" /> Failed
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-3 py-1 border border-gray-600 rounded-full text-sm font-bold bg-gray-800 text-gray-300">
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
                    <span className="inline-flex items-center text-sm text-green-500 font-medium">
                        <CheckCircle className="w-4 h-4 mr-1" /> {t("delivery.statuses.completed")}
                    </span>
                );
            case "PENDING":
                return (
                    <span className="inline-flex items-center text-sm text-yellow-500 font-medium">
                        <Clock className="w-4 h-4 mr-1" /> {t("delivery.statuses.pending")}
                    </span>
                );
            case "PROCESSING":
                return (
                    <span className="inline-flex items-center text-sm text-blue-500 font-medium">
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> {t("delivery.statuses.processing")}
                    </span>
                );
            case "FAILED":
                return (
                    <span className="inline-flex items-center text-sm text-red-500 font-medium">
                        <XCircle className="w-4 h-4 mr-1" /> {t("delivery.statuses.failed")}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center text-sm text-gray-400 font-medium">
                        {status}
                    </span>
                );
        }
    };

    // Get payment method display
    const getPaymentMethodDisplay = (method?: string) => {
        const methods: Record<string, string> = {
            PROMPTPAY: t("payment.methods.promptpay"),
            TRUEMONEY: t("payment.methods.truemoney"),
            LINEPAY: "Line Pay",
            CREDIT_CARD: "Credit/Debit Card",
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
                    <div className="w-16 h-16 border-4 border-[var(--site-accent)] border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-400">{tCommon("loading")}</p>
                </div>
            </div>
        );
    }

    // Show loading while fetching order
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-[var(--site-accent)] border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-400">{t("loading")}</p>
                </div>
            </div>
        );
    }

    // If order not found
    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <AlertCircle className="w-16 h-16 text-gray-500 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">{t("error_not_found")}</h2>
                <p className="text-gray-400 mb-6">
                    {t("error_not_found_desc")}
                </p>
                <Link
                    href="/dashboard/orders"
                    className="px-6 py-2.5 bg-[var(--site-accent)] hover:bg-[#5AA1AB] text-white rounded-lg font-medium transition-colors"
                >
                    {t("back_to_orders")}
                </Link>
            </div>
        );
    }

    return (
        <div>
            {/* Page Header */}
            <div className="relative mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Link
                        href="/dashboard/orders"
                        className="p-1.5 -ml-1.5 rounded-lg hover:bg-[#212328]/5 text-gray-400 hover:text-white transition-colors border border-transparent hover:border-site-border"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <motion.h2
                        className="text-xl font-bold text-white relative flex items-center"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <span className="w-1.5 h-5 bg-[var(--site-accent)] mr-2 rounded-full shadow-[0_0_10px_rgba(103,176,186,0.5)]"></span>
                        {t("title")}
                    </motion.h2>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400 ml-8">
                    <span>
                        {t("order_id_label")}:{" "}
                        <span className="text-white font-mono font-semibold">
                            {order.orderNumber}
                        </span>
                    </span>
                    <span className="w-1 h-1 bg-[#181A1D]0 rounded-full"></span>
                    <span>{formatDate(order.createdAt)}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Status & Items */}
                    <motion.div
                        className="bg-[#222427] border border-site-border rounded-xl shadow-ocean overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="p-4 border-b border-site-border flex justify-between items-center bg-[#1A1C1E]">
                            <h3 className="font-bold text-white flex items-center gap-2 text-base">
                                <Package className="h-5 w-5 text-[var(--site-accent)]" />
                                {t("items.title")}
                            </h3>
                            {getStatusBadge(order.status)}
                        </div>

                        <div className="divide-y divide-site-border">
                            {order.items.map((item) => (
                                <div key={item.id} className="p-4">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="h-20 w-20 rounded-lg border border-site-border bg-[#1A1C1E] flex-shrink-0 overflow-hidden">
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
                                                    <h4 className="font-semibold text-white text-base">
                                                        {item.product?.name
                                                            ? item.productType?.name
                                                                ? `${item.product.name} - ${item.productType.name}`
                                                                : item.product.name
                                                            : "Product"}
                                                    </h4>
                                                    <p className="text-gray-400 text-sm font-medium mt-1">
                                                        {t("items.quantity")} {item.quantity}
                                                    </p>
                                                    {item.playerInfo &&
                                                        Object.keys(item.playerInfo).length > 0 &&
                                                        getDisplayPlayerInfo(
                                                            item.playerInfo as Record<string, unknown>,
                                                        ).length > 0 && (
                                                            <div className="mt-3 p-3 bg-[#1A1C1E] border border-site-border rounded-lg text-xs">
                                                                <p className="text-gray-500 text-[10px] mb-2 font-bold uppercase tracking-wider">
                                                                    {t("items.account_info")}
                                                                </p>
                                                                {getDisplayPlayerInfo(
                                                                    item.playerInfo as Record<string, unknown>,
                                                                ).map(({ label, value }) => (
                                                                    <div key={label} className="flex gap-2">
                                                                        <span className="text-gray-400 capitalize font-medium">
                                                                            {label}:
                                                                        </span>
                                                                        <span className="font-mono text-white font-medium">
                                                                            {value}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                </div>
                                                <p className="font-bold text-[var(--site-accent)] text-lg">
                                                    {formatPrice(item.priceAtPurchase)}
                                                </p>
                                            </div>

                                            {/* Delivery Status */}
                                            {deliveryStatus && (
                                                <div className="mt-3 flex items-center gap-2">
                                                    <span className="text-sm text-gray-400 font-medium">
                                                        {t("items.delivery_status")}
                                                    </span>
                                                    {getDeliveryStatusBadge(item.fulfillStatus)}
                                                </div>
                                            )}

                                            {/* Digital Codes / PIN */}
                                            {item.fulfillStatus === "COMPLETED" &&
                                                item.pinCodes &&
                                                item.pinCodes.length > 0 && (
                                                    <div className="mt-4 bg-green-500/5 border border-green-500/30/20 rounded-xl p-4">
                                                        <p className="text-xs text-green-500 uppercase font-bold mb-3 tracking-wider flex items-center gap-2">
                                                            <CheckCircle size={14} />
                                                            {t("items.digital_codes")}
                                                        </p>
                                                        <div className="space-y-3">
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
                                                                        className="bg-[#1A1C1E] p-3 rounded-lg border border-site-border"
                                                                    >
                                                                        {/* card_number from SEAGM */}
                                                                        {codeValue && (
                                                                            <div className="flex items-center gap-3 group mb-2">
                                                                                <span className="text-xs text-gray-500 min-w-[50px] font-medium">
                                                                                    {t("items.code_label")}
                                                                                </span>
                                                                                <div className="flex-1 flex items-center bg-[#222427] border border-site-border rounded-md overflow-hidden">
                                                                                    <code
                                                                                        className={`flex-1 px-3 py-2 font-mono text-white text-sm tracking-widest break-all select-none transition-all duration-300 ${!isRevealed ? "blur-[6px] opacity-70 hover:blur-[2px]" : ""}`}
                                                                                    >
                                                                                        {codeValue}
                                                                                    </code>
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            toggleCodeVisibility(codeId)
                                                                                        }
                                                                                        className="p-2.5 text-gray-400 hover:text-white hover:bg-[#212328]/5 transition-colors border-l border-site-border"
                                                                                        title={
                                                                                            isRevealed ? t("items.hide_code") : t("items.show_code")
                                                                                        }
                                                                                    >
                                                                                        {isRevealed ? (
                                                                                            <EyeOff size={16} />
                                                                                        ) : (
                                                                                            <Eye size={16} />
                                                                                        )}
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            copyToClipboard(codeValue)
                                                                                        }
                                                                                        className="p-2.5 text-gray-400 hover:text-[var(--site-accent)] hover:bg-[#212328]/5 transition-colors border-l border-site-border"
                                                                                        title="Copy Code"
                                                                                    >
                                                                                        {copiedCode === codeValue ? (
                                                                                            <Check
                                                                                                size={16}
                                                                                                className="text-green-500"
                                                                                            />
                                                                                        ) : (
                                                                                            <Copy size={16} />
                                                                                        )}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {/* card_pin from SEAGM */}
                                                                        {pinValue && (
                                                                            <div className="flex items-center gap-3 group">
                                                                                <span className="text-xs text-gray-500 min-w-[50px] font-medium">
                                                                                    {t("items.pin_label")}
                                                                                </span>
                                                                                <div className="flex-1 flex items-center bg-[#222427] border border-site-border rounded-md overflow-hidden">
                                                                                    <code
                                                                                        className={`flex-1 px-3 py-2 font-mono text-white text-sm tracking-widest break-all select-none transition-all duration-300 ${!isRevealed ? "blur-[6px] opacity-70 hover:blur-[2px]" : ""}`}
                                                                                    >
                                                                                        {pinValue}
                                                                                    </code>
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            toggleCodeVisibility(codeId)
                                                                                        }
                                                                                        className="p-2.5 text-gray-400 hover:text-white hover:bg-[#212328]/5 transition-colors border-l border-site-border"
                                                                                        title={
                                                                                            isRevealed ? "Hide PIN" : "Show PIN"
                                                                                        }
                                                                                    >
                                                                                        {isRevealed ? (
                                                                                            <EyeOff size={16} />
                                                                                        ) : (
                                                                                            <Eye size={16} />
                                                                                        )}
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            copyToClipboard(pinValue)
                                                                                        }
                                                                                        className="p-2.5 text-gray-400 hover:text-[var(--site-accent)] hover:bg-[#212328]/5 transition-colors border-l border-site-border"
                                                                                        title="Copy PIN"
                                                                                    >
                                                                                        {copiedCode === pinValue ? (
                                                                                            <Check
                                                                                                size={16}
                                                                                                className="text-green-500"
                                                                                            />
                                                                                        ) : (
                                                                                            <Copy size={16} />
                                                                                        )}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {/* serial number if exists */}
                                                                        {card.serial && (
                                                                            <div className="flex items-center gap-3 group mt-3 pt-3 border-t border-site-border">
                                                                                <span className="text-xs text-gray-500 min-w-[50px] font-medium">
                                                                                    {t("items.serial_label")}
                                                                                </span>
                                                                                <div className="flex-1 flex items-center justify-between">
                                                                                    <code className="font-mono text-gray-300 text-xs tracking-wider break-all">
                                                                                        {card.serial}
                                                                                    </code>
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            copyToClipboard(card.serial)
                                                                                        }
                                                                                        className="p-1.5 text-gray-500 hover:text-[var(--site-accent)] transition-colors rounded-md hover:bg-[#212328]/5"
                                                                                        title="Copy Serial"
                                                                                    >
                                                                                        {copiedCode === card.serial ? (
                                                                                            <Check
                                                                                                size={14}
                                                                                                className="text-green-500"
                                                                                            />
                                                                                        ) : (
                                                                                            <Copy size={14} />
                                                                                        )}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {/* expiration date if exists */}
                                                                        {card.expired && (
                                                                            <div className="mt-2 text-xs text-gray-500">
                                                                                {t("items.expired_label")} <span className="text-gray-400">{card.expired}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="mt-3 flex items-start gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
                                                            <div className="mt-0.5">
                                                                <AlertCircle size={14} className="text-blue-400" />
                                                            </div>
                                                            <p className="text-xs text-blue-200 leading-relaxed font-medium">
                                                                {t("items.usage_hint")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                            {/* Failed Status */}
                                            {item.fulfillStatus === "FAILED" && (
                                                <div className="mt-4 bg-red-500/10 border border-red-500/30/20 rounded-xl p-4">
                                                    <p className="text-sm text-red-400 flex items-center gap-2 font-medium">
                                                        <AlertCircle size={16} />
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
                        className="bg-[#222427] border border-site-border rounded-xl shadow-ocean overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="p-4 border-b border-site-border bg-[#1A1C1E]">
                            <h3 className="font-bold text-white flex items-center gap-2 text-base">
                                <CreditCard className="h-5 w-5 text-[var(--site-accent)]" />
                                {t("payment.title")}
                            </h3>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="flex justify-between text-sm font-medium">
                                <span className="text-gray-400">{t("payment.subtotal")}</span>
                                <span className="text-white">
                                    {formatPrice(order.totalAmount)}
                                </span>
                            </div>
                            {order.discountAmount > 0 && (
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-gray-400">{t("payment.discount")}</span>
                                    <span className="text-green-400">
                                        -{formatPrice(order.discountAmount)}
                                    </span>
                                </div>
                            )}
                            <div className="border-t border-site-border my-3 pt-3 flex justify-between items-center">
                                <span className="font-bold text-white text-base">
                                    {t("payment.total")}
                                </span>
                                <span className="font-black text-xl text-[var(--site-accent)]">
                                    {formatPrice(order.finalAmount)}
                                </span>
                            </div>

                            {order.payment && (
                                <div className="bg-[#1A1C1E] border border-site-border rounded-lg p-3 mt-4 text-sm flex items-center gap-3">
                                    <div className="p-2 bg-[#222427] border border-site-border rounded-lg">
                                        <CreditCard size={18} className="text-[var(--site-accent)]" />
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs font-semibold uppercase">{t("payment.method")}</p>
                                        <p className="text-white font-medium">
                                            {getPaymentMethodDisplay(order.payment.paymentMethod)}
                                        </p>
                                    </div>
                                    <div className="ml-auto">
                                        <span
                                            className={`px-2.5 py-1 text-xs font-bold rounded-full border ${order.payment.status === "COMPLETED"
                                                ? "bg-green-500/10 border-green-500/30/20 text-green-500"
                                                : order.payment.status === "PENDING"
                                                    ? "bg-yellow-500/10 border-yellow-500/30/20 text-yellow-500"
                                                    : "bg-gray-800 border-gray-600 text-gray-300"
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
                <div className="space-y-6">
                    {/* Order Actions */}
                    {order.status === "PENDING" && (
                        <motion.div
                            className="bg-[#222427] border border-red-500/30/20 rounded-xl overflow-hidden"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="p-4 border-b border-red-500/30/20 bg-red-500/5">
                                <h3 className="font-bold text-red-400 flex items-center gap-2 text-base">
                                    <AlertCircle className="h-5 w-5" />
                                    {t("actions.cancel")}
                                </h3>
                            </div>
                            <div className="p-4">
                                <p className="text-sm text-gray-400 mb-4 font-medium">
                                    {t("actions.cancel_hint")}
                                </p>
                                <button
                                    onClick={handleCancelOrder}
                                    disabled={isCancelling}
                                    className="w-full flex items-center justify-center gap-2 p-3 border border-red-500/30/50 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors text-sm font-bold disabled:opacity-50"
                                >
                                    {isCancelling ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            {t("actions.cancelling")}
                                        </>
                                    ) : (
                                        <>
                                            <XCircle size={16} />
                                            {t("actions.cancel")}
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Customer Info */}
                    <motion.div
                        className="bg-[#222427] border border-site-border rounded-xl shadow-ocean overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="p-4 border-b border-site-border bg-[#1A1C1E]">
                            <h3 className="font-bold text-white flex items-center gap-2 text-base">
                                <User className="h-5 w-5 text-purple-400" />
                                {t("customer.title")}
                            </h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 p-2 bg-[#1A1C1E] border border-site-border rounded-lg">
                                    <User size={16} className="text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold uppercase">{t("customer.username")}</p>
                                    <p className="text-sm text-white font-medium mt-0.5">
                                        {order.user?.username || user?.username || "-"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 p-2 bg-[#1A1C1E] border border-site-border rounded-lg">
                                    <Mail size={16} className="text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold uppercase">{t("customer.email")}</p>
                                    <p className="text-sm text-white font-medium mt-0.5">
                                        {order.user?.email || user?.email || "-"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 p-2 bg-[#1A1C1E] border border-site-border rounded-lg">
                                    <Calendar size={16} className="text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold uppercase">{t("customer.date")}</p>
                                    <p className="text-sm text-white font-medium mt-0.5">
                                        {formatDate(order.createdAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Delivery Info */}
                    {deliveryStatus && (
                        <motion.div
                            className="bg-[#222427] border border-site-border rounded-xl shadow-ocean overflow-hidden"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="p-4 border-b border-site-border bg-[#1A1C1E]">
                                <h3 className="font-bold text-white flex items-center gap-2 text-base">
                                    <MapPin className="h-5 w-5 text-green-400" />
                                    {t("delivery.title")}
                                </h3>
                            </div>
                            <div className="p-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-400 font-medium">{t("delivery.status_summary")}</span>
                                        {getDeliveryStatusBadge(deliveryStatus.status)}
                                    </div>
                                    {deliveryStatus.completedAt && (
                                        <div className="flex justify-between items-center bg-[#1A1C1E] p-3 rounded-lg border border-site-border mt-2">
                                            <span className="text-xs text-gray-500 font-semibold uppercase">
                                                {t("delivery.completed_at")}
                                            </span>
                                            <span className="text-sm text-white font-medium">
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
                        className="bg-[#222427] border border-site-border rounded-xl shadow-ocean overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="p-4 border-b border-site-border bg-[#1A1C1E]">
                            <h3 className="font-bold text-white text-base">{t("actions.title")}</h3>
                        </div>
                        <div className="p-4 space-y-3">
                            <Link
                                href="/support"
                                className="w-full flex items-center gap-2 p-3 bg-[#1A1C1E] hover:bg-[#212328]/5 border border-site-border rounded-lg text-white transition-colors text-sm font-medium focus:border-[var(--site-accent)] focus:outline-none"
                            >
                                <AlertCircle size={18} className="text-gray-400" />
                                {t("actions.report_issue")}
                            </Link>
                        </div>
                    </motion.div>

                    <div className="text-center mt-6">
                        <Link
                            href="/support"
                            className="text-sm text-gray-400 hover:text-white underline hover:no-underline font-medium transition-colors"
                        >
                            {t("actions.need_help")}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
