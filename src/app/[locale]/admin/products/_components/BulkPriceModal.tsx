"use client";

import { useEffect, useState } from "react";
import {
  Bookmark,
  DollarSign,
  Eye,
  Save,
  X,
} from "lucide-react";
import { FormModal } from "@/components/admin";

export interface BulkPricingPreset {
  name: string;
  percent: number;
  strategy: string;
}

export interface BulkPricingSample {
  name: string;
  typeName: string;
  cost: number;
  seagm: number;
}

interface BulkPriceModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Apply the chosen strategy/percent. Return true on success so the modal
   * can close; return false (or throw) to keep it open.
   */
  onApply: (
    strategy: "mid" | "nearSeagm" | "smallProfit" | "seagm" | "custom",
    customPercent?: number,
  ) => Promise<boolean>;
  loading?: boolean;
  /** Optional sample products (with seagmTypes) for the live preview table. */
  sampleProducts?: BulkPricingSample[];
}

const BUILT_IN_PRESETS = [
  {
    key: "smallProfit",
    label: "กำไรบาง",
    percent: 5,
    strategy: "smallProfit",
    color: "text-semantic-green",
    bg: "bg-semantic-green/10 border-semantic-green/30",
  },
  {
    key: "mid",
    label: "ราคากลาง",
    percent: 0,
    strategy: "mid",
    color: "text-site-accent",
    bg: "bg-site-accent/10 border-site-accent/30",
  },
  {
    key: "nearSeagm",
    label: "ใกล้เคียง SEAGM",
    percent: -3,
    strategy: "nearSeagm",
    color: "text-semantic-amber",
    bg: "bg-semantic-amber/10 border-semantic-amber/30",
  },
  {
    key: "seagm",
    label: "ราคา SEAGM",
    percent: 0,
    strategy: "seagm",
    color: "text-site-accent",
    bg: "bg-site-accent/10 border-site-accent/30",
  },
];

const STORAGE_KEY = "admin_pricing_presets";

const calcBulkPreviewPrice = (
  costPrice: number,
  seagmPrice: number,
  strategy: string,
  percent: number,
) => {
  let price: number;
  switch (strategy) {
    case "mid":
      price = (costPrice + seagmPrice) / 2;
      break;
    case "nearSeagm":
      price = seagmPrice * 0.97;
      break;
    case "smallProfit":
      price = costPrice * 1.05;
      break;
    case "seagm":
      price = seagmPrice;
      break;
    case "custom":
      price = costPrice * (1 + percent / 100);
      break;
    default:
      price = seagmPrice;
  }
  if (strategy !== "nearSeagm" && price < costPrice) price = costPrice * 1.02;
  return price;
};

