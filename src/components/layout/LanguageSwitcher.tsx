"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useState, useRef, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import { Languages, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  variant?: "desktop" | "mobile";
  className?: string;
}

const languages = [
  { code: "th", label: "ไทย", flagCode: "th" },
  { code: "en", label: "English", flagCode: "us" },
  { code: "zh", label: "中文", flagCode: "cn" },
  { code: "ja", label: "日本語", flagCode: "jp" },
  { code: "ko", label: "한국어", flagCode: "kr" },
  { code: "ms", label: "Melayu", flagCode: "my" },
  { code: "hi", label: "हिन्दी", flagCode: "in" },
  { code: "es", label: "Español", flagCode: "es" },
  { code: "fr", label: "Français", flagCode: "fr" },
];

export function LanguageSwitcher({
  variant = "desktop",
  className,
}: LanguageSwitcherProps) {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLanguage =
    languages.find((l) => l.code === locale) || languages[0];
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (newLocale: string) => {
    setIsOpen(false);
    startTransition(() => {
      router.replace(pathname, { locale: newLocale as any });
    });
  };

  const getFlagUrl = (code: string) =>
    `https://kapowaz.github.io/square-flags/flags/${code}.svg`;

  if (variant === "mobile") {
    return (
      <div className={cn("space-y-3", className)}>
        <p className="text-xs font-bold text-site-dim uppercase tracking-wider px-1">
          {t("language_selector")}
        </p>

        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between p-3 bg-site-surface border border-site-border-soft rounded-xl hover:border-site-accent/40 transition-all text-site-text"
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-sm overflow-hidden shrink-0 shadow-sm">
              <img
                src={getFlagUrl(currentLanguage.flagCode)}
                alt={currentLanguage.label}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold uppercase text-[13px] tracking-wide">
              {currentLanguage.label}
            </span>
          </div>
          <ChevronDown size={18} className="text-site-dim" />
        </button>

        {mounted &&
          createPortal(
            <AnimatePresence>
              {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-sm bg-site-surface border border-site-border-soft rounded-2xl p-5 max-h-[85vh] overflow-y-auto flex flex-col shadow-2xl"
                  >
                    <div className="flex justify-between items-center mb-6 border-b border-site-border-soft pb-4">
                      <h3 className="font-bold text-sm uppercase tracking-wide text-site-text">
                        Select Language
                      </h3>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 rounded-lg text-site-dim hover:text-site-text hover:bg-site-raised transition-colors"
                        aria-label="Close"
                      >
                        <span className="text-xl font-bold leading-none block w-5 h-5 text-center">
                          ×
                        </span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          className={cn(
                            "flex flex-col items-center justify-center p-4 border rounded-xl transition-all",
                            locale === lang.code
                              ? "bg-site-accent/10 border-site-accent/40 shadow-sm"
                              : "bg-site-raised border-site-border-soft hover:border-site-border text-site-muted hover:text-site-text",
                          )}
                        >
                          <div className="w-8 h-8 mb-2 rounded-sm overflow-hidden shrink-0 shadow-sm">
                            <img
                              src={getFlagUrl(lang.flagCode)}
                              alt={lang.label}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span
                            className={cn(
                              "text-[11px] uppercase font-bold tracking-wide",
                              locale === lang.code
                                ? "text-site-accent"
                                : "text-site-muted",
                            )}
                          >
                            {lang.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body,
          )}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-transparent hover:bg-site-raised rounded-full transition-colors group cursor-pointer"
      >
        <div className="w-[18px] h-[14px] rounded-[2px] overflow-hidden shrink-0 shadow-sm opacity-90 group-hover:opacity-100 transition-opacity">
          <img
            src={getFlagUrl(currentLanguage.flagCode)}
            alt={currentLanguage.label}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-xs text-site-muted font-medium group-hover:text-site-text transition-colors uppercase tabular-nums tracking-wide">
          {currentLanguage.code} {currentLanguage.label}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "text-site-dim transition-transform duration-200 group-hover:text-site-muted",
            isOpen && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-48 bg-site-surface border border-site-border-soft rounded-xl shadow-2xl z-[110] overflow-hidden"
          >
            <div className="p-2 space-y-1">
              {languages.map((lang) => {
                const active = locale === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-[13px] rounded-lg transition-colors border",
                      active
                        ? "bg-site-accent/10 border-site-accent/30 font-medium text-site-accent"
                        : "border-transparent text-site-muted hover:text-site-text hover:bg-site-raised",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-[18px] h-[14px] rounded-[2px] overflow-hidden shrink-0 shadow-sm opacity-90">
                        <img
                          src={getFlagUrl(lang.flagCode)}
                          alt={lang.label}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="tracking-wide uppercase font-medium">
                        {lang.label}
                      </span>
                    </div>
                    {active && <Check size={14} className="text-site-accent" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
