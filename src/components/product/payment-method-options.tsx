"use client";

import { useRef, type KeyboardEvent } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatTHB } from "@/lib/pricing";
import type { PaymentMethodOption } from "@/lib/api/payments";

/** ค่าธรรมเนียมที่ประเมินจากช่องทางที่เลือก (% ของยอด + ค่าคงที่) — แสดงก่อนกดซื้อ */
export function estimatePaymentFee(
  option: PaymentMethodOption | null | undefined,
  subtotal: number,
): number {
  if (!option) return 0;
  const pct = Number(option.surchargePercent) || 0;
  const flat = Number(option.flatFee) || 0;
  if (pct <= 0 && flat <= 0) return 0;
  return Math.round(((subtotal * pct) / 100) * 100) / 100 + flat;
}

/** ป้ายค่าธรรมเนียมสั้น ๆ ข้างชื่อช่องทาง ("ฟรี" / "+2.5%" / "+2% +฿10") */
function feeNote(
  m: PaymentMethodOption,
  freeLabel: string,
): { text: string; free: boolean } {
  const pct = Number(m.surchargePercent) || 0;
  const flat = Number(m.flatFee) || 0;
  if (pct <= 0 && flat <= 0) return { text: freeLabel, free: true };
  const parts: string[] = [];
  if (pct > 0) parts.push(`+${pct}%`);
  if (flat > 0) parts.push(`+${formatTHB(flat)}`);
  return { text: parts.join(" "), free: false };
}

/**
 * เลือกช่องทางชำระเงินเป็นแถวกดได้ (radio semantics) แทน select ที่พับซ่อนตัวเลือก —
 * ผู้ใช้เห็นทุกช่องทาง + ค่าธรรมเนียมพร้อมกันตั้งแต่แรก ไม่ต้องกดขยาย
 * คีย์บอร์ด: ลูกศรสี่ทิศ / Home / End สลับตัวเลือก (roving tabindex ตามตัวที่เลือก แบบ native radio)
 */
export function PaymentMethodOptions({
  options,
  value,
  onChange,
  ariaLabel,
  idPrefix,
  disabled = false,
}: {
  options: PaymentMethodOption[];
  value: string | null | undefined;
  onChange: (code: string) => void;
  ariaLabel: string;
  /** ให้รายการแรกมี id สำหรับ Label htmlFor ชี้เข้ามา (button เป็น labelable element) */
  idPrefix: string;
  disabled?: boolean;
}) {
  const t = useTranslations("product");
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  // ยังไม่มีการเลือก = ตัวแรกเป็นตัว active (ตามที่ผู้เรียก fallback ไว้) เพื่อให้ tab เข้ากลุ่มได้
  const activeCode = options.some((o) => o.code === value) ? value : options[0]?.code;

  const pickAndFocus = (index: number) => {
    const option = options[index];
    if (!option || option.code === activeCode) return;
    onChange(option.code);
    // รอ state วิ่งกลับเป็น tabIndex=0 แล้วค่อยโฟกัส — เลือกแล้วต้องโฟกัสตัวนั้นเสมอ
    requestAnimationFrame(() => {
      const target = options.findIndex((o) => o.code === option.code);
      refs.current[target]?.focus();
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const current = Math.max(0, options.findIndex((o) => o.code === activeCode));
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      pickAndFocus((current + 1) % options.length);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      pickAndFocus((current - 1 + options.length) % options.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      pickAndFocus(0);
    } else if (e.key === "End") {
      e.preventDefault();
      pickAndFocus(options.length - 1);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className="mt-1.5 flex flex-col gap-1.5"
    >
      {options.map((m, i) => {
        const selected = m.code === activeCode;
        const note = feeNote(m, t("feeFree"));
        return (
          <button
            key={m.code}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={i === 0 ? `${idPrefix}-item` : undefined}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(m.code)}
            className={`flex h-11 w-full items-center gap-2 rounded-[10px] border px-3 text-left transition-colors lg:h-9 ${
              selected
                ? "border-primary bg-primary/5 inset-ring-2 inset-ring-primary"
                : "border-border hover:bg-muted/60"
            }`}
          >
            <span className="min-w-0 flex-1 truncate text-xs font-semibold">{m.label}</span>
            <span
              className={`num shrink-0 text-2xs font-semibold ${
                note.free ? "text-status-success" : "text-muted-foreground-strong"
              }`}
            >
              {note.text}
            </span>
            {/* จองที่ไว้กันชื่อเด้งตอนสลับเลือก */}
            <Check
              aria-hidden
              className={`size-3.5 shrink-0 text-primary ${selected ? "" : "opacity-0"}`}
            />
          </button>
        );
      })}
    </div>
  );
}
