"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Cookie, X } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "gtp_cookie_ack_v1";
const ACK_TTL_MS = 180 * 24 * 60 * 60 * 1000; // 180 days

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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ack = localStorage.getItem(STORAGE_KEY);
    if (!isAcknowledged(ack)) {
      setOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ acknowledgedAt: Date.now() }),
      );
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="region"
      aria-label="การแจ้งเตือนคุกกี้"
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-[14px] border bg-card/95 p-4 text-xs shadow-2xl backdrop-blur animate-in fade-in-0 slide-in-from-bottom-4"
    >
      <div className="flex items-start gap-3">
        <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-primary/10 text-primary">
          <Cookie className="size-4" />
        </div>
        <div className="flex-1 space-y-1.5 leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">เว็บไซต์นี้ใช้คุกกี้</p>
          <p>
            เราใช้คุกกี้เพื่อพัฒนาประสบการณ์การใช้งานและวิเคราะห์การเข้าชมเว็บไซต์
            อ่านรายละเอียดเพิ่มเติมได้ที่{" "}
            <Link href="/privacy" className="text-primary underline hover:text-primary/80">
              นโยบายความเป็นส่วนตัว
            </Link>
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground"
          aria-label="ปิดการแจ้งเตือน"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={handleDismiss} className="h-7 text-xs font-semibold">
          ยอมรับทั้งหมด
        </Button>
      </div>
    </div>
  );
}
