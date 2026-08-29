"use client";

import Link from "next/link";
import {
    ArrowLeft,
    CheckCircle2,
    CircleX,
    Clock3,
    Loader2,
    ReceiptText,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/Button";
import { paymentApi } from "@/lib/services/payment-api";

import { useTranslations } from "next-intl";

type PaymentStatus = "loading" | "success" | "processing" | "declined" | "failed";

function PaymentSuccessPageContent() {
    const t = useTranslations("PaymentSuccess");
    const tNav = useTranslations("Navigation");
    const tCommon = useTranslations("Common");
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId") || "";
    const referenceNo = searchParams.get("referenceNo") || searchParams.get("session_id") || "";

    const [status, setStatus] = useState<PaymentStatus>("loading");

    useEffect(() => {
        let timer: ReturnType<typeof setInterval> | null = null;
        let isStopped = false;
        let attempts = 0;

        const load = async () => {
            if (!orderId) {
                setStatus("failed");
                return true;
            }

            try {
                // Use public verify endpoint with referenceNo (no auth needed)
                // Falls back to authenticated endpoint if referenceNo is not available
                const res = referenceNo
                    ? await paymentApi.verifyPublic(orderId, referenceNo)
                    : await paymentApi.getStatus(orderId);

                if (!res.success) {
                    setStatus("failed");
                    return true;
                }

                const currentStatus = res.data.status;

                if (currentStatus === "COMPLETED") {
                    setStatus("success");
                    return true;
                }

                if (currentStatus === "PROCESSING" || currentStatus === "PENDING") {
                    setStatus("processing");
                    return false;
                }

                // Payment exists but was declined/failed by gateway
                setStatus("declined");
                return true;
            } catch {
                // API error or payment not found
                setStatus("failed");
                return true;
            }
        };

        const bootstrap = async () => {
            const done = await load();
            if (done || isStopped) {
                return;
            }

            timer = setInterval(async () => {
                if (isStopped) {
                    return;
                }

                attempts += 1;
                const isDone = await load();

                if (isDone || attempts >= 20) {
                    if (timer) {
                        clearInterval(timer);
                    }
                }
            }, 3000);
        };

        bootstrap();

        return () => {
            isStopped = true;
            if (timer) {
                clearInterval(timer);
            }
        };
    }, [orderId, referenceNo]);

    const statusConfig = {
        success: {
            label: t("title"),
            title: t("title"),
            description: t("subtitle"),
            icon: <CheckCircle2 className="h-10 w-10 text-status-success" />,
            accent: "bg-status-success/15",
            badge: "bg-status-success/15 text-status-success border-status-success/30",
            panelTitle: "Order Ready",
        },
        processing: {
            label: t("processing_badge"),
            title: "Verifying Payment",
            description:
                "We are confirming your payment. Please wait a moment or refresh the page.",
            icon: <Clock3 className="h-10 w-10 text-status-warning" />,
            accent: "bg-status-warning/15",
            badge: "bg-status-warning/15 text-status-warning border-status-warning/30",
            panelTitle: "Processing Order",
        },
        declined: {
            label: "Declined",
            title: "Payment Declined",
            description:
                "Your payment was declined by the payment provider. Please try again with a different payment method or a higher amount.",
            icon: <CircleX className="h-10 w-10 text-status-danger" />,
            accent: "bg-status-danger/15",
            badge: "bg-status-danger/15 text-status-danger border-status-danger/30",
            panelTitle: "Need Help?",
        },
        failed: {
            label: "Failed",
            title: "Payment Not Found",
            description:
                "We couldn't retrieve your payment information. Please contact support or try again.",
            icon: <CircleX className="h-10 w-10 text-status-danger" />,
            accent: "bg-status-danger/15",
            badge: "bg-status-danger/15 text-status-danger border-status-danger/30",
            panelTitle: "Need Help?",
        },
        loading: {
            label: tCommon("loading"),
            title: "Checking Status...",
            description: "Please wait while we sync your order information.",
            icon: <Loader2 className="h-10 w-10 animate-spin text-site-muted" />,
            accent: "bg-site-raised",
            badge: "bg-site-raised text-site-muted border-site-border-soft",
            panelTitle: "Fetching Data",
        },
    }[status];

    return (
        <main className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-transparent">
            <div className="pointer-events-none absolute -left-24 top-20 h-56 w-56 rounded-full border border-site-border/30 bg-status-warning/15" />
            <div className="pointer-events-none absolute -right-16 bottom-10 h-44 w-44 rounded-full border border-site-border/30 bg-site-accent/15" />

            <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center px-4 py-8 sm:px-6 lg:px-8">
                <section className="w-full overflow-hidden border border-site-border/30 rounded-8 bg-site-surface">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-site-border bg-site-bg px-4 py-3 sm:px-6">
                        <Link
                            href="/games"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-site-muted transition-colors hover:text-site-text"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {t("back_home")}
                        </Link>
                        <span
                            className={`inline-flex items-center rounded-4 border px-3 py-1 text-xs font-semibold ${statusConfig.badge}`}
                        >
                            {statusConfig.label}
                        </span>
                    </div>

                    <div className="grid gap-0 lg:grid-cols-[1.5fr_1fr]">
                        <div className="space-y-6 p-5 sm:p-7">
                            <div className="flex items-start gap-4">
                                <div
                                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-8 border border-site-border/30 ${statusConfig.accent}`}
                                >
                                    {statusConfig.icon}
                                </div>
                                <div className="space-y-2">
                                    <h1 className="text-2xl font-extrabold text-site-text sm:text-3xl">
                                        {statusConfig.title}
                                    </h1>
                                    <p className="max-w-xl text-sm text-site-muted sm:text-base font-bold">
                                        {statusConfig.description}
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {orderId && (
                                    <div className="rounded-8 border border-site-border bg-site-surface p-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-site-dim">
                                            {t("order_number")}
                                        </p>
                                        <p className="mt-1 break-all text-sm font-bold text-site-text">
                                            {orderId}
                                        </p>
                                    </div>
                                )}
                                {referenceNo && (
                                    <div className="rounded-8 border border-site-border bg-site-surface p-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-site-dim">
                                            Reference No.
                                        </p>
                                        <p className="mt-1 break-all text-sm font-bold text-site-text">
                                            {referenceNo}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href="/dashboard/orders"
                                    className={buttonVariants({ variant: "primary", size: "md" })}
                                >
                                    {t("view_order")}
                                </Link>
                                <Link
                                    href="/games"
                                    className={buttonVariants({
                                        variant: "secondary",
                                        size: "md",
                                    })}
                                >
                                    {t("back_home")}
                                </Link>
                            </div>
                        </div>

                        <aside className="border-t border-site-border bg-site-raised p-5 sm:p-7 lg:border-l lg:border-t-0">
                            <div className="space-y-4">
                                <p className="inline-flex items-center gap-2 border border-site-border bg-status-warning/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-status-warning">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Payment Flow
                                </p>
                                <h2 className="text-lg font-bold text-site-text">
                                    {statusConfig.panelTitle}
                                </h2>

                                <div className="space-y-3 text-sm text-site-muted">
                                    <div className="flex items-start gap-3 rounded-6 border border-site-border bg-site-surface p-3">
                                        <ReceiptText className="mt-0.5 h-4 w-4 shrink-0 text-site-text" />
                                        <p className="font-bold">{t("delivery_notice")}</p>
                                    </div>
                                    <div className="flex items-start gap-3 rounded-6 border border-site-border bg-site-surface p-3">
                                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-site-text" />
                                        <p className="font-bold">Secure payment powered by FeelFreePay</p>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </section>
            </div>
        </main>
    );
}

// Wrapper with Suspense boundary
export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<PaymentLoadingFallback />}>
            <PaymentSuccessPageContent />
        </Suspense>
    );
}

function PaymentLoadingFallback() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-site-bg">
            <Loader2 className="h-8 w-8 animate-spin text-site-accent" />
        </div>
    );
}
