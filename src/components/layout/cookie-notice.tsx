"use client";

import { useCallback, useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "gtp_cookie_ack_v1";
const ACK_TTL_MS = 180 * 24 * 60 * 60 * 1000; // 180 days
const REVEAL_DELAY_MS = 400;
const EXIT_DURATION_MS = 200;

type CookieChoice = "accepted" | "rejected";

function isAcknowledged(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as { acknowledgedAt?: number };
    if (!parsed.acknowledgedAt) return false;
    return Date.now() - parsed.acknowledgedAt < ACK_TTL_MS;
  } catch {
    return false;
  }
}

export function CookieNotice() {
  const t = useTranslations("cookies");
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ack = localStorage.getItem(STORAGE_KEY);
    if (isAcknowledged(ack)) return;
    // หน่วงสั้น ๆ ให้ entrance animation ของหน้าจบก่อน — แถบโผล่พร้อมกันทั้งสองอย่างอ่านเป็น glitch
    const reveal = window.setTimeout(() => setOpen(true), REVEAL_DELAY_MS);
    return () => window.clearTimeout(reveal);
  }, []);

  // เก็บทั้งสองทางเลือกแบบเดียวกัน (TTL เดียวกัน) ต่างกันแค่ choice —
  // ปฏิเสธ = ใช้เฉพาะคุกกี้จำเป็น ไม่ใช่ "ปิดไปก่อนแล้วถามใหม่ทุกหน้า"
  const handleChoice = useCallback((choice: CookieChoice) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ acknowledgedAt: Date.now(), choice }),
      );
    }
    setClosing(true);
  }, []);

  useEffect(() => {
    if (!closing) return;
    const done = window.setTimeout(() => {
      setClosing(false);
      setOpen(false);
    }, EXIT_DURATION_MS);
    return () => window.clearTimeout(done);
  }, [closing]);

  useEffect(() => {
    if (!open || closing) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleChoice("rejected");
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, closing, handleChoice]);

  if (!open) return null;

  return (
    <section
      role="region"
      aria-label={t("regionLabel")}
      className={cn(
        // มือถือ: แถบแนบล่างเหนือแถบสรุปตรึง (z-30) — ต้องบางพอไม่กินพื้นที่เนื้อหา
        // เดสก์ท็อป: จอดซ้ายล่าง — ขวาล่างปล่อยว่างให้ widget ที่จะมาทีหลัง
        "fixed inset-x-3 bottom-[calc(88px+env(safe-area-inset-bottom))] z-40",
        "sm:inset-x-4 lg:inset-x-auto lg:bottom-6 lg:left-6 lg:w-[24rem]",
        "overflow-hidden rounded-lg border border-border/80 bg-card",
        "shadow-[0_2px_4px_-2px_rgb(16_24_40/0.06),0_16px_32px_-12px_rgb(16_24_40/0.18),0_32px_64px_-24px_rgb(16_24_40/0.28)]",
        "duration-200 ease-soft",
        closing
          ? "animate-out fade-out-0 slide-out-to-bottom-2 fill-mode-forwards"
          : "animate-in fade-in-0 slide-in-from-bottom-2",
      )}
    >
      {/* ย่อเป็นย่อหน้าเดียว — การ์ดใหญ่พร้อมปุ่ม X ซ้ำซ้อนกับ "จำเป็นเท่านั้น"
          กินครึ่งจอมือถือและบังเนื้อหาที่ผู้ใช้กำลังอ่าน */}
      <div className="flex items-start gap-2.5 p-3.5 pb-3">
        <div
          aria-hidden
          className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 ring-inset"
        >
          <Cookie className="size-3.5" strokeWidth={1.75} />
        </div>

        <p className="min-w-0 flex-1 text-xs leading-[1.55] text-muted-foreground-strong">
          <span className="font-bold text-foreground">{t("title")}</span>{" "}
          {t("body")}{" "}
          <Link
            href="/privacy"
            className="font-semibold text-primary underline decoration-primary/35 underline-offset-2 transition-colors ease-soft hover:decoration-primary"
          >
            {t("privacyLink")}
          </Link>
        </p>
      </div>

      {/* สองทางเลือกขนานกัน — "ใช้ที่จำเป็นเท่านั้น" ต้องอ่านเป็นทางเลือกที่ใช้ได้
          ไม่ใช่ปุ่มหลอกให้กดยอมรับเพียงอย่างเดียว (Esc = ปฏิเสธเช่นกัน) */}
      <div className="flex gap-2 border-t border-border/70 bg-muted/40 px-3.5 py-2.5">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleChoice("rejected")}
          className="h-11 flex-1 px-3 text-xs font-semibold lg:h-8 lg:flex-none"
        >
          {t("essentialOnly")}
        </Button>
        <Button
          type="button"
          onClick={() => handleChoice("accepted")}
          className="h-11 flex-1 px-3 text-xs font-semibold lg:h-8 lg:flex-none"
        >
          {t("acceptAll")}
        </Button>
      </div>
    </section>
  );
}
