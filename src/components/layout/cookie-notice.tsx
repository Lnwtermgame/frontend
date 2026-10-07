"use client";

import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "gtp_cookie_ack_v1";
const ACK_TTL_MS = 180 * 24 * 60 * 60 * 1000; // 180 days

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ack = localStorage.getItem(STORAGE_KEY);
    if (!isAcknowledged(ack)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read จาก localStorage หลัง hydrate
      setOpen(true);
    }
  }, []);

  // เก็บทั้งสองทางเลือกแบบเดียวกัน (TTL เดียวกัน) ต่างกันแค่ choice —
  // ปฏิเสธ = ใช้เฉพาะคุกกี้จำเป็น ไม่ใช่ "ปิดไปก่อนแล้วถามใหม่ทุกหน้า"
  const handleChoice = (choice: CookieChoice) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ acknowledgedAt: Date.now(), choice }),
      );
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="region"
      aria-label={t("regionLabel")}
      className="fixed bottom-[calc(88px+env(safe-area-inset-bottom))] left-4 right-4 z-20 max-w-sm rounded-[14px] border bg-card/95 p-4 text-xs shadow-2xl backdrop-blur animate-in fade-in-0 slide-in-from-bottom-4 lg:bottom-4 lg:left-auto"
    >
      <div className="flex items-start gap-3">
        <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-primary/10 text-primary">
          <Cookie className="size-4" />
        </div>
        <div className="flex-1 space-y-1.5 leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">{t("title")}</p>
          <p>
            {t("body")}{" "}
            <Link href="/privacy" className="text-primary underline hover:text-primary/80">
              {t("privacyLink")}
            </Link>
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleChoice("rejected")}
          className="text-muted-foreground hover:text-foreground"
          aria-label={t("closeAria")}
        >
          <X className="size-4" />
        </button>
      </div>
      {/* ทางเลือกสองปุ่มขนานกันจริง ๆ — "ใช้ที่จำเป็นเท่านั้น" ต้องอ่านเป็น
          ทางเลือกที่ใช้ได้ ไม่ใช่ปุ่มหลอกให้กดยอมรับเพียงอย่างเดียว */}
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleChoice("rejected")}
          className="h-8 text-xs font-semibold"
        >
          {t("essentialOnly")}
        </Button>
        <Button
          size="sm"
          onClick={() => handleChoice("accepted")}
          className="h-8 text-xs font-semibold"
        >
          {t("acceptAll")}
        </Button>
      </div>
    </div>
  );
}
