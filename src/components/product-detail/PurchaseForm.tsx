"use client";

import { useTranslations } from "next-intl";
import { DollarSign } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SeagmField } from "@/lib/services/product-api";
import { PackageSelector } from "./PackageSelector";
import type { TopUpOption } from "./types";

export interface PurchaseFormProps {
  option: TopUpOption | null;
  options: TopUpOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  fieldValues: Record<string, string>;
  onFieldChange: (name: string, value: string) => void;
  translateLabel: (label: string) => string;
  isMobileRechargeRoute: boolean;
  mobilePhoneNumber: string;
  onMobilePhoneChange: (value: string) => void;
}

// SEAGM-style purchase flow (left column): pick a package first, then fill in
// the player information required by the selected package.
export function PurchaseForm({
  option,
  options,
  selectedId,
  onSelect,
  fieldValues,
  onFieldChange,
  translateLabel,
  isMobileRechargeRoute,
  mobilePhoneNumber,
  onMobilePhoneChange,
}: PurchaseFormProps) {
  const t = useTranslations("ProductDetail");

  const showPhoneInput =
    isMobileRechargeRoute &&
    !(option?.fields || []).some((field: SeagmField) =>
      /phone|user id/i.test(`${field.name} ${field.label}`),
    );

  return (
    <div className="site-card p-5 md:p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm font-bold text-site-text uppercase tracking-wide">
        <DollarSign size={16} className="text-site-accent" aria-hidden="true" />
        {t("topup_options")}
      </div>

      {/* Package grid — inline on every breakpoint */}
      <PackageSelector
        options={options}
        selectedId={selectedId}
        onSelect={onSelect}
      />

      {/* Player information for the selected package */}
      {(showPhoneInput || (option?.fields?.length ?? 0) > 0) && (
        <div className="space-y-4 pt-5 border-t border-site-border-soft">
          {showPhoneInput && (
            <Input
              label={t("mobile_number_label")}
              type="tel"
              value={mobilePhoneNumber}
              onChange={(e) => onMobilePhoneChange(e.target.value)}
              placeholder={t("mobile_number_placeholder")}
            />
          )}

          {option?.fields?.map((field: SeagmField) => (
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
    </div>
  );
}
