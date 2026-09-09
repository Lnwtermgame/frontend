"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "@/i18n/routing";
import { useOrderDetail, useDeliveries } from "@/lib/query/hooks";
import { cancelOrderById } from "@/lib/api/dashboard";
import { formatTHB } from "@/lib/pricing";
import { StatusBadge, DashErrorState, formatDateTime } from "@/components/dashboard/shared";

export default function DashboardOrderDetailPage() {
  const t = useTranslations("dashboard");
  const routeParams = useParams<Record<string, string>>();
  const orderId = routeParams?.orderId ?? "";

  const order = useOrderDetail(orderId);
  const deliveries = useDeliveries({ limit: 50 });
  const delivery = deliveries.data?.data.find((d) => d.orderId === orderId);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (order.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-[14px]" />
        <Skeleton className="h-48 rounded-[14px]" />
      </div>
    );
  }

  if (order.isError || !order.data) {
    return <DashErrorState onRetry={() => order.refetch()} />;
  }

  const o = order.data;
  const canCancel = o.status === "PENDING";

  const copyPin = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // clipboard unavailable — no-op
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelOrderById(orderId);
      setCancelOpen(false);
      order.refetch();
    } catch {
      setCancelOpen(false);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-[14px] border bg-card p-4">
        <div>
          <p className="num text-lg font-bold">{o.orderNumber}</p>
          <p className="num text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <StatusBadge status={o.status} />
          <span className="num text-xl font-bold text-primary">{formatTHB(o.finalAmount)}</span>
        </div>
        {canCancel ? (
          <Button variant="outline" size="sm" onClick={() => setCancelOpen(true)}>
            {t("cancelOrder")}
          </Button>
        ) : null}
      </div>

      <section className="rounded-[14px] border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{t("items")}</h2>
        <div className="space-y-3">
          {o.items.map((item, idx) => (
            <div key={item.id ?? idx} className="rounded-[10px] border p-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">
                  {item.product?.name ?? item.productId}
                </span>
                <span className="num text-sm text-muted-foreground">×{item.quantity}</span>
                {item.priceAtPurchase ? (
                  <span className="num ml-auto text-sm font-bold">
                    {formatTHB(item.priceAtPurchase * item.quantity)}
                  </span>
                ) : null}
              </div>

              {item.fulfillStatus === "COMPLETED" && item.pinCodes?.length ? (
                <div className="mt-3">
                  <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                    {t("pinCodes")}
                  </p>
                  <div className="space-y-1.5">
                    {item.pinCodes.map((pin, pi) => {
                      const text = [pin.serial, pin.pin].filter(Boolean).join(" / ") || JSON.stringify(pin);
                      return (
                        <div
                          key={pi}
                          className="num flex items-center gap-2 rounded-[8px] bg-secondary px-3 py-1.5 text-sm"
                        >
                          <span className="flex-1">{text}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => copyPin(text, `${idx}-${pi}`)}
                          >
                            {copiedKey === `${idx}-${pi}` ? t("copied") : t("copyPin")}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {o.payment ? (
        <section className="rounded-[14px] border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{t("payment")}</h2>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={o.payment.status} />
            <span className="text-sm font-semibold">{o.payment.paymentMethod}</span>
            {o.payment.providerReference ? (
              <span className="num text-xs text-muted-foreground">
                REF: {o.payment.providerReference}
              </span>
            ) : null}
          </div>
        </section>
      ) : null}

      {delivery ? (
        <section className="rounded-[14px] border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{t("deliveryTitle")}</h2>
          <div className="space-y-2">
            {delivery.items.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center gap-2 text-sm">
                <StatusBadge status={item.status} />
                <span className="font-semibold">{item.productName}</span>
                <span className="num text-muted-foreground">×{item.quantity}</span>
                {item.deliveredAt ? (
                  <span className="num text-xs text-muted-foreground">
                    {formatDateTime(item.deliveredAt)}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div>
        <Link href="/dashboard/orders" className="text-sm text-muted-foreground hover:text-primary">
          ← {t("orders")}
        </Link>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("cancelOrder")}</DialogTitle>
            <DialogDescription>{t("cancelConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={cancelling}>
              {t("cancelOrder")}
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? t("status_PROCESSING") : t("cancelled")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
