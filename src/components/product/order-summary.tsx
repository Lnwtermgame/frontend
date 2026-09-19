"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, CircleAlert, CircleCheck, Info, Loader2, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { DynamicFields, validateRequired } from "./dynamic-fields";
import { usePaymentMethods } from "@/lib/query/hooks";
import { verifyPlayer, verifyMobileRecharge } from "@/lib/api/products";
import type { Product, ProductTypePublic, SeagmField } from "@/lib/api/products";
import { formatTHB, lineTotal } from "@/lib/pricing";
import { ApiError } from "@/lib/api/client";
import { resolveVerifyFailure, resolveVerifyOutcome } from "@/lib/verify-outcome";
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
      {done ? <Check className="size-3.5" aria-hidden /> : n}
    </span>
  );
}

/**
 * สรุปคำสั่งซื้อ — อ่านเป็น "ใบเสร็จ" ใบเดียว
 *
 * โครง: ขั้น 1 เลือกแพ็กเกจ → ขั้น 2 ระบุ/ตรวจสอบบัญชี → ขั้น 3 ชำระเงิน
 * เส้นนำสายตา 1px ต่อจากชิป 1 ถึงชิป 3 ให้สามขั้นอ่านเป็นไปป์ไลน์เดียว แล้วปิดท้าย
 * ด้วยส่วน "ยอด" ที่มีเส้นคั่นแบบใบเสร็จ + ตัวเลขยอดรวมที่ดังที่สุดในแผง
 *
 * มือถือ: แผงนี้อยู่ในลำดับ DOM หลังตารางแพ็กเกจ (สูงหลายพัน px) จึงเพิ่มแถบสรุป
 * ตรึงขอบล่างที่แสดงเมื่อเลือกแพ็กเกจแล้ว — ผู้ใช้จึงเห็นยอดและกดซื้อได้ทันทีโดยไม่ต้อง
 * เลื่อนผ่านแพ็กเกจทั้งหมด (และซ่อนปุ่ม CTA ในแผงบนมือถือเพื่อไม่ให้มีปุ่มซ้ำสองที่)
 */
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
  const [verifyState, setVerifyState] = useState<
    "idle" | "checking" | "ok" | "fail" | "skipped" | "unavailable"
  >("idle");
  const [revealVerify, setRevealVerify] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [optionCode, setOptionCode] = useState<string | null>(null);
  const accountRef = useRef<HTMLDivElement | null>(null);

  const methods = usePaymentMethods(isAuthenticated);
  const selectedOption = methods.data?.find((m) => m.code === optionCode) ?? methods.data?.[0];

  // reset per selected type
  useEffect(() => {
    setValues({});
    setErrors({});
    setVerifyState("idle");
    setVerifyMessage(null);
    setRevealVerify(false);
    setQty(selectedType ? Math.max(selectedType.minAmount, 1) : 1);
  }, [selectedType?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = selectedType ? lineTotal(selectedType.displayPrice, qty) : 0;
  const isMobileRecharge = product.productType === "MOBILE_RECHARGE";

  const verified = verifyState === "ok";
  // The backend only blocks an order when the provider answers "supported but
  // invalid". Mirror that here: an unavailable check must not gate the buy.
  const requiresVerifyInputs = Boolean(selectedType && fields.length > 0);
  const verifyUnavailable = verifyState === "unavailable";
  const accountLocked = verified; // ล็อกฟิลด์หลังตรวจสอบผ่าน กันแก้ไอดีพลาดโดยไม่รู้ตัว
  // ขั้นที่ 3 "เป็นงานปัจจุบัน" ก็ต่อเมื่อไม่มีอะไรต้องตรวจแล้ว (หรือไม่มีฟิลด์เลย เช่นบัตรเงิน)
  const payStepActive = !requiresVerifyInputs || verified;

  // ยังไม่ตรวจสอบ = ปุ่มซื้อเป็นขั้น "ไปตรวจสอบก่อน" (ไม่บล็อกการซื้อ)
  // ตรวจสอบไม่ได้ = เตือน แต่ยอมให้ซื้อ (backend ตรวจซ้ำตอนสร้างออเดอร์อยู่แล้ว)
  // ผู้ใช้ที่ยังไม่ล็อกอินให้ไปหน้า login ตรง ๆ — ตรวจสอบก่อนไม่มีประโยชน์ จึงไม่ขึ้นป้ายนี้
  const mustVerify = isAuthenticated && requiresVerifyInputs && !verified;
  const showBuyHint = mustVerify && !revealVerify;
  const handleBuyAttempt = () => {
    if (showBuyHint) {
      setRevealVerify(true);
      // เดิมกดแล้วปุ่มเปลี่ยนข้อความเฉย ๆ ไม่มีอะไรบอกว่าต้องไปกรอกอะไร —
      // เลื่อนไปหาฟิลด์บัญชีแล้วโฟกัสช่องแรกที่ยังว่าง
      const firstEmpty =
        fields.find((f) => f.required && !(values[f.name] ?? "").trim()) ?? fields[0];
      const target = firstEmpty ? document.getElementById(`field-${firstEmpty.name}`) : null;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() => {
        accountRef.current?.scrollIntoView({
          block: "center",
          behavior: reduceMotion ? "auto" : "smooth",
        });
        target?.focus({ preventScroll: true });
      });
      return;
    }
    handleBuy();
  };

  const handleVerify = async () => {
    if (!selectedType) return;
    const errs = validateRequired(fields, values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setVerifyState("checking");
    setVerifyMessage(null);
    try {
      const result = isMobileRecharge
        ? await verifyMobileRecharge(
            product.id,
            selectedType.id,
            values.phone ?? values.phoneNumber ?? "",
            undefined,
          )
        : await verifyPlayer(product.id, values, selectedType.id);
      const outcome = resolveVerifyOutcome(result);
      if (outcome.state === "ok") {
        setVerifyState("ok");
        setVerifyMessage(
          outcome.accountName
            ? t("verifiedAs", { name: outcome.accountName })
            : t("verified"),
        );
        return;
      }
      setVerifyState(outcome.state);
      // ผู้ให้บริการตอบแค่ "ไม่ผ่าน" ไม่ได้บอกว่าไอดีหรือโซนผิด — ช่องที่ยังว่างอยู่คือ
      // สาเหตุที่ตรวจได้ชัดเจนที่สุด จึงบอกเป็นรายช่องแทนข้อความรวมที่กดแก้ไม่ถูกจุด
      // (ไม่บล็อกการเรียกตรวจสอบ และไม่กระทบการซื้อ)
      const emptyFields = fields.filter((f) => !(values[f.name] ?? "").trim());
      if (outcome.state === "fail" && emptyFields.length) {
        setErrors(
          Object.fromEntries(emptyFields.map((f) => [f.name, t("fieldRequired", { field: f.label })])),
        );
        setVerifyMessage(null);
        return;
      }
      setVerifyMessage(t(outcome.messageKey));
    } catch (err) {
      // The request itself failed (network, server) — not the player's fault.
      const outcome = resolveVerifyFailure(
        err instanceof ApiError ? err.infoCode : undefined,
      );
      setVerifyState(outcome.state);
      setVerifyMessage(
        outcome.state === "ok" ? t("verified") : t(outcome.messageKey),
      );
    }
  };

  const handleEditAccount = () => {
    // ปลดล็อก = ต้องตรวจสอบใหม่เสมอ (กันแก้ไอดีแล้วลืมว่ายังไม่ได้เช็ค)
    setVerifyState("idle");
    setVerifyMessage(null);
    setRevealVerify(false);
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
  const buyDisabled = !selectedType || buying;
  const buyLabel = buying
    ? t("buying")
    : !selectedType
      ? t("pickFirst") // ปุ่มถูก disable เพราะยังไม่เลือกแพ็กเกจ — ต้องบอกเหตุ ไม่ใช่ "ซื้อเลย"
      : showBuyHint
        ? t("needVerify")
        : t("buy");

  const stepRow = "flex items-center gap-2.5";
  const stepBody = "pl-[32px]";
  const showLedger = Boolean(selectedType && qty > 1);
  const buyingSpinner = buying ? (
    <Loader2 className="size-4 animate-spin" aria-hidden />
  ) : null;

  return (
    <>
      <aside className="rounded-[14px] border bg-card p-4 shadow-(--shadow-tile) lg:sticky lg:top-20">
        {/* ── เส้นนำสายตา: ต่อจากปลายชิป 1 ถึงหัวชิป 3 ให้สามขั้นเป็นไปป์ไลน์เดียว ── */}
        <div className="relative">
          <span
            aria-hidden
            className="absolute top-[22px] bottom-[22px] left-[10.5px] w-px bg-border"
          />

          {/* ขั้น 1 · เลือกแพ็กเกจ */}
          <div className={stepRow}>
            <StepChip n={1} done={Boolean(selectedType)} />
            <span className="text-[13px] font-bold">{t("selectPackage")}</span>
          </div>
          <div className={`mt-2 ${stepBody}`}>
            {selectedType ? (
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0 flex-1 text-[12.5px] leading-snug font-medium">
                  {selectedType.name}
                  {qty > 1 ? <span className="num text-muted-foreground"> × {qty}</span> : null}
                </span>
                <span className="num shrink-0 text-[12.5px] font-bold text-primary">
                  {formatTHB(selectedType.displayPrice)}
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t("pickFromLeft")}</p>
            )}
          </div>

          {/* ขั้น 2 · ข้อมูลบัญชีเกม */}
          {requiresVerifyInputs ? (
            <>
              <div className={`${stepRow} mt-5`}>
                <StepChip n={2} done={verified} active={!verified} />
                <span className="text-[13px] font-bold">{t("accountInfo")}</span>
                {verified ? (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={handleEditAccount}
                    className="ml-auto min-h-11 -mr-1.5 px-2 lg:min-h-0"
                  >
                    {t("editAccount")}
                  </Button>
                ) : null}
              </div>
              <div
                ref={accountRef}
                className={`mt-3 ${stepBody} ${accountLocked ? "opacity-80" : ""}`}
              >
                {/* ยืนยันผ่านแล้ว = ข้อความยืนยันต้องอยู่บนสุดของขั้นนี้ (อ่านเจอทันที)
                    ไม่ใช่ต่อท้ายฟิลด์ที่เพิ่งปิดการแก้ไข */}
                {verified && verifyMessage ? (
                  <p
                    role="status"
                    className="mb-2.5 flex items-start gap-1.5 text-xs font-medium text-status-success animate-in fade-in-0 slide-in-from-top-1 duration-200"
                  >
                    <CircleCheck className="mt-px size-3.5 shrink-0" aria-hidden />
                    {verifyMessage}
                  </p>
                ) : null}
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
                    className="mt-2.5 h-11 w-full lg:h-7"
                    onClick={handleVerify}
                    disabled={verifyState === "checking"}
                    aria-busy={verifyState === "checking"}
                  >
                    {verifyState === "checking" ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                        {t("verifying")}
                      </>
                    ) : (
                      t("verify")
                    )}
                  </Button>
                )}
                {!verified && verifyMessage ? (
                  verifyState === "unavailable" ? (
                    <p
                      role="status"
                      className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground"
                    >
                      <Info className="mt-px size-3.5 shrink-0" aria-hidden />
                      {verifyMessage}
                    </p>
                  ) : (
                    <p
                      role="alert"
                      className="mt-2 flex items-start gap-1.5 text-xs text-destructive"
                    >
                      <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
                      {verifyMessage}
                    </p>
                  )
                ) : null}
              </div>
            </>
          ) : null}

          {/* ขั้น 3 · ชำระเงิน (หัวข้อปิดท้ายเส้นนำสายตา — เนื้อหาต่อด้านล่าง) */}
          <div className={`${stepRow} mt-5`}>
            <StepChip n={3} active={payStepActive} />
            <span className="text-[13px] font-bold">{t("stepPay")}</span>
          </div>
        </div>

        <div className={`mt-3 ${stepBody}`}>
          {selectedType && qtyMax > 1 ? (
            <div className="mb-3" role="group" aria-label={t("quantity")}>
              <span className="text-xs font-medium text-muted-foreground">{t("quantity")}</span>
              <div className="mt-1.5 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={t("qtyDecrease")}
                  className="size-11 lg:size-8"
                  onClick={() => setQty((q) => Math.max(qtyMin, q - 1))}
                  disabled={qty <= qtyMin}
                >
                  <Minus className="size-4" aria-hidden />
                </Button>
                <span className="num w-9 text-center text-sm font-bold" aria-live="polite">
                  {qty}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={t("qtyIncrease")}
                  className="size-11 lg:size-8"
                  onClick={() => setQty((q) => Math.min(qtyMax, q + 1))}
                  disabled={qty >= qtyMax}
                >
                  <Plus className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
          ) : null}

          {isAuthenticated ? (
            <div className="mb-3">
              <Label htmlFor="payment-method" className="text-xs">
                {t("paymentMethod")}
              </Label>
              {methods.isLoading ? (
                // skeleton กันแถวเลือกช่องทาง "เด้ง" เข้ามาหลังยอดรวม (layout shift ในแผงระดับจ่ายเงิน)
                <Skeleton className="mt-1.5 h-11 w-full rounded-lg lg:h-8" />
              ) : methods.isError ? (
                <p role="alert" className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-destructive">
                  {t("paymentMethodsError")}
                  <button
                    type="button"
                    onClick={() => void methods.refetch()}
                    className="font-semibold text-primary underline underline-offset-4"
                  >
                    {t("retry")}
                  </button>
                </p>
              ) : methods.data?.length ? (
                <Select value={selectedOption?.code ?? ""} onValueChange={setOptionCode}>
                  <SelectTrigger
                    id="payment-method"
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
        </div>

        {/* ── ส่วนยอด: เส้นคั่นแบบใบเสร็จ แล้วปิดด้วยตัวเลขที่ดังที่สุดในแผง ── */}
        <div className="mt-4 border-t border-border pt-3">
          {showLedger ? (
            <div className="flex items-center justify-between gap-3 text-[12.5px] text-muted-foreground">
              <span>{t("unitPrice")}</span>
              <span className="num">
                {formatTHB(selectedType!.displayPrice)} × {qty}
              </span>
            </div>
          ) : null}
          <div
            className={`flex items-baseline justify-between gap-3 ${showLedger ? "mt-2" : ""}`}
          >
            <span className="text-[13px] text-muted-foreground">{t("subtotal")}</span>
            <span className="num text-[22px] leading-none font-extrabold text-primary">
              {formatTHB(total)}
            </span>
          </div>

          <Button
            size="lg"
            className={`mt-3.5 h-12 w-full text-sm font-semibold lg:h-10 ${
              selectedType ? "hidden lg:inline-flex" : ""
            }`}
            disabled={buyDisabled}
            onClick={handleBuyAttempt}
            aria-busy={buying}
          >
            {buying ? (
              <>
                {buyingSpinner}
                {buyLabel}
              </>
            ) : (
              buyLabel
            )}
          </Button>

          {mustVerify && revealVerify ? (
            <p className="mt-2 text-center text-[11.5px] text-muted-foreground" role="status">
              {t("verifyPendingHint")}
            </p>
          ) : null}
          {verifyUnavailable && !verified ? (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {t("buyAnywayHint")}
            </p>
          ) : null}
          {!isAuthenticated ? (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {ta("loginRequired")}
            </p>
          ) : null}
        </div>
      </aside>

      {/* ── มือถือ: แถบสรุปตรึงขอบล่าง — ยอดกับปุ่มซื้อต้องเอื้อมถึงทันทีหลังเลือกแพ็กเกจ ── */}
      {selectedType ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] leading-tight text-muted-foreground">{t("subtotal")}</p>
              <p className="num text-lg leading-tight font-extrabold text-primary">
                {formatTHB(total)}
              </p>
            </div>
            <Button
              size="lg"
              className="h-12 shrink-0 px-4 text-sm font-semibold"
              disabled={buyDisabled}
              onClick={handleBuyAttempt}
              aria-busy={buying}
            >
              {buying ? (
                <>
                  {buyingSpinner}
                  {buyLabel}
                </>
              ) : (
                buyLabel
              )}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
