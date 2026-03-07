"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useState, useRef, useEffect } from "react";
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
];

export function LanguageSwitcher({ variant = "desktop", className }: LanguageSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find((l) => l.code === locale) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (newLocale: string) => {
    setIsOpen(false);
    router.replace(pathname, { locale: newLocale as any });
  };

  const getFlagUrl = (code: string) => `https://kapowaz.github.io/square-flags/flags/${code}.svg`;

  if (variant === "mobile") {
    return (
      <div className={cn("space-y-3", className)}>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">Language / ภาษา</p>
        <div className="grid grid-cols-3 gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={cn(
                "flex flex-col items-center justify-center p-3 border-[2px] transition-all active:translate-y-[2px]",
                locale === lang.code
                  ? "bg-brutal-yellow border-black font-bold shadow-[2px_2px_0_0_#000]"
                  : "bg-white border-gray-200 hover:border-black text-gray-600"
              )}
            >
              <div className="w-8 h-8 mb-1 border border-black overflow-hidden shrink-0">
                <img
                  src={getFlagUrl(lang.flagCode)}
                  alt={lang.label}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] uppercase">{lang.code}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 border-[3px] border-black transition-all active:translate-y-[2px] active:translate-x-[2px]"
        style={{ boxShadow: isOpen ? "none" : "3px 3px 0 0 #000000" }}
      >
        <div className="w-5 h-5 border border-black overflow-hidden shrink-0">
          <img
            src={getFlagUrl(currentLanguage.flagCode)}
            alt={currentLanguage.label}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-sm font-bold uppercase">{currentLanguage.label}</span>
        <ChevronDown
          size={14}
          className={cn("text-gray-500 transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-40 bg-white border-[3px] border-black z-50 overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="p-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors",
                    locale === lang.code
                      ? "bg-brutal-yellow/20 font-bold text-black"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border border-black overflow-hidden shrink-0">
                      <img
                        src={getFlagUrl(lang.flagCode)}
                        alt={lang.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span>{lang.label}</span>
                  </div>
                  {locale === lang.code && <Check size={14} className="text-black" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
