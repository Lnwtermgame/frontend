"use client";

import { Check, Loader2 } from "lucide-react";
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

/** ชิปเลขขั้นตอน — สไตล์เดียวกับ order-summary.tsx ของหน้าสินค้า */
function StepChip({ n, done, active }: { n: number; done?: boolean; active?: boolean }) {
  return (
    <span className="num relative grid size-[22px] shrink-0 place-items-center overflow-hidden rounded-[7px] bg-card text-[11.5px] font-bold">
      <span
        aria-hidden
        className={`absolute inset-0 ${done ? "bg-status-success/15" : active ? "bg-primary/15" : ""}`}
      />
      <span
        className={`relative ${done ? "text-status-success" : active ? "text-primary" : "text-muted-foreground"}`}
      >
        {done ? <Check className="size-3.5" aria-hidden /> : n}
      </span>
    </span>
  );
}

export type WizardState = {
  country: CountryMeta | null;
  phone: string;
  operator: Product | null;
  selectedType: ProductTypePublic | null;
};

/**
 * แผงสรุปการเติมเงิน — ใบเสร็จของ wizard 4 ขั้น
 * Desktop: sticky ขวา / Mobile: ตัวแผงใน DOM + แถบตรึงล่างเมื่อเลือกนิยามแล้ว
 * ปุ่ม PAY NOW เปลี่ยน label ตามขั้นแรกที่ยังไม่เสร็จ (บอกเหตุของ disabled)
 */
export function RechargeOrderSummary({
  state,
  buying,
  buyError,
  phoneInvalid,
  onBuyAttempt,
  onGoToStep,
}: {
  state: WizardState;
  buying: boolean;
  buyError: string | null;
  /** backend แจ้งเบอร์ผิด — กดปุ่มแล้วพาไปแก้ขั้น 2 */
  phoneInvalid: boolean;
  onBuyAttempt: () => void;
  onGoToStep: (step: 1 | 2 | 3 | 4) => void;
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

  const handleAttempt = () => {
    if (!country) return onGoToStep(1);
    if (!phoneOk) return onGoToStep(2);
    if (!operator) return onGoToStep(3);
    if (!selectedType) return onGoToStep(4);
    onBuyAttempt();
  };

  const summaryRows = (
    <>
      <div className="flex items-center justify-between gap-3 text-[12.5px]">
        <span className="text-muted-foreground">{t("summaryCountry")}</span>
        <span className="font-medium">
          {country ? `${country.flag} ${countryName(country)}` : "—"}
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-3 text-[12.5px]">
        <span className="text-muted-foreground">{t("summaryPhone")}</span>
        <span className="num font-medium">{country && phone ? `+${country.callingCode} ${phone}` : "—"}</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-3 text-[12.5px]">
        <span className="text-muted-foreground">{t("summaryOperator")}</span>
        <span className="max-w-[60%] truncate font-medium">{operator?.name ?? "—"}</span>
      </div>
      {selectedType ? (
        <div className="mt-1.5 flex items-center justify-between gap-3 text-[12.5px]">
          <span className="text-muted-foreground">{t("summaryDenomination")}</span>
          <span className="max-w-[60%] truncate font-medium">{selectedType.name}</span>
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
        className={`mt-3.5 h-12 w-full text-sm font-semibold lg:h-10 ${allDone ? "" : ""}`}
        onClick={handleAttempt}
        disabled={buying}
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
        {/* ไทม์ไลน์ 4 ขั้นแบบเดียวกับหน้าสินค้า */}
        <div className="relative">
          <span
            aria-hidden
            className="absolute top-[22px] bottom-[22px] left-[10.5px] w-px bg-border"
          />
          {(
            [
              [1, Boolean(country), t("stepCountry"), country ? `${country.flag} ${countryName(country)}` : null],
              [2, phoneOk, t("stepPhone"), country && phone ? `+${country.callingCode} ${phone}` : null],
              [3, Boolean(operator), t("stepOperator"), operator?.name ?? null],
              [4, Boolean(selectedType), t("stepDenomination"), selectedType?.name ?? null],
            ] as Array<[number, boolean, string, string | null]>
          ).map(([n, done, title, value]) => (
            <div key={n} className={n > 1 ? "mt-4" : ""}>
              <div className="flex items-center gap-2.5">
                <StepChip n={n} done={done} active={!done} />
                <span className="text-[13px] font-bold">{title}</span>
                {done && value ? (
                  <button
                    type="button"
                    onClick={() => onGoToStep(n as 1 | 2 | 3 | 4)}
                    className="ml-auto text-[11.5px] font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    {t("editStep")}
                  </button>
                ) : null}
              </div>
              {done && value ? (
                <p className="mt-1.5 pl-[32px] text-[12.5px] font-medium">{value}</p>
              ) : null}
            </div>
          ))}
        </div>

        {isAuthenticated ? (
          <div className="mt-4">
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

        <div className="mt-4 border-t border-border pt-3">
          {summaryRows}
          <div className="mt-3">{totalBlock}</div>
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
              className="h-12 shrink-0 px-4 text-sm font-semibold"
              onClick={handleAttempt}
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
