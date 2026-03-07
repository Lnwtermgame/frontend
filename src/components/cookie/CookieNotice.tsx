"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CookieNoticeProps = {
  isTawkEnabled: boolean;
};

const STORAGE_KEY = "lnw_cookie_notice_ack_v1";
const ACK_TTL_MS = 180 * 24 * 60 * 60 * 1000;

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

export function CookieNotice({ isTawkEnabled }: CookieNoticeProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("CookieNotice");
  const items = t.raw("items") as string[];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ack = localStorage.getItem(STORAGE_KEY);
    setOpen(!isAcknowledged(ack));
  }, []);

  const dismiss = () => {
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
    <aside
      className="fixed left-3 right-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-[70] border-[3px] border-black bg-white p-4 sm:left-4 sm:right-auto sm:bottom-4 sm:w-[26rem]"
      style={{ boxShadow: "6px 6px 0 0 #000000" }}
      role="dialog"
      aria-live="polite"
      aria-label={t("title")}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("ariaClose")}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center border-2 border-black bg-white hover:bg-gray-100"
      >
        <X size={16} />
      </button>

      <h3 className="pr-9 text-sm font-black sm:text-base">{t("title")}</h3>
      <p className="mt-2 text-xs text-gray-700 sm:text-sm">
        {t("description")}
      </p>

      <ul className="mt-2 space-y-1 text-xs text-gray-800 sm:text-sm">
        {items.map((item, index) => (
          <li key={index}>- {item}</li>
        ))}
        <li>- {isTawkEnabled ? t("tawkItem") : t("noTawkItem")}</li>
      </ul>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={dismiss}
          className="h-10 border-[3px] border-black bg-brutal-yellow px-4 text-sm font-bold text-black"
          style={{ boxShadow: "3px 3px 0 0 #000000" }}
        >
          {t("acknowledge")}
        </button>
        <Link
          href="/privacy"
          className="inline-flex h-10 items-center justify-center border-[2px] border-black bg-white px-4 text-sm font-semibold hover:bg-gray-50"
        >
          {t("privacy")}
        </Link>
      </div>
    </aside>
  );
}
