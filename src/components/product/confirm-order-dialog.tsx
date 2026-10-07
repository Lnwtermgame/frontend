"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatTHB } from "@/lib/pricing";

export interface ConfirmReviewRow {
  label: string;
  value: string;
}

/**
 * ไดอะล็อกทวนคำสั่งซื้อก่อนสร้างจริง — แสดงข้อมูลที่กรอก (ไอดี/เบอร์/เซิร์ฟเวอร์)
 * + ช่องทางชำระเงิน + ค่าธรรมเนียม เพราะ "กรอกไอดีผิด" คือตั๋วซัพพอร์ตอันดับ 1
 */
export function ConfirmOrderDialog({
  open,
  onOpenChange,
  packageName,
  quantity,
  total,
  fee = 0,
  reviewRows = [],
  paymentLabel,
  onConfirm,
  buying,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageName: string;
  quantity: number;
  total: number;
  /** ค่าธรรมเนียมช่องทางชำระเงินที่ประเมินไว้ตอนกดซื้อ (0/ไม่เลือก = ไม่แสดงบรรทัด) */
  fee?: number;
  /** ข้อมูลบัญชี/ผู้รับที่กรอกไว้ แสดงเป็นบล็อก "ยืนยันข้อมูล" */
  reviewRows?: ConfirmReviewRow[];
  /** ชื่อช่องทางชำระเงินที่เลือก เช่น "TrueMoney Wallet" */
  paymentLabel?: string;
  onConfirm: () => void;
  buying: boolean;
}) {
  const t = useTranslations("product");
  const payable = total + fee;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("confirmTitle")}</DialogTitle>
          <DialogDescription>{t("confirmBody")}</DialogDescription>
        </DialogHeader>

        {reviewRows.length || paymentLabel ? (
          <div className="rounded-[10px] border bg-muted/30 p-3">
            <p className="text-xs font-bold tracking-wide text-muted-foreground-strong">
              {t("reviewInfoTitle")}
            </p>
            <dl className="mt-2 flex flex-col gap-1.5 text-sm">
              {reviewRows.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-3">
                  <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
                  <dd className="num min-w-0 break-all text-right font-semibold">{row.value}</dd>
                </div>
              ))}
              {paymentLabel ? (
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="shrink-0 text-muted-foreground">{t("paymentMethod")}</dt>
                  <dd className="min-w-0 truncate text-right font-semibold">{paymentLabel}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : null}

        <div className="flex items-center justify-between rounded-[10px] border p-3 text-sm">
          <span className="font-semibold">{packageName}</span>
          <span className="num">×{quantity}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t("subtotal")}</span>
          <span className="num text-lg font-bold text-primary">{formatTHB(total)}</span>
        </div>
        {fee > 0 ? (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground-strong">{t("paymentFee")}</span>
              <span className="num font-semibold">+{formatTHB(fee)}</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-border pt-2">
              <span className="text-sm font-medium">{t("payableTotal")}</span>
              <span className="num text-lg font-extrabold text-primary">
                {formatTHB(payable)}
              </span>
            </div>
          </>
        ) : null}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={buying}>
            {t("cancel")}
          </Button>
          <Button onClick={onConfirm} disabled={buying}>
            {buying ? t("buying") : t("confirmBuy")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
