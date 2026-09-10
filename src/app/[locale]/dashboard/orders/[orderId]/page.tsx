"use client";

import { useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  CreditCard,
  Info,
  Package,
  RotateCcw,
  Truck,
  X,
} from "lucide-react";
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
import { useOrderDetail, useDeliveryStatus } from "@/lib/query/hooks";
import { cancelOrderById, resendDelivery } from "@/lib/api/dashboard";
import { formatTHB } from "@/lib/pricing";
import { StatusBadge, DashErrorState, formatDateTime } from "@/components/dashboard/shared";
import { formatTime } from "@/lib/format";
import { GameCover } from "@/components/product/game-cover";
import { cn } from "@/lib/utils";

/* ผัง "ติดตามสถานะ" (mockup B · order-detail-directions) — แถบ 4 ขั้น + ไทม์ไลน์แนวตั้ง
 * ทุกสถานะ/เวลามาจากข้อมูลจริง: order.createdAt/updatedAt, delivery.completedAt, deliveryItem.deliveredAt
 * ไม่มี timestamp ของการชำระเงินแยก จึงแสดงเฉพาะป้ายสถานะในขั้นชำระเงิน */

type StepState = "ok" | "bad" | "cur" | "off";

const DOT_CLASS: Record<StepState, string> = {
  ok: "border-status-success/70 bg-status-success/15 text-status-success",
  bad: "border-destructive/70 bg-destructive/15 text-destructive",
  cur: "border-status-warning/70 bg-status-warning/15 text-status-warning",
  off: "border-border bg-secondary text-muted-foreground",
};

const LINE_CLASS: Record<StepState, string> = {
  ok: "before:bg-[color-mix(in_oklab,var(--status-success)_55%,var(--border))]",
  bad: "before:bg-[color-mix(in_oklab,var(--status-success)_55%,var(--border))]",
  cur: "before:bg-[color-mix(in_oklab,var(--status-warning)_55%,var(--border))]",
  off: "",
};

const SUB_CLASS: Record<StepState, string> = {
  ok: "text-muted-foreground",
  bad: "text-destructive",
  cur: "text-status-warning",
  off: "text-muted-foreground/60",
};

const RAIL_DOT_CLASS: Record<StepState, string> = {
  ok: "border-status-success/50 bg-status-success/15 text-status-success",
  bad: "border-destructive/50 bg-destructive/15 text-destructive",
  cur: "border-status-warning/50 bg-status-warning/15 text-status-warning",
  off: "border-border bg-secondary text-muted-foreground",
};

/* เดิมพื้นที่ชำระเงินแสดง raw method — แปลงเป็นชื่อไทยเหมือนหน้าชำระเงิน */
const PRODUCT_BASE = {
  DIRECT_TOPUP: "/games",
  CARD: "/card",
  MOBILE_RECHARGE: "/mobile-recharge",
} as const;

function uidFromInfo(info: Record<string, unknown> | null | undefined): string {
  if (!info) return "";
  const vals: string[] = [];
  for (const v of Object.values(info)) {
    if (typeof v === "string" && v.trim()) vals.push(v.trim());
    if (vals.length >= 2) break;
  }
  return vals.join(" · ");
}

function LeadRow({ label, value, num }: { label: string; value: string; num?: boolean }) {
  return (
    <div className="flex items-baseline gap-1.5 text-[13.5px]">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span aria-hidden className="min-w-4 flex-1 -translate-y-0.5 border-b border-dotted border-border" />
      <span className={cn("max-w-[55%] text-right font-semibold", num && "num")}>{value}</span>
    </div>
  );
}

