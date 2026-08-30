"use client";

import Link from "next/link";
import { Check, ShieldAlert, AlertCircle, Package, User, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatTHB } from "@/lib/format";
import type { PriceSummary, VerificationStatus } from "./types";

export function ConfirmOrderDialog({ open, onClose, verificationStatus, priceSummary, termsAccepted, onTermsChange, isBuying, onConfirm, onChangePayment }: {
  open: boolean;
  onClose: () => void;
  verificationStatus: VerificationStatus | null;
  priceSummary: PriceSummary;
  termsAccepted: boolean;
  onTermsChange: (accepted: boolean) => void;
  isBuying: boolean;
  onConfirm: () => void;
  onChangePayment: () => void;
}) {
  const t = useTranslations("ProductDetail");

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        className="bg-site-surface border-site-border max-w-4xl gap-0 overflow-hidden p-0 rounded-8 sm:rounded-8 flex flex-col max-h-[95vh] sm:max-h-[90vh]"
      >
        {verificationStatus && (
          <>
            <div
              className={`border-b border-site-border p-3 sm:p-4 flex items-center justify-between flex-shrink-0 ${!verificationStatus.supported ? "bg-status-danger/10" : "bg-site-accent/10"}`}
            >
              <div className="flex items-center gap-2">
                {!verificationStatus.supported ? (
                  <ShieldAlert size={22} className="text-status-danger" />
                ) : (
                  <Check size={22} className="text-site-accent" />
                )}
                <DialogTitle className="text-base sm:text-lg font-bold text-site-text uppercase">
                  {!verificationStatus.supported
                    ? t("unverified_account_warning")
                    : t("confirm_order_title")}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {t("confirm_order_title")}
                </DialogDescription>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!verificationStatus.supported && (
                <div className="bg-status-danger/10 border-b border-status-danger/30 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle
                      size={18}
                      className="text-status-danger mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-status-danger text-sm">
                        {t("unverified_account_warning")}
                      </p>
                      <p className="text-xs text-status-danger/80 mt-0.5 font-medium">
                        {t("verify_info_hint")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Left column: product details + account info + refund warning */}
                <div className="p-4 sm:p-5 space-y-4 border-b lg:border-b-0 lg:border-r border-site-border">
                  <div className="bg-site-raised border border-site-border-soft p-3 sm:p-4 rounded-8">
                    <h3 className="font-bold text-site-text text-sm mb-3 flex items-center gap-1.5 uppercase">
                      <Package size={16} className="text-site-accent" />
                      {t("product_details_title")}
                    </h3>
                    <div className="space-y-2 text-sm font-medium tabular-nums">
                      <div className="flex justify-between items-center">
                        <span className="text-site-muted">{t("product_label")}</span>
                        <span className="text-site-text text-right max-w-[60%]">
                          {verificationStatus.productName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-site-muted">{t("package_label")}</span>
                        <span className="text-site-text">
                          {verificationStatus.optionName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {Object.keys(verificationStatus.playerInfo).length > 0 && (
                    <div className="bg-site-raised border border-site-border-soft p-3 sm:p-4 rounded-8">
                      <h3 className="font-bold text-site-text text-sm mb-2 flex items-center gap-1.5 uppercase">
                        <User size={16} className="text-site-accent" />
                        {t("account_info_title")}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(verificationStatus.playerInfo).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="bg-site-deep p-2 border border-site-border-soft rounded-6"
                            >
                              <span className="text-[10px] text-site-dim block uppercase font-semibold">
                                {key}
                              </span>
                              <span className="font-mono font-bold text-site-text text-sm truncate block mt-0.5">
                                {value}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-status-danger/10 border border-status-danger/30 p-3 rounded-8">
                    <div className="flex items-start gap-2">
                      <AlertCircle
                        size={16}
                        className="text-status-danger mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <p className="font-bold text-status-danger text-xs">
                          {t("no_refund_warning_title")}
                        </p>
                        <p className="text-xs text-status-danger/80 mt-0.5 leading-relaxed font-medium">
                          {t("no_refund_warning_desc")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column: payment + totals + terms + actions */}
                <div className="p-4 sm:p-5 space-y-4 bg-site-raised">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-site-muted font-bold uppercase">
                      {t("payment_method_label")}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-site-text text-sm">
                        {priceSummary.label || t("select_method")}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onChangePayment}
                        className="text-[10px] py-1 px-2 h-auto font-semibold uppercase"
                      >
                        {t("change_button")}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-site-surface border border-site-border-soft p-4 rounded-8">
                    <div className="space-y-2 text-sm font-medium tabular-nums">
                      <div className="flex justify-between text-site-muted">
                        <span>{t("subtotal_label")}</span>
                        <span className="text-site-text">
                          {formatTHB(priceSummary.subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-site-muted">
                        <span>{t("fee_label")}</span>
                        <span className="text-site-text">
                          +{formatTHB(priceSummary.fee)}
                        </span>
                      </div>
                      <div className="border-t border-site-border-soft pt-2 mt-2">
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-site-text">
                            {t("total_label")}
                          </span>
                          <span className="text-2xl sm:text-3xl font-extrabold text-site-accent">
                            {formatTHB(priceSummary.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-status-info/10 border border-status-info/30 p-2.5 text-[10px] text-status-info flex items-start gap-2 font-medium uppercase rounded-8">
                    <ShieldCheck size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{t("secure_payment_notice")}</span>
                  </div>

                  <div className="pt-4 border-t border-site-border-soft">
                    <div className="mb-4">
                      <div className="flex items-start gap-2 group">
                        <Checkbox
                          id="terms-agreement"
                          checked={termsAccepted}
                          onCheckedChange={(v) => onTermsChange(v === true)}
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor="terms-agreement"
                          className="text-[10px] font-medium text-site-muted leading-tight cursor-pointer"
                        >
                          <span className="block group-hover:text-site-text transition-colors">
                            {t("terms_agreement_prefix")}{" "}
                            <Link
                              href="/terms"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-site-accent hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {t("terms_label")}
                            </Link>
                            ,{" "}
                            <Link
                              href="/privacy"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-site-accent hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {t("privacy_label")}
                            </Link>{" "}
                            <span className="text-site-dim">&middot;</span>{" "}
                            <Link
                              href="/refund-policy"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-site-accent hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {t("refund_label")}
                            </Link>
                          </span>
                        </Label>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={onConfirm}
                        disabled={isBuying || !termsAccepted}
                        isLoading={isBuying}
                        className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-bold uppercase"
                      >
                        {!isBuying && <Check size={20} className="mr-2" />}
                        {t("confirm_button")}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isBuying}
                        className="sm:w-auto w-full h-12 sm:h-14 px-6 sm:px-8 font-bold uppercase"
                      >
                        {t("cancel_button")}
                      </Button>
                    </div>

                    <p className="text-center text-[10px] text-site-dim mt-3 font-medium uppercase">
                      {t("confirm_hint")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
