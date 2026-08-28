"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Zap } from "lucide-react";
import { FormModal } from "@/components/admin";
import type { AdminProduct, AdminProductType } from "@/lib/services/product-api";

interface PriceEditModalProps {
  open: boolean;
  onClose: () => void;
  product: AdminProduct | null;
  types: AdminProductType[];
  /**
   * Persist the edited prices. Return true on success so the modal can close;
   * return false (or throw) to keep the modal open.
   */
  onSave: (prices: Record<string, string>) => Promise<boolean>;
  loading?: boolean;
}

const PRICING_OPTIONS = [
  { key: "mid", label: "ราคากลาง", description: "ระหว่างต้นทุน-SEAGM" },
  { key: "nearSeagm", label: "ใกล้เคียง SEAGM", description: "ลด 3% จาก SEAGM" },
  { key: "smallProfit", label: "กำไรบาง", description: "บวก 5% จากต้นทุน" },
  { key: "seagm", label: "ราคา SEAGM", description: "เท่ากับ SEAGM" },
];

const calculateProfitPercent = (
  originPrice?: number,
  sellingPrice?: number,
) => {
  if (!originPrice || !sellingPrice || originPrice === 0) return 0;
  return ((sellingPrice - originPrice) / originPrice) * 100;
};

export function PriceEditModal({
  open,
  onClose,
  product,
  types,
  onSave,
  loading = false,
}: PriceEditModalProps) {
  const [sellingPrices, setSellingPrices] = useState<Record<string, string>>(
    {},
  );
  const [selectedPricingOption, setSelectedPricingOption] = useState<
    string | null
  >(null);

  // Sync local prices whenever the modal opens or the product/types change.
  useEffect(() => {
    if (!open || !product) return;
    const prices: Record<string, string> = {};
    types.forEach((type) => {
      const defaultPrice =
        type.sellingPrice || type.originPrice || type.unitPrice;
      prices[type.id] = defaultPrice.toString();
    });
    const id = requestAnimationFrame(() => {
      setSellingPrices(prices);
      setSelectedPricingOption(null);
    });
    return () => cancelAnimationFrame(id);
  }, [open, product, types]);

  const handlePriceChange = (typeId: string, value: string) => {
    setSellingPrices((prev) => ({ ...prev, [typeId]: value }));
  };

  const applyPricingOption = (optionKey: string) => {
    setSelectedPricingOption(optionKey);
    const newPrices: Record<string, string> = {};

    types.forEach((type) => {
      const originPrice = type.originPrice
        ? parseFloat(type.originPrice as any)
        : 0;
      const unitPrice = type.unitPrice ? parseFloat(type.unitPrice as any) : 0;
      const costPrice = unitPrice;
      const seagmPrice = originPrice || unitPrice;

      let calculatedPrice = seagmPrice;

      switch (optionKey) {
        case "mid":
          calculatedPrice = (costPrice + seagmPrice) / 2;
          break;
        case "nearSeagm":
          calculatedPrice = seagmPrice * 0.97;
          break;
        case "smallProfit":
          calculatedPrice = costPrice * 1.05;
          break;
        case "seagm":
          calculatedPrice = seagmPrice;
          break;
        default:
          calculatedPrice = seagmPrice;
      }

      if (optionKey !== "nearSeagm" && calculatedPrice < costPrice) {
        calculatedPrice = costPrice * 1.02;
      }

      newPrices[type.id] = calculatedPrice.toFixed(2);
    });

    setSellingPrices(newPrices);
  };

  const handleSubmit = async () => {
    const ok = await onSave(sellingPrices);
    if (ok) {
      setSelectedPricingOption(null);
      setSellingPrices({});
    }
  };

  return (
    <FormModal
      open={open && !!product}
      onClose={onClose}
      title={`จัดการราคาขาย${product ? `: ${product.name}` : ""}`}
      onSubmit={handleSubmit}
      submitLabel="บันทึกราคา"
      cancelLabel="ยกเลิก"
      loading={loading}
      size="lg"
    >
      {types.length > 0 ? (
        <div className="space-y-5">
          {/* Fast Pricing Options */}
          <div className="bg-site-surface border border-site-border-soft rounded-xl p-4 mb-2">
            <h4 className="text-[12px] font-bold text-site-text tracking-widest uppercase mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-site-accent" />
              เครื่องมือตั้งราคาด่วน
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PRICING_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => applyPricingOption(option.key)}
                  className={`p-3.5 border rounded-xl text-left transition-all ${
                    selectedPricingOption === option.key
                      ? "bg-site-accent/10 text-site-accent border-site-accent/30"
                      : "bg-site-raised text-site-muted border-site-border hover:border-site-border hover:bg-site-raised"
                  }`}
                >
                  <div className="font-bold text-[13px] tracking-wide">
                    {option.label}
                  </div>
                  <div
                    className={`text-[11px] mt-1 line-clamp-1 ${
                      selectedPricingOption === option.key
                        ? "text-site-accent/70"
                        : "text-site-dim"
                    }`}
                  >
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
            {selectedPricingOption && (
              <div className="mt-4 text-[11px] text-site-dim bg-site-raised p-3 rounded-lg border border-site-border-soft flex items-start gap-2">
                <span className="text-site-accent shrink-0">💡</span>
                <p>
                  ราคาจะถูกคำนวณใหม่ทั้งหมดตามตัวเลือกที่เลือก
                  คุณสามารถปรับแต่งราคาแต่ละรายการได้อย่างอิสระตามตารางถัดไป
                </p>
              </div>
            )}
          </div>

          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 text-[11px] font-bold text-site-dim uppercase tracking-wider border-b border-site-border-soft pb-3 px-2">
            <div className="col-span-3">ประเภทบริการ</div>
            <div className="col-span-2 text-right">ต้นทุนจริง</div>
            <div className="col-span-2 text-right">ราคาหน้าร้านต้นทาง</div>
            <div className="col-span-2 text-right text-site-accent">
              กำหนดราคาขาย
            </div>
            <div className="col-span-2 text-right">เปอร์เซ็นต์กำไร</div>
            <div className="col-span-1"></div>
          </div>

          {/* Type Rows */}
          <div className="space-y-1">
            {types.map((type) => {
              const originPrice = type.originPrice
                ? parseFloat(type.originPrice as any)
                : 0;
              const unitPrice = type.unitPrice
                ? parseFloat(type.unitPrice as any)
                : 0;
              const costPrice = unitPrice;
              const seagmPrice = originPrice || unitPrice;
              const sellingPrice =
                parseFloat(sellingPrices[type.id] || "0") || costPrice;
              const profitPercent = calculateProfitPercent(
                costPrice,
                sellingPrice,
              );

              return (
                <div
                  key={type.id}
                  className="grid grid-cols-12 gap-4 items-center py-3 px-2 border-b border-site-border-soft hover:bg-site-raised/50 transition-colors rounded-lg group"
                >
                  <div className="col-span-3">
                    <div className="font-bold text-[13px] text-site-text truncate pr-2">
                      {type.name}
                    </div>
                    <div className="text-[11px] text-site-dim font-mono mt-0.5">
                      {type.parValue} {type.parValueCurrency}
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-[13px] font-mono text-site-dim group-hover:text-site-text transition-colors">
                      {costPrice > 0 ? `฿ ${costPrice.toFixed(2)}` : "-"}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-[13px] font-mono text-site-dim group-hover:text-site-text transition-colors">
                      ฿ {seagmPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="col-span-2 relative">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-site-accent/50 text-[13px] font-mono font-bold">
                        ฿
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={sellingPrices[type.id] || ""}
                        onChange={(e) =>
                          handlePriceChange(type.id, e.target.value)
                        }
                        className="w-full text-right bg-site-raised border border-site-border rounded-lg pl-8 pr-3 py-2 text-[13px] font-bold text-site-text focus:border-site-accent/60 focus:ring-1 focus:ring-site-accent/50 outline-none transition-all placeholder:text-site-dim"
                        placeholder={seagmPrice.toString()}
                      />
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <span
                      className={`text-[13px] font-bold tracking-wide ${
                        profitPercent > 0
                          ? "text-site-accent"
                          : profitPercent < 0
                            ? "text-semantic-rose"
                            : "text-site-dim"
                      }`}
                    >
                      {profitPercent > 0 ? "+" : ""}
                      {profitPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <TrendingUp
                      className={`h-4 w-4 ${
                        profitPercent > 0
                          ? "text-site-accent"
                          : profitPercent < 0
                            ? "text-semantic-rose"
                            : "text-site-dim"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <DollarSign className="w-12 h-12 text-site-dim mx-auto mb-4 opacity-50" />
          <p className="text-[14px] font-medium text-site-muted">
            ไม่พบข้อมูลประเภทสินค้า (SEAGM Types) สำหรับสินค้านี้
          </p>
        </div>
      )}
    </FormModal>
  );
}
