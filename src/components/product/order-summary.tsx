"use client";

import { useEffect, useMemo, useState } from "react";
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
    if (selectedType.fields?.length) return selectedType.fields;
    return [];
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

  return (
    <aside className="sticky top-20 rounded-[14px] border bg-card p-4 shadow-(--shadow-tile)">
      <h2 className="text-base font-bold">{selectedType?.name ?? product.name}</h2>

      {selectedType && fields.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold">{t("accountInfo")}</p>
          <DynamicFields
            fields={fields}
            values={values}
            errors={errors}
            onChange={(name, value) => {
              setValues((prev) => ({ ...prev, [name]: value }));
              setVerifyState("idle");
              setVerifyMessage(null);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            onClick={handleVerify}
            disabled={verifyState === "checking"}
          >
            {verifyState === "checking" ? t("verifying") : t("verify")}
          </Button>
          {verifyMessage ? (
            <p
              role="alert"
              className={`mt-1.5 text-xs ${verifyState === "ok" ? "text-status-success" : "text-destructive"}`}
            >
              {verifyMessage}
            </p>
          ) : null}
        </div>
      ) : null}

      {selectedType && qtyMax > 1 ? (
        <div className="mt-4">
          <Label htmlFor="qty">{t("quantity")}</Label>
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
        <div className="mt-4">
          <Label>{t("paymentMethod")}</Label>
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

      <div className="mt-4 flex items-center justify-between border-t pt-3">
        <span className="text-sm text-muted-foreground">{t("subtotal")}</span>
        <span className="num text-xl font-bold text-primary">{formatTHB(total)}</span>
      </div>

      <Button
        className="mt-4 w-full"
        size="lg"
        disabled={!selectedType || buying}
        onClick={handleBuy}
      >
        {buying ? t("buying") : t("buy")}
      </Button>
      {!isAuthenticated ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">{ta("loginRequired")}</p>
      ) : null}
    </aside>
  );
}
