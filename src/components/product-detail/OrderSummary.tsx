"use client";

import { Minus, Plus, ShoppingCart, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { formatTHB } from "@/lib/format";
import type { SeagmField } from "@/lib/services/product-api";
import type { PriceSummary, TopUpOption } from "./types";

export function OrderSummary({ option, isAuthenticated, fieldValues, onFieldChange, translateLabel, isMobileRechargeRoute, mobilePhoneNumber, onMobilePhoneChange, quantity, onQuantityChange, priceSummary, isBuying, onBuy, onOpenPackages }: {
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
  onOpenPackages: () => void;
}) {
  const t = useTranslations("ProductDetail");

  return (
    <div className="site-card p-5 md:sticky md:top-20 space-y-5">
      <h3 className="text-base font-bold text-site-text uppercase">
        {t("purchase_summary")}
      </h3>

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

          {/* Mobile package trigger (visible only on small screens) */}
          <div className="md:hidden">
            <div
              onClick={onOpenPackages}
              className="bg-site-raised border border-site-border-soft p-3 flex items-center justify-between cursor-pointer rounded-6 transition-colors hover:border-site-border"
            >
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-medium text-site-dim uppercase block mb-0.5">
                  {t("selected_package_label")}
                </span>
                <h4 className="text-site-text font-bold text-sm leading-tight truncate">
                  {option.title || t("select_package")}
                </h4>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-site-text font-bold text-lg">
                  {formatTHB(Number(option.price || 0))}
                </span>
                <ChevronRight size={18} className="text-site-muted" />
              </div>
            </div>
          </div>

          {/* Mobile recharge phone input */}
          {isMobileRechargeRoute &&
            !(option.fields || []).some((field: SeagmField) =>
              /phone|user id/i.test(`${field.name} ${field.label}`),
            ) && (
              <Input
                label={t("mobile_number_label")}
                type="tel"
                value={mobilePhoneNumber}
                onChange={(e) => onMobilePhoneChange(e.target.value)}
                placeholder={t("mobile_number_placeholder")}
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
                          className="w-full"
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
                                {opt.label}
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
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Selected package summary */}
          <div className="flex justify-between items-start gap-4">
            <span className="text-site-muted flex-shrink-0 pt-0.5 font-medium text-sm">
              {t("selected_package_label")}
            </span>
            <div className="text-right min-w-0">
              <span className="text-site-text font-bold block leading-tight break-words text-sm">
                {option.title}
              </span>
            </div>
          </div>

          {/* Quantity stepper (SEAGM-style, capped 1..10) */}
          <div className="flex justify-between items-center">
            <span className="text-site-muted font-medium text-sm">
              {t("quantity_label")}
            </span>
            <div className="flex items-center border border-site-border-soft rounded-6 bg-site-bg">
              <button
                type="button"
                aria-label="-"
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="px-3 py-1.5 text-site-text hover:bg-site-raised disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-l-6"
              >
                <Minus size={14} aria-hidden="true" />
              </button>
              <span
                className="px-4 text-site-text font-semibold text-sm tabular-nums"
                aria-live="polite"
              >
                {quantity}
              </span>
              <button
                type="button"
                aria-label="+"
                onClick={() => onQuantityChange(Math.min(10, quantity + 1))}
                disabled={quantity >= 10}
                className="px-3 py-1.5 text-site-text hover:bg-site-raised disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-r-6"
              >
                <Plus size={14} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="py-3 border-y border-site-border-soft space-y-2">
            {/* Subtotal */}
            <div className="flex justify-between items-center">
              <span className="text-site-muted font-medium text-sm">
                {t("subtotal_label")}
              </span>
              <span className="text-site-text font-semibold text-sm tabular-nums">
                {formatTHB(priceSummary.subtotal)}
              </span>
            </div>

            {/* Fee (only when > 0) */}
            {priceSummary.fee > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-site-muted font-medium text-sm">
                  {t("fee_label")}
                </span>
                <span className="text-site-text font-semibold text-sm tabular-nums">
                  {formatTHB(priceSummary.fee)}
                </span>
              </div>
            )}

            {/* Original-price strikethrough + current price when discounted */}
            {option.originalPrice > option.price && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-site-muted font-medium text-sm">
                    {t("price_label")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="line-through text-site-dim text-xs">
                      {formatTHB(Number(option.originalPrice || 0) * quantity)}
                    </span>
                    <span className="text-site-text font-bold text-lg tabular-nums">
                      {formatTHB(Number(option.price || 0) * quantity)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-site-muted font-medium text-sm">
                    {t("savings_label")}
                  </span>
                  <span className="text-green-600 font-bold text-sm tabular-nums">
                    -{formatTHB(
                      (Number(option.originalPrice || 0) -
                        Number(option.price || 0)) *
                        quantity,
                    )}
                  </span>
                </div>
              </>
            )}

            {/* Total */}
            <div className="flex justify-between items-center pt-1">
              <span className="text-site-text font-bold text-sm">
                {t("total_label")}
              </span>
              <span className="text-site-accent font-bold text-xl tabular-nums">
                {formatTHB(priceSummary.total)}
              </span>
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={onBuy}
            disabled={isBuying}
            isLoading={isBuying}
            fullWidth
            className="font-bold"
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

          {/* Auto-delivery hint */}
          <div className="bg-site-accent/5 border border-site-accent/20 p-3 text-sm rounded-6">
            <div className="flex items-center">
              <Clock
                size={16}
                className="text-site-accent mr-2 flex-shrink-0"
              />
              <span className="text-site-accent/90 font-medium">
                {t("auto_delivery_hint")}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
