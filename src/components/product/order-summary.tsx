"use client";

import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DynamicFields, validateRequired } from "./dynamic-fields";
import { usePaymentMethods } from "@/lib/query/hooks";
import { verifyPlayer, verifyMobileRecharge } from "@/lib/api/products";
import type { Product, ProductTypePublic, SeagmField } from "@/lib/api/products";
import { formatTHB, lineTotal } from "@/lib/pricing";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth";

export interface BuyPayload {
  playerInfo: Record<string, string>;
  quantity: number;
  paymentOptionCode?: string;
  paymentMethod: "PROMPTPAY" | "TRUEMONEY" | "LINEPAY" | "CREDIT_CARD" | "BANK_TRANSFER";
}

/* หัวข้อย่อยแบบเดียวกับ "วิธีเติม" ของหน้าแรก — ชิปเลขสี่เหลี่ยมมน ไม่ใช่วงกลม+เส้นเชื่อม */
function StepChip({ n, done, active }: { n: number; done?: boolean; active?: boolean }) {
  return (
    <span
      className={`num grid size-[22px] shrink-0 place-items-center rounded-[7px] text-[11.5px] font-bold ${
        done
          ? "bg-status-success/15 text-status-success"
          : active
            ? "bg-primary/15 text-primary"
            : "bg-secondary text-muted-foreground"
      }`}
    >
      {done ? <Check className="size-3.5" /> : n}
    </span>
  );
}

