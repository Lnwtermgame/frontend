"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  Headphones,
  X,
  MessageCircle,
  CircleHelp,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { useOnClickOutside } from "@/lib/hooks/use-on-click-outside";

/**
 * Floating support entry point — replaces the removed Tawk widget with a
 * lightweight menu into the existing support pages.
 */
export function SupportFab() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(
    containerRef as React.RefObject<HTMLDivElement>,
    () => setOpen(false),
  );

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const items: { href: string; icon: LucideIcon; label: string }[] = [
    {
      href: "/support/contact",
      icon: MessageCircle,
      label: t("Support.urgent_help.title"),
    },
    {
      href: "/support/faq",
      icon: CircleHelp,
      label: t("Support.categories.faq.title"),
    },
    {
      href: "/support/tickets",
      icon: Ticket,
      label: t("Support.categories.tickets.title"),
    },
  ];

  return (
    <div
      className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2"
      ref={containerRef}
    >
      {open && (
        <div
          className="bg-site-surface border border-site-border rounded-8 shadow-2xl overflow-hidden w-64"
          role="menu"
          aria-label={t("Navigation.support")}
        >
          {items.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-site-muted hover:text-site-text hover:bg-site-raised transition-colors"
            >
              <Icon size={16} className="text-site-accent shrink-0" />
              <span className="line-clamp-1">{label}</span>
            </Link>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("Navigation.support")}
        className="h-12 w-12 rounded-full bg-site-accent text-site-bg shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent/60"
      >
        {open ? <X size={20} aria-hidden="true" /> : <Headphones size={20} aria-hidden="true" />}
      </button>
    </div>
  );
}