export default function DashboardOrderDetailPage() {
  const t = useTranslations("dashboard");
  const routeParams = useParams<Record<string, string>>();
  const orderId = routeParams?.orderId ?? "";

  const order = useOrderDetail(orderId);
  const deliveryQ = useDeliveryStatus(orderId);
  const delivery = deliveryQ.data;

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedNo, setCopiedNo] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  if (order.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-[14px]" />
        <Skeleton className="h-48 rounded-[14px]" />
      </div>
    );
  }

  if (order.isError || !order.data) {
    return <DashErrorState onRetry={() => order.refetch()} />;
  }

  const o = order.data;
  const pay = o.payment;
  const canCancel = o.status === "PENDING";

  /* backend เก็บ delivery record สถานะ PENDING ค้างไว้แม้ออเดอร์ยกเลิก/ชำระไม่สำเร็จ —
     ขั้นจัดส่งถือว่า "ยังไม่ถึง" ยกเว้นออเดอร์ถึงขั้นตอนส่งมอบจริง */
  const stage3Reached =
    o.status === "PROCESSING" || o.status === "COMPLETED" || pay?.status === "COMPLETED";
  const d = stage3Reached ? delivery : undefined;

  const statusLabel = (s: string) => {
    try {
      const label = t(`status_${s}` as never);
      return typeof label === "string" && !label.startsWith("status_") ? label : s;
    } catch {
      return s;
    }
  };

  const payMethodLabel = (method: string) => {
    try {
      const label = t(`pay_${method}` as never);
      return typeof label === "string" && !label.startsWith("pay_") ? label : method;
    } catch {
      return method;
    }
  };

  const deliveryTypeLabel = (type: string) => {
    try {
      const label = t(`delivery_${type}` as never);
      return typeof label === "string" && !label.startsWith("delivery_") ? label : type;
    } catch {
      return type;
    }
  };

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(o.orderNumber);
      setCopiedNo(true);
      setTimeout(() => setCopiedNo(false), 2000);
    } catch {
      // clipboard unavailable — no-op
    }
  };

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

  const handleResend = async (itemId: string) => {
    setResendingId(itemId);
    try {
      await resendDelivery(orderId, itemId);
      await deliveryQ.refetch();
    } catch {
      // keep current delivery state on failure
    } finally {
      setResendingId(null);
    }
  };

  /* ── สถานะขั้นบันได ─────────────────────────── */
  const payState: StepState =
    pay?.status === "COMPLETED"
      ? "ok"
      : pay?.status === "FAILED"
        ? "bad"
        : pay?.status === "REFUNDED" || o.status === "CANCELLED"
          ? "off"
          : "cur";

  const delState: StepState =
    d?.status === "COMPLETED" ? "ok" : d?.status === "FAILED" ? "bad" : d ? "cur" : "off";

  const doneState: StepState = o.status === "COMPLETED" ? "ok" : "off";

  const deliveredAt = d?.items.find((i) => i.deliveredAt)?.deliveredAt;
  const completedAt = d?.completedAt;

  const steps: { label: string; state: StepState; sub: string }[] = [
    { label: t("stepReceived"), state: "ok", sub: formatTime(o.createdAt) },
    {
      label: t("stepPayment"),
      state: payState,
      sub: pay ? statusLabel(pay.status) : "—",
    },
    {
      label: t("stepDelivery"),
      state: delState,
      sub: d
        ? d.status === "COMPLETED" && deliveredAt
          ? formatTime(deliveredAt)
          : statusLabel(d.status)
        : "—",
    },
    {
      label: t("stepDone"),
      state: doneState,
      sub: doneState === "ok" ? formatTime(completedAt ?? o.updatedAt) : "—",
    },
  ];

  /* ── ลิงก์ "ซื้ออีกครั้ง" จากสินค้ารายการแรก ── */
  const firstProduct = o.items.find((i) => i.product)?.product;
  const buyHref = firstProduct
    ? `${PRODUCT_BASE[firstProduct.productType]}/${firstProduct.slug}`
    : null;

  const dest = d?.items.map((i) => uidFromInfo(i.playerInfo)).filter(Boolean)[0] ?? "";

  const stageRail = (state: StepState, icon: ReactNode, next: StepState, body: ReactNode) => (
    <div className="grid grid-cols-[26px_minmax(0,1fr)] gap-3">
      <div className="flex flex-col items-center self-stretch" aria-hidden>
        <span className={cn("grid size-[26px] shrink-0 place-items-center rounded-full border bg-card", RAIL_DOT_CLASS[state])}>
          {icon}
        </span>
        <span
          className={cn(
            "mt-1 w-0.5 flex-1 rounded-full",
            state === "ok" && next !== "off" ? "bg-status-success/40" : "bg-border",
          )}
        />
      </div>
      <div className="min-w-0 pb-5">
        {body}
      </div>
    </div>
  );

  return (
    <div className="rounded-[14px] border bg-card shadow-(--shadow-tile)">
      {/* หัวหน้า: กลับ + เลขที่ + วันที่ + สถานะ + ยอด */}
      <div className="p-4 pb-0">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          {t("ordersMy")}
        </Link>
        <div className="mt-2.5 flex flex-wrap items-start gap-x-3 gap-y-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <h1 className="num truncate text-[17px] font-bold">{o.orderNumber}</h1>
              <button
                type="button"
                onClick={copyNumber}
                aria-label={t("copyOrderNumber")}
                className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {copiedNo ? <Check className="size-3.5 text-status-success" /> : <Copy className="size-3.5" />}
              </button>
            </div>
            <p className="num mt-0.5 text-xs text-muted-foreground">
              {t("createdAtLabel")} {formatDateTime(o.createdAt)}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <StatusBadge status={o.status} />
            <span className="num text-xl font-bold text-primary">{formatTHB(o.finalAmount)}</span>
          </div>
        </div>
      </div>

      {/* แถบสถานะ 4 ขั้น */}
      <ol className="grid grid-cols-2 gap-y-5 px-2 pb-1 pt-6 max-sm:before:hidden sm:grid-cols-4">
        {steps.map((s, i) => (
          <li
            key={s.label}
            aria-current={s.state === "cur" ? "step" : undefined}
            className={cn(
              "relative min-w-0 px-1 pt-7 text-center",
              "before:absolute before:left-0 before:right-0 before:top-[15px] before:h-0.5 before:bg-border",
              i === 0 && "before:left-1/2",
              i === steps.length - 1 && "before:right-1/2",
              LINE_CLASS[s.state],
            )}
          >
            <span
              className={cn(
                "absolute left-1/2 top-1.5 z-10 grid size-5 -translate-x-1/2 place-items-center rounded-full border-2 bg-card",
                DOT_CLASS[s.state],
              )}
            >
              {s.state === "ok" ? (
                <Check className="size-3" aria-hidden />
              ) : s.state === "bad" ? (
                <X className="size-3" aria-hidden />
              ) : s.state === "cur" ? (
                <Clock className="size-3" aria-hidden />
              ) : null}
            </span>
            <span
              className={cn(
                "block truncate px-0.5 text-[12.5px] font-semibold",
                s.state === "off" && "font-medium text-muted-foreground",
                s.state === "bad" && "text-destructive",
              )}
            >
              {s.label}
            </span>
            <span className={cn("num mt-0.5 block text-[11.5px]", SUB_CLASS[s.state])}>{s.sub}</span>
          </li>
        ))}
      </ol>

      {/* ไทม์ไลน์รายขั้น */}
      <div className="px-4 pb-2 pt-3">
        {/* ขั้น 1 — รับคำสั่งซื้อ */}
        {stageRail(
          "ok",
          <Package className="size-3.5" aria-hidden />,
          payState,
          <>
            <div className="flex flex-wrap items-baseline gap-x-2.5">
              <h2 className="text-sm font-bold">{t("stepReceived")}</h2>
              <span className="num text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</span>
            </div>
            <div className="mt-2.5 rounded-[10px] border bg-background/60 p-3">
              <div className="space-y-3">
                {o.items.map((item, idx) => (
                  <div key={item.id ?? idx}>
                    <div className="flex items-center gap-3">
                      <div className="w-[52px] shrink-0">
                        <GameCover
                          name={item.product?.name ?? "?"}
                          imageUrl={item.product?.imageUrl}
                          fallbackSub={item.productType?.name ?? "TOP-UP"}
                          sizes="52px"
                          compact
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">
                          {item.product?.name ?? item.productId}
                        </p>
                        {item.productType?.name ? (
                          <p className="truncate text-xs text-muted-foreground">{item.productType.name}</p>
                        ) : null}
                        {uidFromInfo(item.playerInfo) ? (
                          <p className="num truncate text-[11px] text-muted-foreground/80">
                            {uidFromInfo(item.playerInfo)}
                          </p>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="num block text-xs text-muted-foreground">×{item.quantity}</span>
                        {item.priceAtPurchase ? (
                          <span className="num block text-sm font-bold">
                            {formatTHB(item.priceAtPurchase * item.quantity)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {item.fulfillStatus === "COMPLETED" && item.pinCodes?.length ? (
                      <div className="mt-2.5">
                        <p className="mb-1 text-xs font-semibold text-muted-foreground">{t("pinCodes")}</p>
                        <div className="space-y-1.5">
                          {item.pinCodes.map((pin, pi) => {
                            const text =
                              [pin.serial, pin.pin].filter(Boolean).join(" / ") || JSON.stringify(pin);
                            return (
                              <div
                                key={pi}
                                className="num flex items-center gap-2 rounded-lg bg-secondary px-2.5 py-1.5 text-[13px]"
                              >
                                <span className="min-w-0 flex-1 break-all">{text}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 shrink-0 text-xs"
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
              <div className="mt-3 space-y-1.5 border-t border-dashed pt-3 text-[13.5px]">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-muted-foreground">{t("subtotal")}</span>
                  <span className="num">{formatTHB(o.totalAmount)}</span>
                </div>
                {o.discountAmount > 0 ? (
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-muted-foreground">{t("discount")}</span>
                    <span className="num text-status-success">−{formatTHB(o.discountAmount)}</span>
                  </div>
                ) : null}
                <div className="flex items-baseline justify-between gap-3 pt-1 text-base font-bold">
                  <span>{t("total")}</span>
                  <span className="num text-primary">{formatTHB(o.finalAmount)}</span>
                </div>
              </div>
            </div>
          </>,
        )}

        {/* ขั้น 2 — ชำระเงิน */}
        {stageRail(
          payState,
          <CreditCard className="size-3.5" aria-hidden />,
          delState,
          <>
            <div className="flex flex-wrap items-baseline gap-x-2.5">
              <h2 className="text-sm font-bold">{t("stepPayment")}</h2>
            </div>
            {pay ? (
              <div className="mt-2.5 space-y-1.5 rounded-[10px] border bg-background/60 p-3">
                <LeadRow label={t("paymentChannel")} value={payMethodLabel(pay.paymentMethod)} />
                {pay.providerReference ? (
                  <LeadRow label={t("providerRef")} value={pay.providerReference} num />
                ) : null}
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-[13.5px] text-muted-foreground">{t("status")}</span>
                  <StatusBadge status={pay.status} />
                </div>
                {pay.status === "FAILED" ? (
                  <p className="flex items-start gap-1.5 pt-1 text-xs text-muted-foreground">
                    <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    {t("paymentFailedNote")}
                  </p>
                ) : pay.status === "PENDING" || pay.status === "PROCESSING" ? (
                  <p className="flex items-start gap-1.5 pt-1 text-xs text-muted-foreground">
                    <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    {t("pendingPaymentNote")}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-2.5 rounded-[10px] border border-dashed p-3 text-[13px] text-muted-foreground">
                {t("pendingPaymentNote")}
              </div>
            )}
          </>,
        )}

        {/* ขั้น 3 — จัดส่งสินค้า */}
        {stageRail(
          delState,
          <Truck className="size-3.5" aria-hidden />,
          doneState,
          <>
            <div className="flex flex-wrap items-baseline gap-x-2.5">
              <h2 className="text-sm font-bold">{t("stepDelivery")}</h2>
              {deliveredAt ? (
                <span className="num text-xs text-muted-foreground">{formatDateTime(deliveredAt)}</span>
              ) : null}
            </div>
            {deliveryQ.isLoading ? (
              <Skeleton className="mt-2.5 h-14 rounded-[10px]" />
            ) : d ? (
              <div className="mt-2.5 space-y-2 rounded-[10px] border bg-background/60 p-3">
                <LeadRow
                  label={t("deliveryMethodLabel")}
                  value={deliveryTypeLabel(d.items[0]?.productType ?? "DIRECT_TOPUP")}
                />
                {dest ? <LeadRow label={t("deliveryDestination")} value={dest} num /> : null}
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-[13.5px] text-muted-foreground">{t("status")}</span>
                  <StatusBadge status={d.status} />
                </div>
                {d.items.map((di) => (
                  <div key={di.id} className="border-t border-dashed pt-2">
                    <div className="flex flex-wrap items-center gap-2 text-[13.5px]">
                      <span className="min-w-0 flex-1 truncate font-semibold">{di.productName}</span>
                      <span className="num text-muted-foreground">×{di.quantity}</span>
                      {di.deliveredAt ? (
                        <span className="num text-xs text-muted-foreground">
                          {formatDateTime(di.deliveredAt)}
                        </span>
                      ) : null}
                    </div>
                    {di.status === "FAILED" ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-destructive/10 px-2.5 py-2 text-xs text-destructive">
                        <span className="min-w-0 flex-1">
                          {t("deliveryError")}
                          {di.errorMessage ? `: ${di.errorMessage}` : ""}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={resendingId === di.id}
                          onClick={() => handleResend(di.id)}
                        >
                          <RotateCcw className="size-3.5" aria-hidden />
                          {resendingId === di.id ? t("status_PROCESSING") : t("resend")}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : o.status === "CANCELLED" || o.status === "FAILED" ? (
              <div className="mt-2.5 rounded-[10px] border border-dashed p-3 text-[13px] text-muted-foreground">
                {t("deliveryNotReached")}
              </div>
            ) : (
              <div className="mt-2.5 rounded-[10px] border border-dashed p-3 text-[13px] text-muted-foreground">
                {t("deliveryWaitPay")}
              </div>
            )}
          </>,
        )}

        {/* ขั้น 4 — สำเร็จ */}
        {stageRail(
          doneState,
          <Check className="size-3.5" aria-hidden />,
          "off",
          <div className="flex flex-wrap items-baseline gap-x-2.5">
            <h2 className={cn("text-sm font-bold", doneState === "off" && "text-muted-foreground")}>
              {t("stepDone")}
            </h2>
            <span className="num text-xs text-muted-foreground">
              {doneState === "ok" ? formatDateTime(completedAt ?? o.updatedAt) : "—"}
            </span>
          </div>,
        )}
      </div>

      {/* ปุ่มดำเนินการ */}
      <div className="flex flex-wrap gap-2 p-4">
        {canCancel ? (
          <Button
            variant="outline"
            className="flex-1 basis-40 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setCancelOpen(true)}
          >
            {t("cancelOrder")}
          </Button>
        ) : buyHref ? (
          <Button asChild className="flex-1 basis-40">
            <Link href={buyHref}>{t("buyAgain")}</Link>
          </Button>
        ) : null}
        {o.status === "COMPLETED" ? (
          <Button asChild variant="outline" className="flex-1 basis-40">
            <Link href="/dashboard/invoice">{t("requestInvoice")}</Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="flex-1 basis-40">
            <Link href="/support">{t("contactSupport")}</Link>
          </Button>
        )}
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