export function BulkPriceModal({
  open,
  onClose,
  onApply,
  loading = false,
  sampleProducts = [],
}: BulkPriceModalProps) {
  const [bulkPricingStrategy, setBulkPricingStrategy] = useState<
    string | null
  >(null);
  const [customPercent, setCustomPercent] = useState<string>("10");
  const [bulkSliderValue, setBulkSliderValue] = useState(10);
  const [bulkActivePreset, setBulkActivePreset] = useState<string | null>(null);
  const [savedPresets, setSavedPresets] = useState<BulkPricingPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState("");
  const [showSavePreset, setShowSavePreset] = useState(false);

  // Load saved presets from localStorage on mount / open.
  useEffect(() => {
    if (!open) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const id = requestAnimationFrame(() => setSavedPresets(parsed));
        return () => cancelAnimationFrame(id);
      }
    } catch {
      /* ignore */
    }
  }, [open]);

  const savePreset = () => {
    if (!newPresetName.trim()) return;
    const updated: BulkPricingPreset[] = [
      ...savedPresets,
      {
        name: newPresetName.trim(),
        percent: bulkSliderValue,
        strategy: "custom",
      },
    ];
    setSavedPresets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setNewPresetName("");
    setShowSavePreset(false);
  };

  const deletePreset = (index: number) => {
    const updated = savedPresets.filter((_, i) => i !== index);
    setSavedPresets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const applyBuiltInPreset = (preset: (typeof BUILT_IN_PRESETS)[0]) => {
    setBulkActivePreset(preset.key);
    setBulkPricingStrategy(preset.strategy);
    if (preset.strategy === "smallProfit") {
      setBulkSliderValue(5);
      setCustomPercent("5");
    } else if (preset.strategy === "nearSeagm") {
      setBulkSliderValue(-3);
      setCustomPercent("-3");
    } else {
      setBulkSliderValue(0);
      setCustomPercent("0");
    }
  };

  const applySavedPreset = (preset: BulkPricingPreset) => {
    setBulkActivePreset(`saved_${preset.name}`);
    setBulkPricingStrategy("custom");
    setBulkSliderValue(preset.percent);
    setCustomPercent(preset.percent.toString());
  };

  const handleSliderChange = (val: number) => {
    setBulkSliderValue(val);
    setCustomPercent(val.toString());
    setBulkPricingStrategy("custom");
    setBulkActivePreset(null);
  };

  const handlePercentInputChange = (val: string) => {
    setCustomPercent(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setBulkSliderValue(Math.max(-30, Math.min(60, num)));
      setBulkPricingStrategy("custom");
      setBulkActivePreset(null);
    }
  };

  const handleSubmit = async () => {
    const effectiveStrategy = bulkPricingStrategy || "custom";
    const effectivePercent = parseFloat(customPercent);

    if (effectiveStrategy === "custom" && isNaN(effectivePercent)) {
      return;
    }

    const ok = await onApply(
      effectiveStrategy as any,
      effectiveStrategy === "custom" ? effectivePercent : undefined,
    );
    if (ok) {
      setBulkPricingStrategy(null);
      setBulkActivePreset(null);
    }
  };

  const effectiveStrategy = bulkPricingStrategy || "custom";
  const effectivePercent = parseFloat(customPercent) || 0;

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="ตั้งราคาแบบกลุ่ม (Bulk Pricing)"
      onSubmit={handleSubmit}
      submitLabel="ยืนยันการตั้งราคา"
      cancelLabel="ยกเลิก"
      loading={loading}
      size="lg"
    >
      <div className="space-y-5">
        {/* Warning Banner */}
        <div className="p-3.5 bg-semantic-rose/10 border border-semantic-rose/20 rounded-xl flex items-start gap-3">
          <span className="text-semantic-rose shrink-0 text-lg">⚠️</span>
          <div>
            <h5 className="text-[13px] font-bold text-semantic-rose mb-0.5">
              ระวังการใช้งานตั้งราคากลุ่ม
            </h5>
            <p className="text-[12px] text-site-muted leading-snug">
              การกระทำนี้จะเปลี่ยนราคาขายของ{" "}
              <strong>สินค้าที่มีอยู่ในระบบทั้งหมด</strong>{" "}
              (หากคำนวณแล้วราคาขายต่ำกว่าต้นทุน
              ระบบจะปรับให้เป็น ต้นทุน + 2% อัตโนมัติเพื่อป้องกันการขาดทุน)
            </p>
          </div>
        </div>

        {/* Preset Chips */}
        <div>
          <h4 className="text-[11px] font-bold text-site-dim uppercase tracking-wider mb-2.5">
            Preset ด่วนที่แนะนำ
          </h4>
          <div className="flex flex-wrap gap-2">
            {BUILT_IN_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => applyBuiltInPreset(preset)}
                className={`px-3.5 py-2 rounded-xl border text-[12px] font-bold transition-all ${
                  bulkActivePreset === preset.key
                    ? `${preset.bg} ${preset.color} ring-1 ring-current`
                    : "bg-site-raised border-site-border text-site-dim hover:border-site-border hover:text-site-text"
                }`}
              >
                {preset.label}
              </button>
            ))}
            {savedPresets.map((preset, idx) => (
              <div key={`saved_${idx}`} className="group relative">
                <button
                  type="button"
                  onClick={() => applySavedPreset(preset)}
                  className={`px-3.5 py-2 rounded-xl border text-[12px] font-bold transition-all flex items-center gap-1.5 ${
                    bulkActivePreset === `saved_${preset.name}`
                      ? "bg-site-accent/10 border-site-accent/30 text-site-accent ring-1 ring-site-accent/30"
                      : "bg-site-raised border-site-border text-site-dim hover:border-site-border hover:text-site-text"
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  {preset.name} ({preset.percent > 0 ? "+" : ""}
                  {preset.percent}%)
                </button>
                <button
                  type="button"
                  onClick={() => deletePreset(idx)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-semantic-rose rounded-full text-white text-[10px] font-bold hidden group-hover:flex items-center justify-center hover:opacity-80 transition-opacity shadow-lg"
                  title="ลบ Preset"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Slider + Number Input */}
        <div className="bg-site-surface border border-site-border-soft rounded-xl p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h4 className="text-[13px] font-bold text-site-text flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-site-accent" />
              เปอร์เซ็นต์กำไรจากต้นทุนหลัก
            </h4>
            <div className="flex items-center gap-2 bg-site-raised p-1.5 rounded-xl border border-site-border">
              <input
                type="number"
                step="0.5"
                value={customPercent}
                onChange={(e) => handlePercentInputChange(e.target.value)}
                className="w-16 text-center bg-transparent px-1 py-1 text-[14px] text-site-accent font-bold focus:outline-none"
              />
              <span className="text-site-dim text-[13px] font-bold pr-2">%</span>
            </div>
          </div>

          {/* Range Slider */}
          <div className="relative px-2 pt-2">
            <input
              type="range"
              min="-30"
              max="60"
              step="0.5"
              value={bulkSliderValue}
              onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #f43f5e 0%, #f97316 ${
                  ((bulkSliderValue + 30) / 90) * 100
                }%, var(--site-border) ${
                  ((bulkSliderValue + 30) / 90) * 100
                }%, var(--site-border) 100%)`,
              }}
            />
            <div className="flex justify-between text-[11px] font-mono text-site-dim mt-2 px-1">
              <span>-30%</span>
              <span className="text-site-dim font-bold">0%</span>
              <span>+15%</span>
              <span>+30%</span>
              <span>+60%</span>
            </div>
          </div>

          {/* Formula Display & Save */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-[11px] text-site-dim bg-site-raised rounded-lg px-3 py-2 font-mono border border-site-border">
              <span className="text-site-dim font-bold">สูตรคำนวณ:</span>{" "}
              ราคาขาย = ต้นทุน × (1 +{" "}
              <span
                className={`font-bold ${
                  parseFloat(customPercent) >= 0
                    ? "text-site-accent"
                    : "text-semantic-rose"
                }`}
              >
                {customPercent || 0}%
              </span>
              )
            </div>

            {/* Save Preset */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {showSavePreset ? (
                <div className="flex items-center gap-2 flex-1 relative">
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="เช่น โปรซัมเมอร์"
                    className="flex-1 bg-site-raised border border-site-accent/30 rounded-lg pl-3 pr-10 py-2 text-[12px] text-site-text focus:ring-2 focus:ring-site-accent/50 outline-none w-full sm:w-48"
                    onKeyDown={(e) => e.key === "Enter" && savePreset()}
                    autoFocus
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                    <button
                      type="button"
                      onClick={savePreset}
                      className="p-1.5 text-site-accent hover:text-site-accent transition-colors"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSavePreset(false)}
                      className="p-1.5 text-site-dim hover:text-semantic-rose transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSavePreset(true)}
                  className="flex items-center justify-center gap-1.5 text-[12px] px-3 py-2 rounded-lg bg-site-accent/10 border border-site-accent/20 text-site-accent hover:bg-site-accent/20 transition-all font-bold w-full sm:w-auto"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  บันทึกเป็นค่าเริ่มต้นใหม่
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Preview Table */}
        {sampleProducts.length > 0 && (
          <div className="bg-site-surface border border-site-border-soft rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-site-border-soft flex items-center gap-2">
              <Eye className="h-4 w-4 text-site-accent" />
              <h4 className="text-[12px] font-bold text-site-muted uppercase tracking-widest">
                Live Preview (ตัวอย่างราคา)
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-site-dim text-left uppercase tracking-wider">
                    <th className="px-5 py-3 font-bold border-b border-site-border-soft">
                      สินค้าอ้างอิง
                    </th>
                    <th className="px-5 py-3 font-bold border-b border-site-border-soft text-right w-24">
                      ต้นทุน
                    </th>
                    <th className="px-5 py-3 font-bold border-b border-site-border-soft text-right w-24">
                      SEAGM
                    </th>
                    <th className="px-5 py-3 font-bold border-b border-site-border-soft text-right w-28 text-site-accent">
                      ราคาขายใหม่
                    </th>
                    <th className="px-5 py-3 font-bold border-b border-site-border-soft text-right w-20">
                      กำไร
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-site-border-soft">
                  {sampleProducts.map((sp, i) => {
                    const newPrice = calcBulkPreviewPrice(
                      sp.cost,
                      sp.seagm,
                      effectiveStrategy,
                      effectivePercent,
                    );
                    const profit =
                      sp.cost > 0
                        ? ((newPrice - sp.cost) / sp.cost) * 100
                        : 0;
                    return (
                      <tr key={i} className="hover:bg-site-raised/50 group">
                        <td className="px-5 py-2.5">
                          <div className="text-site-text font-bold truncate max-w-[180px] text-[13px]">
                            {sp.name}
                          </div>
                          <div className="text-site-dim text-[10px] truncate max-w-[180px] font-mono mt-0.5">
                            {sp.typeName}
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-right text-site-dim font-mono">
                          ฿{sp.cost.toFixed(2)}
                        </td>
                        <td className="px-5 py-2.5 text-right text-site-dim font-mono">
                          ฿{sp.seagm.toFixed(2)}
                        </td>
                        <td className="px-5 py-2.5 text-right text-site-accent font-bold font-mono tracking-wide">
                          ฿{newPrice.toFixed(2)}
                        </td>
                        <td
                          className={`px-5 py-2.5 text-right font-bold tracking-wide ${
                            profit > 0
                              ? "text-site-accent"
                              : profit < 0
                                ? "text-semantic-rose"
                                : "text-site-dim"
                          }`}
                        >
                          {profit > 0 ? "+" : ""}
                          {profit.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Average profit forecast (preserved from original footer) */}
        <div className="text-[12px] text-site-dim">
          คาดการณ์กำไรเฉลี่ย:{" "}
          <span
            className={`font-bold tracking-wide ${
              parseFloat(customPercent) >= 0
                ? "text-site-accent"
                : "text-semantic-rose"
            }`}
          >
            {parseFloat(customPercent) >= 0 ? "+" : ""}
            {customPercent || 0}%
          </span>{" "}
          ต่อรายการ
        </div>
      </div>
    </FormModal>
  );
}
