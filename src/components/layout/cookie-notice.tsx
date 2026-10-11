"use client";

import { useCallback, useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
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
        // มือถือ: การ์ดเต็มความกว้าง เว้นที่เหนือแถบสรุปตรึงล่าง (z-30)
        // เดสก์ท็อป: จอดซ้ายล่าง — ขวาล่างปล่อยว่างให้ widget ที่จะมาทีหลัง
        "fixed inset-x-3 bottom-[calc(88px+env(safe-area-inset-bottom))] z-40",
        "sm:inset-x-4 lg:inset-x-auto lg:bottom-6 lg:left-6 lg:w-[26rem]",
        "overflow-hidden rounded-lg border border-border/80 bg-card/95 backdrop-blur-xl",
        "shadow-[0_2px_4px_-2px_rgb(16_24_40/0.06),0_16px_32px_-12px_rgb(16_24_40/0.18),0_32px_64px_-24px_rgb(16_24_40/0.28)]",
        "duration-200 ease-soft",
        closing
          ? "animate-out fade-out-0 slide-out-to-bottom-2 fill-mode-forwards"
          : "animate-in fade-in-0 slide-in-from-bottom-2",
      )}
    >
      <div className="flex items-start gap-3 p-4 pb-3.5">
        <div
          aria-hidden
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary ring-1 ring-primary/15 ring-inset"
        >
          <Cookie className="size-[18px]" strokeWidth={1.75} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm leading-snug font-bold text-foreground">
            {t("title")}
          </h2>
          <p className="mt-1 text-xs leading-[1.55] text-muted-foreground-strong">
            {t("body")}{" "}
            <Link
              href="/privacy"
              className="font-semibold text-primary underline decoration-primary/35 underline-offset-2 transition-colors ease-soft hover:decoration-primary"
            >
              {t("privacyLink")}
            </Link>
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => handleChoice("rejected")}
          aria-label={t("closeAria")}
          className="-mt-1.5 -me-1.5 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" strokeWidth={1.75} />
        </Button>
      </div>

      {/* ทางเลือกสองปุ่มขนานกันจริง ๆ — "ใช้ที่จำเป็นเท่านั้น" ต้องอ่านเป็น
          ทางเลือกที่ใช้ได้ ไม่ใช่ปุ่มหลอกให้กดยอมรับเพียงอย่างเดียว
          (ปุ่มปฏิเสธวางซ้ายตามลำดับความสำคัญ แต่บนมือถือปุ่มหลักอยู่ล่างสุด = นิ้วโป้งถึงก่อน) */}
      <div className="flex flex-col-reverse gap-2 border-t border-border/70 bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={() => handleChoice("rejected")}
          className="w-full px-4 text-sm font-semibold sm:w-auto"
        >
          {t("essentialOnly")}
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={() => handleChoice("accepted")}
          className="w-full px-4 text-sm font-semibold sm:w-auto"
        >
          {t("acceptAll")}
        </Button>
      </div>
    </section>
  );
}
