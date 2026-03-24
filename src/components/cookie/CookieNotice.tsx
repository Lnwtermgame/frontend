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
      className="fixed left-3 right-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-[70] rounded-2xl border border-white/10 bg-[#0f1115]/95 backdrop-blur-xl p-5 shadow-2xl sm:left-4 sm:right-auto sm:bottom-4 sm:w-[26rem]"
      role="dialog"
      aria-live="polite"
      aria-label={t("title")}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("ariaClose")}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-[#212328]/10 hover:text-white"
      >
        <X size={18} />
      </button>

      <h3 className="pr-9 text-sm font-bold text-white sm:text-base">{t("title")}</h3>
      <p className="mt-2 text-xs text-gray-400 sm:text-sm">
        {t("description")}
      </p>

      <ul className="mt-3 space-y-1.5 text-xs text-gray-400 sm:text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-start">
            <span className="mr-2 mt-0.5 text-[10px] text-site-accent">●</span>
            <span>{item}</span>
          </li>
        ))}
        <li className="flex items-start">
          <span className="mr-2 mt-0.5 text-[10px] text-site-accent">●</span>
          <span>{isTawkEnabled ? t("tawkItem") : t("noTawkItem")}</span>
        </li>
      </ul>

      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={dismiss}
          className="h-10 rounded-[6px] bg-site-accent px-5 text-sm font-bold tracking-wide text-white transition-colors hover:bg-site-accent-hover shadow-accent-glow"
        >
          {t("acknowledge")}
        </button>
        <Link
          href="/privacy"
          className="inline-flex h-10 items-center justify-center rounded-[6px] border border-white/10 bg-[#212328]/5 px-5 text-sm font-semibold text-white transition-colors hover:bg-[#212328]/10"
        >
          {t("privacy")}
        </Link>
      </div>
    </aside>
  );
}
