"use client";

import { useLanguage } from "@/lib/context/language-context";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center space-x-1">
      <button
        onClick={() => setLocale("en")}
        className={cn(
          "px-1.5 py-0.5 text-xs rounded transition-colors",
          locale === "en"
            ? "bg-mali-blue/20 text-white"
            : "text-mali-text-secondary hover:text-white"
        )}
      >
        EN
      </button>
      <button
        onClick={() => setLocale("th")}
        className={cn(
          "px-1.5 py-0.5 text-xs rounded transition-colors",
          locale === "th"
            ? "bg-mali-blue/20 text-white"
            : "text-mali-text-secondary hover:text-white"
        )}
      >
        TH
      </button>
    </div>
  );
} 