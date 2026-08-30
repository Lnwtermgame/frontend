"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatTHB } from "@/lib/format";
import type { PaymentMethodOption } from "@/lib/services/payment-api";
import type { PriceSummary } from "./types";

export function PaymentMethodDialog({
  open,
  onOpenChange,
  options,
  selectedCode,
  onSelect,
  priceSummary,
  productTitle,
  optionTitle,
  isMethodAvailable,
  unavailableReason,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: PaymentMethodOption[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
  priceSummary: PriceSummary;
  productTitle: string;
  optionTitle: string;
  isMethodAvailable: (method: string, totalAmount: number) => boolean;
  unavailableReason: (method: string, totalAmount: number) => string | null;
  onConfirm: () => void;
}) {
  const t = useTranslations("ProductDetail");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-site-surface border-site-border max-w-5xl gap-0 p-4 sm:p-6 rounded-8 sm:rounded-8">
        <div className="flex justify-between items-start gap-3 mb-5">
          <div>
            <DialogTitle className="text-2xl font-bold text-site-text uppercase">
              {t("payment_selection_title")}
            </DialogTitle>
            <DialogDescription className="text-sm text-site-muted mt-1 font-medium">
              {t("payment_selection_desc")}
            </DialogDescription>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
          {/* Left grid: payment method cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[58vh] overflow-y-auto pr-1">
            {options.map((opt) => {
              const isActive = selectedCode === opt.code;
              const totalAmount = priceSummary.total;
              const isAvailable = isMethodAvailable(opt.method, totalAmount);
              const reason = unavailableReason(opt.method, totalAmount);

              return (
                <label
                  key={opt.code}
                  className={`border p-4 flex flex-col gap-3 transition-colors rounded-8 ${
                    isActive
                      ? "bg-site-accent/10 border-site-accent"
                      : "bg-site-surface border-site-border-soft hover:border-site-border"
                  } ${
                    !isAvailable
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                  onClick={() => {
                    if (isAvailable) {
                      onSelect(opt.code);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="paymentOptionModal"
                        value={opt.code}
                        checked={isActive}
                        onChange={() =>
                          isAvailable && onSelect(opt.code)
                        }
                        disabled={!isAvailable}
                        className="mt-1 accent-site-accent disabled:cursor-not-allowed bg-site-deep border-site-border"
                      />
                      <div>
                        <div className="text-site-text font-bold text-base flex items-center gap-2">
                          {opt.label}
                          {!isAvailable && opt.minAmount != null && (
                            <Badge variant="danger" className="text-[10px]">
                              {t("min_amount_badge", {
                                amount: opt.minAmount,
                              })}
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-site-muted mt-1 font-medium">
                          {t("gateway_label", { name: opt.gateway.name })}
                        </div>
                        {reason && (
                          <div className="text-[10px] text-status-danger mt-1 font-medium">
                            {reason}
                          </div>
                        )}
                      </div>
                    </div>
                    {isActive && isAvailable && (
                      <Check size={16} className="text-site-accent" />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] uppercase border border-site-border-soft px-2 py-0.5 bg-site-deep text-site-muted font-bold rounded-4 ${
                        !isAvailable ? "opacity-50" : ""
                      }`}
                    >
                      {opt.method}
                    </span>
                  </div>

                  <div className="border-t border-site-border-soft pt-2 text-[10px] text-site-muted space-y-1 font-medium">
                    <div className="flex justify-between">
                      <span>{t("fee_percent_label")}</span>
                      <span className="text-site-text">
                        {Number(opt.surchargePercent || 0).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("flat_fee_label")}</span>
                      <span className="text-site-text">
                        {formatTHB(Number(opt.flatFee || 0))}
                      </span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Right summary column */}
          <div className="border border-site-border-soft p-4 bg-site-raised rounded-8 h-fit space-y-4">
            <h4 className="text-lg font-bold text-site-text uppercase">
              {t("transaction_summary_title")}
            </h4>

            <div className="space-y-2 text-sm font-medium tabular-nums">
              <div className="flex justify-between text-site-muted">
                <span>{t("product_label")}</span>
                <span className="text-site-text max-w-[55%] text-right truncate">
                  {productTitle || "-"}
                </span>
              </div>
              <div className="flex justify-between text-site-muted">
                <span>{t("package_label")}</span>
                <span className="text-site-text max-w-[55%] text-right truncate">
                  {optionTitle || "-"}
                </span>
              </div>
              <div className="flex justify-between text-site-muted">
                <span>{t("subtotal_label")}</span>
                <span className="text-site-text">
                  {formatTHB(priceSummary.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-site-muted">
                <span>{t("fee_label")}</span>
                <span className="text-site-text">
                  {formatTHB(priceSummary.fee)}
                </span>
              </div>
            </div>

            <div className="border-t border-site-border-soft pt-3 flex justify-between items-end font-bold">
              <span className="text-sm text-site-muted uppercase">
                {t("total_label")}
              </span>
              <span className="text-2xl font-extrabold text-site-accent">
                {formatTHB(priceSummary.total)}
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Button
                onClick={onConfirm}
                disabled={!selectedCode}
                fullWidth
                className="font-bold uppercase"
              >
                {t("confirm_selection_button")}
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                fullWidth
                className="font-bold uppercase"
              >
                {t("close_window_button")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
