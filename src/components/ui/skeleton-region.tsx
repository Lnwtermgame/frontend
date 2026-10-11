"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * SkeletonRegion — ห่อกลุ่ม skeleton หนึ่งก้อน:
 * - a11y: role=status + aria-busy + ข้อความ sr-only ประกาศ "กำลังโหลด" ครั้งเดียว
 *   (ชิ้น <Skeleton> ข้างในเป็น aria-hidden อยู่แล้ว)
 * - แสดงทันทีตั้งแต่เฟรมแรก ไม่มี fade ขาเข้า — placeholder ต้องเห็นตำแหน่งตั้งแต่แรก
 */
export function SkeletonRegion({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  /** ข้อความสำหรับ screen reader — ไม่ส่ง = common.loading */
  label?: string;
}) {
  const t = useTranslations("common");
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={className}
    >
      <span className="sr-only">{label ?? t("loading")}</span>
      {children}
    </div>
  );
}

/**
 * class entrance ของเนื้อหาจริงที่มาแทน skeleton: fade + ยก 4px 150ms (Whisper)
 * ใส่ตรงที่ element เดิมได้เลยเมื่อไม่อยากเพิ่ม wrapper div
 */
export const FADE_IN = "animate-in fade-in-0 slide-in-from-bottom-1 duration-150 ease-soft";

/**
 * FadeIn — เนื้อหาจริงที่มาแทน skeleton: fade + ยก 4px 150ms (Whisper)
 * ให้การสลับ skeleton → content เป็น crossfade นุ่ม ๆ แทนการตัดภาพ
 * ไม่ต้องใช้ซ้อนกับ <Reveal> (มี entrance ของตัวเองอยู่แล้ว)
 */
export function FadeIn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(FADE_IN, className)}>
      {children}
    </div>
  );
}