export function OrderSummary({
  product,
  selectedType,
  onBuy,
  buying,
}: {
  product: Product;
  selectedType: ProductTypePublic | null;
  onBuy: (payload: BuyPayload) => void;
  buying: boolean;
}) {
  const t = useTranslations("product");
  const ta = useTranslations("auth");
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = Boolean(user);

  const fields: SeagmField[] = useMemo(() => {
    if (!selectedType) return [];
    return selectedType.fields ?? [];
  }, [selectedType]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [verifyState, setVerifyState] = useState<"idle" | "checking" | "ok" | "fail">("idle");
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [optionCode, setOptionCode] = useState<string | null>(null);

  const methods = usePaymentMethods(isAuthenticated);
  const selectedOption = methods.data?.find((m) => m.code === optionCode) ?? methods.data?.[0];

  // reset per selected type
  useEffect(() => {
    setValues({});
    setErrors({});
    setVerifyState("idle");
    setVerifyMessage(null);
    setQty(selectedType ? Math.max(selectedType.minAmount, 1) : 1);
  }, [selectedType?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = selectedType ? lineTotal(selectedType.displayPrice, qty) : 0;
  const isMobileRecharge = product.productType === "MOBILE_RECHARGE";

  const verified = verifyState === "ok";
  const requiresVerify = Boolean(selectedType && fields.length > 0);
  const accountLocked = verified; // ล็อกฟิลด์หลังตรวจสอบผ่าน กันแก้ไอดีพลาดโดยไม่รู้ตัว

  const handleVerify = async () => {
    if (!selectedType) return;
    const errs = validateRequired(fields, values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setVerifyState("checking");
    try {
      const result = isMobileRecharge
        ? await verifyMobileRecharge(
            product.id,
            selectedType.id,
            values.phone ?? values.phoneNumber ?? "",
            undefined,
          )
        : await verifyPlayer(product.id, values, selectedType.id);
      if (result.valid) {
        setVerifyState("ok");
        setVerifyMessage(result.message || t("verified"));
      } else {
        setVerifyState("fail");
        setVerifyMessage(t("verifyFailed"));
      }
    } catch (err) {
      setVerifyState("fail");
      const info = err instanceof ApiError ? err.infoCode : undefined;
      setVerifyMessage(
        info === "20133" || info === "20093"
          ? t("playerInvalid")
          : info === "20114"
            ? t("phoneRegionMismatch")
            : t("verifyFailed"),
      );
    }
  };

  const handleEditAccount = () => {
    // ปลดล็อก = ต้องตรวจสอบใหม่เสมอ (กันแก้ไอดีแล้วลืมว่ายังไม่ได้เช็ค)
    setVerifyState("idle");
    setVerifyMessage(null);
  };

  const handleBuy = () => {
    if (!selectedType) return;
    const errs = validateRequired(fields, values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (!isAuthenticated) {
      const current = window.location.pathname;
      window.location.href = `/login?redirect=${encodeURIComponent(current)}`;
      return;
    }
    onBuy({
      playerInfo: values,
      quantity: qty,
      paymentOptionCode: selectedOption?.code,
      paymentMethod: selectedOption?.method ?? "PROMPTPAY",
    });
  };

  const qtyMax = selectedType?.maxAmount ?? 1;
  const qtyMin = selectedType?.minAmount ?? 1;
  const buyDisabled = !selectedType || buying || (requiresVerify && !verified);
  const buyLabel = buying
    ? t("buying")
    : requiresVerify && !verified
      ? t("needVerify")
      : t("buy");

  const stepRow = "flex items-center gap-2.5";

  return (
    <aside className="sticky top-20 rounded-[14px] border bg-card p-4 shadow-(--shadow-tile)">
      {/* ขั้น 1 · เลือกแพ็กเกจ */}
      <div className={stepRow}>
        <StepChip n={1} done={Boolean(selectedType)} />
        <span className="text-[13px] font-bold">เลือกแพ็กเกจ</span>
      </div>
      <p className="mt-2 truncate pl-[32px] text-xs text-muted-foreground">
        {selectedType
          ? `${selectedType.name} · ${formatTHB(selectedType.displayPrice)}`
          : t("pickFromLeft")}
      </p>

      {/* ขั้น 2 · ข้อมูลบัญชีเกม */}
      {selectedType && fields.length > 0 ? (
        <>
          <div className="mt-5 mb-3 h-px bg-border/50" />
          <div className={stepRow}>
            <StepChip n={2} done={verified} active={!verified} />
            <span className="text-[13px] font-bold">{t("accountInfo")}</span>
            {verified ? (
              <button
                type="button"
                onClick={handleEditAccount}
                className="ml-auto text-xs font-bold text-primary hover:underline"
              >
                {t("editAccount")}
              </button>
            ) : null}
          </div>
          <div className={`mt-3 pl-[32px] ${accountLocked ? "opacity-80" : ""}`}>
            <DynamicFields
              fields={fields}
              values={values}
              errors={errors}
              disabled={accountLocked}
              onChange={(name, value) => {
                setValues((prev) => ({ ...prev, [name]: value }));
                setVerifyState("idle");
                setVerifyMessage(null);
              }}
            />
            {verified ? null : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2.5 w-full"
                onClick={handleVerify}
                disabled={verifyState === "checking"}
              >
                {verifyState === "checking" ? t("verifying") : t("verify")}
              </Button>
            )}
            {verifyMessage ? (
              <p
                role="alert"
                className={`mt-1.5 text-xs ${verifyState === "ok" ? "text-status-success" : "text-destructive"}`}
              >
                {verifyState === "ok" ? "✓ " : ""}
                {verifyMessage}
              </p>
            ) : null}
          </div>
        </>
      ) : null}

      {/* ขั้น 3 · ชำระเงิน */}
      <div className="mt-5 mb-3 h-px bg-border/50" />
      <div className={stepRow}>
        <StepChip n={3} active={Boolean(selectedType)} />
        <span className="text-[13px] font-bold">{t("stepPay")}</span>
      </div>
      <div className="mt-3 pl-[32px]">
        {selectedType && qtyMax > 1 ? (
          <div className="mb-3">
            <Label htmlFor="qty" className="text-xs">{t("quantity")}</Label>
            <div className="mt-1 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQty((q) => Math.max(qtyMin, q - 1))}
              >
                −
              </Button>
              <span className="num w-10 text-center font-semibold">{qty}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQty((q) => Math.min(qtyMax, q + 1))}
              >
                +
              </Button>
            </div>
          </div>
        ) : null}

        {isAuthenticated && methods.data?.length ? (
          <div className="mb-3">
            <Label className="text-xs">{t("paymentMethod")}</Label>
            <Select value={selectedOption?.code ?? ""} onValueChange={setOptionCode}>
              <SelectTrigger className="mt-1 w-full">
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
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-border/50 pt-3">
          <span className="text-sm text-muted-foreground">{t("subtotal")}</span>
          <span className="num text-xl font-bold text-primary">{formatTHB(total)}</span>
        </div>

        <Button
          className="mt-3.5 w-full"
          size="lg"
          disabled={buyDisabled}
          onClick={handleBuy}
        >
          {buyLabel}
        </Button>
        {!isAuthenticated ? (
          <p className="mt-2 text-center text-xs text-muted-foreground">{ta("loginRequired")}</p>
        ) : null}
      </div>
    </aside>
  );
}
