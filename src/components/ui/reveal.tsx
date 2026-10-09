"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Reveal — entrance แบบ "Whisper" (motion spec ใน globals.css): fade + ยก 4px, 150ms
 * โผล่ครั้งเดียวเมื่อเข้า viewport แล้วหายไปจาก lifecycle (unobserve หลังเข้าที่)
 * reduced-motion = โผล่ทันทีไม่มี transition (เพิ่ม class ก่อน paint ผ่าน state เริ่มต้น)
 */
export function Reveal({
  children,
  className,
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  /** หน่วงก่อนเข้าที่ (ms) — Whisper ไม่ไล่ stagger เป็นระบบ เผื่อจุดที่ต้องการจังหวะเดียว */
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // reduced-motion ไม่ต้องแยกทาง — media query ใน globals กด transition เหลือ 0.01ms อยู่แล้ว
    // (ผู้ใช้ได้ของโผล่ทันทีตาม IO โดยไม่เห็นการเคลื่อนไหว)
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-150 ease-soft will-change-[opacity,transform] ${
        shown ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
      } ${className ?? ""}`}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
