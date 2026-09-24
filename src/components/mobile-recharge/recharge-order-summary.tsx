"use client";

import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePaymentMethods } from "@/lib/query/hooks";
import { formatTHB } from "@/lib/pricing";
import type { CountryMeta } from "@/lib/mobile-countries";
import { useAuthStore } from "@/stores/auth";
import type { Product, ProductTypePublic } from "@/lib/api/products";

export type WizardState = {
  country: CountryMeta | null;
  phone: string;
  operator: Product | null;
  selectedType: ProductTypePublic | null;
};

/**
 * แผงสรุป (SEAGM-style) — ผู้รับ / รายการ / ยอดรวม / ปุ่มชำระ ต่อเนื่อง
 * Desktop: sticky ขวา / Mobile: แถบตรึงล่างเมื่อเลือกนิยามแล้ว
 * ปุ่ม disabled พร้อม label บอกขั้นที่ยังขาด (ไม่มี timeline 4 ขั้นแล้ว)
 */
export function RechargeOrderSummary({
  state,
  buying,
  buyError,
  onBuyAttempt,
}: {
  state: WizardState;
  buying: boolean;
  buyError: string | null;
  /** เก็บ signature เดิมไว้ (backend แจ้งเบอร์ผิด) — page จัดการ scroll เอง */
  phoneInvalid?: boolean;
  onBuyAttempt: () => void;
  onGoToStep?: (step: 1 | 2 | 3 | 4) => void;
}) {
  const t = useTranslations("mobileRecharge");
  const ta = useTranslations("auth");
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = Boolean(user);
  const methods = usePaymentMethods(isAuthenticated);
  const selectedOption = methods.data?.[0];
  const countryName = (c: CountryMeta) => (locale === "th" ? c.nameTh : c.nameEn);

  const { country, phone, operator, selectedType } = state;
  const phoneOk = /^\d{8,12}$/.test(phone);
  const total = selectedType?.displayPrice ?? 0;
  const allDone = Boolean(country && phoneOk && operator && selectedType);
  const buyingSpinner = buying ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null;

  const buyLabel = !country
    ? t("payLabelPickCountry")
    : !phoneOk
      ? t("payLabelEnterPhone")
      : !operator
        ? t("payLabelPickOperator")
        : !selectedType
          ? t("payLabelPickDenom")
          : t("payLabelPay", { total: formatTHB(total) });

  const summaryRows = (
    <>
      <div className="flex items-center justify-between gap-3 text-[12.5px]">
        <span className="text-muted-foreground">{t("summaryRecipient")}</span>
        <span className="num max-w-[60%] truncate font-medium">
          {country && phone ? `+${country.callingCode} ${phone}` : "—"}
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-3 text-[12.5px]">
        <span className="text-muted-foreground">{t("summaryOperator")}</span>
        <span className="max-w-[60%] truncate font-medium">{operator?.name ?? "—"}</span>
      </div>
      {selectedType ? (
        <div className="mt-1.5 flex items-start justify-between gap-3 text-[12.5px]">
          <span className="shrink-0 text-muted-foreground">{t("summaryDenomination")}</span>
          <span className="text-right font-medium">{selectedType.name}</span>
        </div>
      ) : null}
    </>
  );

  const totalBlock = (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-muted-foreground">{t("total")}</span>
        <span className="num text-[22px] leading-none font-extrabold text-primary">
          {formatTHB(total)}
        </span>
      </div>
      <Button
        size="lg"
        className="mt-3.5 h-12 w-full rounded-[6px] text-sm font-bold lg:h-11"
        onClick={onBuyAttempt}
        disabled={buying || !allDone}
        aria-busy={buying}
      >
        {buyingSpinner}
        {buyLabel}
      </Button>
      {!isAuthenticated ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">{ta("loginRequired")}</p>
      ) : null}
    </>
  );

  const errorBlock = buyError ? (
    <p
      role="alert"
      className="mt-3 rounded-[10px] border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {buyError}
    </p>
  ) : null;

  return (
    <>
      <aside className="rounded-[14px] border bg-card p-4 shadow-(--shadow-tile) lg:sticky lg:top-20">
        <div className="border-b border-border pb-3">{summaryRows}</div>

        {isAuthenticated ? (
          <div className="mt-3.5">
            <Label htmlFor="mr-payment-method" className="text-xs">
              {t("paymentMethod")}
            </Label>
            {methods.isLoading ? (
              <Skeleton className="mt-1.5 h-11 w-full rounded-lg lg:h-8" />
            ) : methods.data?.length ? (
              <Select value={selectedOption?.code ?? ""}>
                <SelectTrigger
                  id="mr-payment-method"
                  className="mt-1.5 w-full data-[size=default]:h-11 lg:data-[size=default]:h-8"
                >
                  <SelectValue placeholder={t("paymentMethod")} />
                </SelectTrigger>
                <SelectContent>
                  {methods.data.map((m) => (
                    <SelectItem key={m.code} value={m.code}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3.5 border-t border-border pt-3">
          {totalBlock}
          {errorBlock}
        </div>
      </aside>

      {/* มือถือ: แถบสรุปตรึงล่างเมื่อเลือกนิยามแล้ว */}
      {selectedType ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] leading-tight text-muted-foreground">{t("total")}</p>
              <p className="num text-lg leading-tight font-extrabold text-primary">
                {formatTHB(total)}
              </p>
            </div>
            <Button
              size="lg"
              className="h-12 shrink-0 rounded-[6px] px-4 text-sm font-bold"
              onClick={onBuyAttempt}
              disabled={buying}
              aria-busy={buying}
            >
              {buyingSpinner}
              {buyLabel}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
