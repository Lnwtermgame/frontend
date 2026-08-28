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
    CreditCard,
    Calendar,
    Mail,
    User,
    XCircle,
    RefreshCw,
    MapPin,
    Loader2,
    Eye,
    EyeOff,
} from "lucide-react";
import Link from "next/link";
import { orderApi, Order } from "@/lib/services/order-api";
import { deliveryApi, OrderDeliveryStatus } from "@/lib/services/delivery-api";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

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
                    <Badge variant="success">
                        <CheckCircle className="w-3 h-3" /> {tCommon("member")}
                    </Badge>
                );
            case "PENDING":
                return (
                    <Badge variant="warning">
                        <Clock className="w-3 h-3" /> {t("payment.status_pending")}
                    </Badge>
                );
            case "PROCESSING":
                return (
                    <Badge variant="info">
                        <RefreshCw className="w-3 h-3" /> {t("delivery.statuses.processing")}
                    </Badge>
                );
            case "CANCELLED":
                return (
                    <Badge variant="danger">
                        <XCircle className="w-3 h-3" /> Cancelled
                    </Badge>
                );
            case "FAILED":
                return (
                    <Badge variant="danger">
                        <AlertCircle className="w-3 h-3" /> Failed
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

    // Get delivery status badge
    const getDeliveryStatusBadge = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return (
                    <span className="inline-flex items-center text-xs text-status-success font-medium">
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> {t("delivery.statuses.completed")}
                    </span>
                );
            case "PENDING":
                return (
                    <span className="inline-flex items-center text-xs text-status-warning font-medium">
                        <Clock className="w-3.5 h-3.5 mr-1" /> {t("delivery.statuses.pending")}
                    </span>
                );
            case "PROCESSING":
                return (
                    <span className="inline-flex items-center text-xs text-status-info font-medium">
                        <RefreshCw className="w-3.5 h-3.5 mr-1" /> {t("delivery.statuses.processing")}
                    </span>
                );
            case "FAILED":
                return (
                    <span className="inline-flex items-center text-xs text-status-danger font-medium">
                        <XCircle className="w-3.5 h-3.5 mr-1" /> {t("delivery.statuses.failed")}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center text-xs text-site-muted font-medium">
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
                <div className="flex flex-col items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-8" />
                    <p className="text-site-muted">{tCommon("loading")}</p>
                </div>
            </div>
        );
    }

    // Show loading while fetching order
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-8" />
                    <p className="text-site-muted">{t("loading")}</p>
                </div>
            </div>
        );
    }

    // If order not found
    if (!order) {
        return (
            <div className="site-card p-12 text-center">
                <EmptyState icon={AlertCircle} message={t("error_not_found")} description={t("error_not_found_desc")} />
                <Link
                    href="/dashboard/orders"
                    className="site-btn inline-flex mt-4"
                >
                    {t("back_to_orders")}
                </Link>
            </div>
        );
    }

    return (
        <div>
            {/* Page Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Link
                        href="/dashboard/orders"
                        className="p-1.5 -ml-1.5 rounded-6 hover:bg-site-raised text-site-muted hover:text-site-text transition-colors border border-transparent hover:border-site-border-soft"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <SectionHeader level={1} title={t("title")} />
                </div>
                <div className="flex items-center gap-2 text-sm text-site-muted ml-8">
                    <span>
                        {t("order_id_label")}:{" "}
                        <span className="text-site-text font-mono font-semibold">
                            {order.orderNumber}
                        </span>
                    </span>
                    <span className="w-1 h-1 bg-site-border rounded-full"></span>
                    <span>{formatDate(order.createdAt)}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Status & Items */}
                    <div className="site-card overflow-hidden">
                        <div className="p-4 border-b border-site-border-soft flex justify-between items-center bg-site-raised">
                            <h3 className="font-bold text-site-text flex items-center gap-2 text-sm">
                                <Package className="h-4 w-4 text-site-accent" />
                                {t("items.title")}
                            </h3>
                            {getStatusBadge(order.status)}
                        </div>

                        <div className="divide-y divide-site-border-soft">
                            {order.items.map((item) => (
                                <div key={item.id} className="p-4">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="h-20 w-20 rounded-6 border border-site-border-soft bg-site-raised flex-shrink-0 overflow-hidden">
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
                                                    <h4 className="font-semibold text-site-text text-sm">
                                                        {item.product?.name
                                                            ? item.productType?.name
                                                                ? `${item.product.name} - ${item.productType.name}`
                                                                : item.product.name
                                                            : "Product"}
                                                    </h4>
                                                    <p className="text-site-muted text-xs font-medium mt-1">
                                                        {t("items.quantity")} {item.quantity}
                                                    </p>
                                                    {item.playerInfo &&
                                                        Object.keys(item.playerInfo).length > 0 &&
                                                        getDisplayPlayerInfo(
                                                            item.playerInfo as Record<string, unknown>,
                                                        ).length > 0 && (
                                                            <div className="mt-3 p-3 bg-site-raised border border-site-border-soft rounded-6 text-xs">
                                                                <p className="text-site-dim text-[10px] mb-2 font-bold uppercase tracking-wider">
                                                                    {t("items.account_info")}
                                                                </p>
                                                                {getDisplayPlayerInfo(
                                                                    item.playerInfo as Record<string, unknown>,
                                                                ).map(({ label, value }) => (
                                                                    <div key={label} className="flex gap-2">
                                                                        <span className="text-site-muted capitalize font-medium">
                                                                            {label}:
                                                                        </span>
                                                                        <span className="font-mono text-site-text font-medium">
                                                                            {value}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                </div>
                                                <p className="font-black text-site-text text-lg">
                                                    {formatPrice(item.priceAtPurchase)}
                                                </p>
                                            </div>

                                            {/* Delivery Status */}
                                            {deliveryStatus && (
                                                <div className="mt-3 flex items-center gap-2">
                                                    <span className="text-xs text-site-muted font-medium">
                                                        {t("items.delivery_status")}
                                                    </span>
                                                    {getDeliveryStatusBadge(item.fulfillStatus)}
                                                </div>
                                            )}

                                            {/* Digital Codes / PIN */}
                                            {item.fulfillStatus === "COMPLETED" &&
                                                item.pinCodes &&
                                                item.pinCodes.length > 0 && (
                                                    <div className="mt-4 bg-status-success/5 border border-status-success/20 rounded-8 p-4">
                                                        <p className="text-[10px] text-status-success uppercase font-bold mb-3 tracking-wider flex items-center gap-2">
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
                                                                        className="bg-site-raised p-3 rounded-6 border border-site-border-soft"
                                                                    >
                                                                        {/* card_number from SEAGM */}
                                                                        {codeValue && (
                                                                            <div className="flex items-center gap-3 group mb-2">
                                                                                <span className="text-[10px] text-site-dim min-w-[50px] font-bold uppercase">
                                                                                    {t("items.code_label")}
                                                                                </span>
                                                                                <div className="flex-1 flex items-center bg-site-surface border border-site-border-soft rounded-6 overflow-hidden">
                                                                                    <code
                                                                                        className={`flex-1 px-3 py-2 font-mono text-site-text text-sm tracking-widest break-all select-none transition-all duration-300 ${!isRevealed ? "blur-[6px] opacity-70 hover:blur-[2px]" : ""}`}
                                                                                    >
                                                                                        {codeValue}
                                                                                    </code>
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            toggleCodeVisibility(codeId)
                                                                                        }
                                                                                        className="p-2.5 text-site-muted hover:text-site-text hover:bg-site-raised transition-colors border-l border-site-border-soft"
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
                                                                                        className="p-2.5 text-site-muted hover:text-site-accent hover:bg-site-raised transition-colors border-l border-site-border-soft"
                                                                                        title="Copy Code"
                                                                                    >
                                                                                        {copiedCode === codeValue ? (
                                                                                            <Check
                                                                                                size={16}
                                                                                                className="text-status-success"
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
                                                                                <span className="text-[10px] text-site-dim min-w-[50px] font-bold uppercase">
                                                                                    {t("items.pin_label")}
                                                                                </span>
                                                                                <div className="flex-1 flex items-center bg-site-surface border border-site-border-soft rounded-6 overflow-hidden">
                                                                                    <code
                                                                                        className={`flex-1 px-3 py-2 font-mono text-site-text text-sm tracking-widest break-all select-none transition-all duration-300 ${!isRevealed ? "blur-[6px] opacity-70 hover:blur-[2px]" : ""}`}
                                                                                    >
                                                                                        {pinValue}
                                                                                    </code>
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            toggleCodeVisibility(codeId)
                                                                                        }
                                                                                        className="p-2.5 text-site-muted hover:text-site-text hover:bg-site-raised transition-colors border-l border-site-border-soft"
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
                                                                                        className="p-2.5 text-site-muted hover:text-site-accent hover:bg-site-raised transition-colors border-l border-site-border-soft"
                                                                                        title="Copy PIN"
                                                                                    >
                                                                                        {copiedCode === pinValue ? (
                                                                                            <Check
                                                                                                size={16}
                                                                                                className="text-status-success"
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
                                                                            <div className="flex items-center gap-3 group mt-3 pt-3 border-t border-site-border-soft">
                                                                                <span className="text-[10px] text-site-dim min-w-[50px] font-bold uppercase">
                                                                                    {t("items.serial_label")}
                                                                                </span>
                                                                                <div className="flex-1 flex items-center justify-between">
                                                                                    <code className="font-mono text-site-muted text-xs tracking-wider break-all">
                                                                                        {card.serial}
                                                                                    </code>
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            copyToClipboard(card.serial)
                                                                                        }
                                                                                        className="p-1.5 text-site-dim hover:text-site-accent transition-colors rounded-6 hover:bg-site-raised"
                                                                                        title="Copy Serial"
                                                                                    >
                                                                                        {copiedCode === card.serial ? (
                                                                                            <Check
                                                                                                size={14}
                                                                                                className="text-status-success"
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
                                                                            <div className="mt-2 text-xs text-site-dim">
                                                                                {t("items.expired_label")} <span className="text-site-muted">{card.expired}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="mt-3 flex items-start gap-2 p-2 bg-status-info/10 border border-status-info/20 rounded-6">
                                                            <div className="mt-0.5">
                                                                <AlertCircle size={14} className="text-status-info" />
                                                            </div>
                                                            <p className="text-xs text-status-info leading-relaxed font-medium">
                                                                {t("items.usage_hint")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                            {/* Failed Status */}
                                            {item.fulfillStatus === "FAILED" && (
                                                <div className="mt-4 bg-status-danger/10 border border-status-danger/20 rounded-8 p-4">
                                                    <p className="text-sm text-status-danger flex items-center gap-2 font-medium">
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
                    </div>

                    {/* Payment Info */}
                    <div className="site-card overflow-hidden">
                        <div className="p-4 border-b border-site-border-soft bg-site-raised">
                            <h3 className="font-bold text-site-text flex items-center gap-2 text-sm">
                                <CreditCard className="h-4 w-4 text-site-accent" />
                                {t("payment.title")}
                            </h3>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="flex justify-between text-sm font-medium">
                                <span className="text-site-muted">{t("payment.subtotal")}</span>
                                <span className="text-site-text font-black">
                                    {formatPrice(order.totalAmount)}
                                </span>
                            </div>
                            {order.discountAmount > 0 && (
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-site-muted">{t("payment.discount")}</span>
                                    <span className="text-status-success font-black">
                                        -{formatPrice(order.discountAmount)}
                                    </span>
                                </div>
                            )}
                            <div className="border-t border-site-border-soft my-3 pt-3 flex justify-between items-center">
                                <span className="font-bold text-site-text text-sm">
                                    {t("payment.total")}
                                </span>
                                <span className="font-black text-xl text-site-accent">
                                    {formatPrice(order.finalAmount)}
                                </span>
                            </div>

                            {order.payment && (
                                <div className="bg-site-raised border border-site-border-soft rounded-6 p-3 mt-4 text-sm flex items-center gap-3">
                                    <div className="p-2 bg-site-surface border border-site-border-soft rounded-6">
                                        <CreditCard size={18} className="text-site-accent" />
                                    </div>
                                    <div>
                                        <p className="text-site-dim text-[10px] font-bold uppercase">{t("payment.method")}</p>
                                        <p className="text-site-text font-medium">
                                            {getPaymentMethodDisplay(order.payment.paymentMethod)}
                                        </p>
                                    </div>
                                    <div className="ml-auto">
                                        <Badge variant={
                                            order.payment.status === "COMPLETED" ? "success"
                                                : order.payment.status === "PENDING" ? "warning"
                                                    : "neutral"
                                        }>
                                            {order.payment.status === "COMPLETED"
                                                ? t("payment.status_paid")
                                                : order.payment.status === "PENDING"
                                                    ? t("payment.status_pending")
                                                    : order.payment.status}
                                        </Badge>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Order Actions */}
                    {order.status === "PENDING" && (
                        <div className="site-card overflow-hidden border-status-danger/20">
                            <div className="p-4 border-b border-status-danger/20 bg-status-danger/5">
                                <h3 className="font-bold text-status-danger flex items-center gap-2 text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    {t("actions.cancel")}
                                </h3>
                            </div>
                            <div className="p-4">
                                <p className="text-xs text-site-muted mb-4 font-medium">
                                    {t("actions.cancel_hint")}
                                </p>
                                <button
                                    onClick={handleCancelOrder}
                                    disabled={isCancelling}
                                    className="w-full flex items-center justify-center gap-2 p-3 border border-status-danger/30 rounded-6 text-status-danger hover:bg-status-danger/10 transition-colors text-xs font-bold disabled:opacity-50"
                                >
                                    {isCancelling ? (
                                        <>
                                            <Loader2 size={16} className="opacity-50" />
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
                        </div>
                    )}

                    {/* Customer Info */}
                    <div className="site-card overflow-hidden">
                        <div className="p-4 border-b border-site-border-soft bg-site-raised">
                            <h3 className="font-bold text-site-text flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-site-accent" />
                                {t("customer.title")}
                            </h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 p-2 bg-site-raised border border-site-border-soft rounded-6">
                                    <User size={16} className="text-site-accent" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-site-dim font-bold uppercase">{t("customer.username")}</p>
                                    <p className="text-sm text-site-text font-medium mt-0.5">
                                        {order.user?.username || user?.username || "-"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 p-2 bg-site-raised border border-site-border-soft rounded-6">
                                    <Mail size={16} className="text-site-accent" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-site-dim font-bold uppercase">{t("customer.email")}</p>
                                    <p className="text-sm text-site-text font-medium mt-0.5">
                                        {order.user?.email || user?.email || "-"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 p-2 bg-site-raised border border-site-border-soft rounded-6">
                                    <Calendar size={16} className="text-site-accent" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-site-dim font-bold uppercase">{t("customer.date")}</p>
                                    <p className="text-sm text-site-text font-medium mt-0.5">
                                        {formatDate(order.createdAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Info */}
                    {deliveryStatus && (
                        <div className="site-card overflow-hidden">
                            <div className="p-4 border-b border-site-border-soft bg-site-raised">
                                <h3 className="font-bold text-site-text flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-site-accent" />
                                    {t("delivery.title")}
                                </h3>
                            </div>
                            <div className="p-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-site-muted font-medium">{t("delivery.status_summary")}</span>
                                        {getDeliveryStatusBadge(deliveryStatus.status)}
                                    </div>
                                    {deliveryStatus.completedAt && (
                                        <div className="flex justify-between items-center bg-site-raised p-3 rounded-6 border border-site-border-soft mt-2">
                                            <span className="text-[10px] text-site-dim font-bold uppercase">
                                                {t("delivery.completed_at")}
                                            </span>
                                            <span className="text-sm text-site-text font-medium">
                                                {formatDate(deliveryStatus.completedAt)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="site-card overflow-hidden">
                        <div className="p-4 border-b border-site-border-soft bg-site-raised">
                            <h3 className="font-bold text-site-text text-sm">{t("actions.title")}</h3>
                        </div>
                        <div className="p-4 space-y-3">
                            <Link
                                href="/support"
                                className="w-full flex items-center gap-2 p-3 bg-site-raised hover:bg-site-surface border border-site-border-soft rounded-6 text-site-text transition-colors text-xs font-medium focus:border-site-accent focus:outline-none"
                            >
                                <AlertCircle size={18} className="text-site-muted" />
                                {t("actions.report_issue")}
                            </Link>
                        </div>
                    </div>

                    <div className="text-center mt-6">
                        <Link
                            href="/support"
                            className="text-xs text-site-muted hover:text-site-text underline hover:no-underline font-medium transition-colors"
                        >
                            {t("actions.need_help")}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
