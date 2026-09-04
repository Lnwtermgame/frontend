"use client";

import { Minus, Plus, ShoppingCart, AlertTriangle, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CountryFlag, getCountryFlagCode } from "@/components/ui/country-flag";

import { formatTHB } from "@/lib/format";
import type { SeagmField } from "@/lib/services/product-api";
import type { PriceSummary, TopUpOption } from "./types";

// Refined input treatment — tactile inner depth, crisp hairline border, and clear focus state.
const filledInput =
  "bg-[#11141a] border border-white/10 rounded-10 text-site-text placeholder:text-site-dim hover:border-white/20 focus-visible:border-site-accent focus-visible:ring-1 focus-visible:ring-site-accent/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)] transition-all";

export interface OrderSummaryProps {
  option: TopUpOption | null;
  isAuthenticated: boolean;
  fieldValues: Record<string, string>;
  onFieldChange: (name: string, value: string) => void;
  translateLabel: (label: string) => string;
  isMobileRechargeRoute: boolean;
  mobilePhoneNumber: string;
  onMobilePhoneChange: (value: string) => void;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  priceSummary: PriceSummary;
  isBuying: boolean;
  onBuy: () => void;
}

export function OrderSummary({ option, isAuthenticated, fieldValues, onFieldChange, translateLabel, isMobileRechargeRoute, mobilePhoneNumber, onMobilePhoneChange, quantity, onQuantityChange, priceSummary, isBuying, onBuy }: OrderSummaryProps) {
  const t = useTranslations("ProductDetail");

  const showPhoneInput =
    isMobileRechargeRoute &&
    !(option?.fields || []).some((field: SeagmField) =>
      /phone|user id/i.test(`${field.name} ${field.label}`),
    );

  return (
    <div className="site-card p-5 md:sticky md:top-20 space-y-4">
      {/* Header + instant-delivery pill */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-site-text uppercase">
          {t("purchase_summary")}
        </h3>
        <span className="inline-flex items-center gap-1.5 flex-shrink-0 text-[11px] font-semibold text-status-success bg-status-success/10 border border-status-success/25 rounded-full px-2.5 py-1">
          <Zap size={11} aria-hidden="true" />
          {t("auto_delivery_short")}
        </span>
      </div>

      {/* No option selected – muted hint */}
      {!option && (
        <p className="text-site-muted text-sm">{t("select_package")}</p>
      )}

      {option && (
        <div className="space-y-4">
          {/* Guest login notice */}
          {!isAuthenticated && (
            <div className="bg-status-warning/15 border border-status-warning/30 p-3 text-sm flex items-center gap-2 rounded-6">
              <AlertTriangle
                size={16}
                className="text-status-warning flex-shrink-0"
              />
              <span className="text-status-warning font-medium">
                {t("login_required_notice")}
              </span>
            </div>
          )}

          {/* Mobile recharge phone input */}
          {showPhoneInput && (
            <Input
              label={t("mobile_number_label")}
              type="tel"
              value={mobilePhoneNumber}
              onChange={(e) => onMobilePhoneChange(e.target.value)}
              placeholder={t("mobile_number_placeholder")}
              className={filledInput}
            />
          )}

          {/* Dynamic fields from option.fields */}
          {option.fields && option.fields.length > 0 && (
            <div className="space-y-3">
              {option.fields.map((field: SeagmField) => (
                <div key={field.name}>
                  {field.type === "select" ? (
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium text-site-text block">
                        <span className="font-bold">
                          {translateLabel(field.label)}{" "}
                          {field.required && (
                            <span className="text-status-danger">*</span>
                          )}
                        </span>
                      </div>
                      <Select
                        value={fieldValues[field.name] || ""}
                        onValueChange={(value) =>
                          onFieldChange(field.name, value)
                        }
                      >
                        <SelectTrigger
                          className={`w-full h-11 ${filledInput}`}
                          aria-label={translateLabel(field.label)}
                        >
                          <SelectValue
                            placeholder={t("choose_placeholder", {
                              field: translateLabel(field.label),
                            })}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options
                            ?.filter((opt) => opt.value !== "")
                            .map((opt) => (
                              <SelectItem
                                key={opt.value}
                                value={opt.value}
                              >
                                <span className="inline-flex items-center gap-2">
                                  {/* Region flag; falls back to the globe icon for
                                      names without a country (Asia, NA/EU, Global) */}
                                  <CountryFlag
                                    code={getCountryFlagCode(opt.label)}
                                    size="S"
                                  />
                                  {opt.label}
                                </span>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <Input
                      label={`${translateLabel(field.label)} ${field.required ? "*" : ""}`}
                      type="text"
                      value={fieldValues[field.name] || ""}
                      onChange={(e) =>
                        onFieldChange(field.name, e.target.value)
                      }
                      placeholder={
                        field.placeholder ||
                        t("enter_placeholder", {
                          field: translateLabel(field.label),
                        })
                      }
                      className={filledInput}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── receipt lines ── */}
          <div className="border-t border-dashed border-site-border" />

          <div className="flex justify-between items-center gap-4">
            <span className="text-site-muted font-medium text-sm flex-shrink-0">
              {t("selected_package_label")}
            </span>
            <span className="text-site-text font-semibold text-sm text-right min-w-0 truncate">
              {option.title}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-site-muted font-medium text-sm">
              {t("quantity_label")}
            </span>
            <div className="flex items-center bg-site-deep border border-site-border-soft rounded-full">
              <button
                type="button"
                aria-label="-"
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-7 h-7 flex items-center justify-center text-site-text hover:bg-site-raised disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-full"
              >
                <Minus size={13} aria-hidden="true" />
              </button>
              <span
                className="min-w-[30px] text-center text-site-text font-semibold text-sm tabular-nums"
                aria-live="polite"
              >
                {quantity}
              </span>
              <button
                type="button"
                aria-label="+"
                onClick={() => onQuantityChange(Math.min(10, quantity + 1))}
                disabled={quantity >= 10}
                className="w-7 h-7 flex items-center justify-center text-site-text hover:bg-site-raised disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-full"
              >
                <Plus size={13} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="border-t border-dashed border-site-border" />

          {/* Tinted total */}
          <div className="bg-site-accent/10 border border-site-accent/20 rounded-10 p-3.5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-site-muted font-medium text-[13px]">
                {t("subtotal_label")}
              </span>
              <span className="text-site-text font-semibold text-[13px] tabular-nums">
                {formatTHB(priceSummary.subtotal)}
              </span>
            </div>

            {priceSummary.fee > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-site-muted font-medium text-[13px]">
                  {t("fee_label")}
                </span>
                <span className="text-site-text font-semibold text-[13px] tabular-nums">
                  {formatTHB(priceSummary.fee)}
                </span>
              </div>
            )}

            {option.originalPrice > option.price && (
              <div className="flex justify-between items-center">
                <span className="text-site-muted font-medium text-[13px]">
                  {t("savings_label")}
                </span>
                <span className="text-status-success font-bold text-[13px] tabular-nums">
                  -{formatTHB(
                    (Number(option.originalPrice || 0) -
                      Number(option.price || 0)) *
                      quantity,
                  )}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-1">
              <span className="text-site-text font-bold text-sm">
                {t("total_label")}
              </span>
              <span className="text-site-accent font-bold text-xl tabular-nums">
                {formatTHB(priceSummary.total)}
              </span>
            </div>
          </div>

          {/* CTA — Beveled Hardware Key (Arcade Switch) */}
          <Button
            onClick={onBuy}
            disabled={isBuying}
            isLoading={isBuying}
            fullWidth
            variant="arcade"
            className="font-extrabold h-[46px] rounded-10 text-[14.5px] shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
          >
            {!isBuying && (
              <>
                <ShoppingCart
                  size={18}
                  className="mr-2"
                  aria-hidden="true"
                />
                {isAuthenticated
                  ? t("buy_now_button")
                  : t("login_to_buy_button")}
              </>
            )}
          </Button>

          <p className="text-center text-[11px] text-site-dim font-medium">
            {t("auto_delivery_hint")}
          </p>
        </div>
      )}
    </div>
  );
}
