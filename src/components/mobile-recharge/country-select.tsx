"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { CountryMeta } from "@/lib/mobile-countries";

/**
 * ขั้น 1 — เลือกประเทศผู้รับ (SEAGM-style)
 * Field ปุ่มเต็มกว้าง (ธง + ชื่อประเทศ + chevron) กดแล้วเปิด sheet ค้นหา/เลือก
 * — ไม่ใช่ select dropdown ตามสเปก UX ของหน้าเติมมือถือ
 */
export function CountrySelect({
  countries,
  value,
  onChange,
  disabled,
}: {
  countries: CountryMeta[];
  value: string | null;
  onChange: (code: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("mobileRecharge");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const name = (c: CountryMeta) => (locale === "th" ? c.nameTh : c.nameEn);
  const selected = countries.find((c) => c.code === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.nameTh.includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [countries, query]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={t("stepCountry")}
          className="flex h-12 w-full items-center gap-3 rounded-[6px] bg-muted/60 px-4 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 lg:h-10"
        >
          {selected ? (
            <>
              <span aria-hidden className="text-xl leading-none">
                {selected.flag}
              </span>
              <span className="flex-1 truncate text-[14px] font-medium">
                {name(selected)}
              </span>
            </>
          ) : (
            <span className="flex-1 text-[14px] text-muted-foreground">
              {t("countryPlaceholder")}
            </span>
          )}
          <ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </SheetTrigger>

      <SheetContent side="bottom" className="mx-auto max-h-[80dvh] max-w-lg rounded-t-[14px] px-0 pb-[env(safe-area-inset-bottom)]">
        <SheetHeader className="px-4">
          <SheetTitle className="text-[15px] font-bold">{t("stepCountry")}</SheetTitle>
          <div className="relative mt-2">
            <Search
              aria-hidden
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("countrySearchPlaceholder")}
              className="h-10 w-full rounded-[6px] bg-muted/60 pl-9 pr-3 text-[14px] outline-none placeholder:text-muted-foreground"
            />
          </div>
        </SheetHeader>

        <div className="overflow-y-auto px-2 pb-4">
          {filtered.map((c) => {
            const active = c.code === value;
            return (
              <button
                key={c.code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(c.code);
                  setOpen(false);
                  setQuery("");
                }}
                className={`flex w-full items-center gap-3 rounded-[6px] px-3 py-2.5 text-left transition-colors ${
                  active ? "bg-primary/10" : "hover:bg-muted/60"
                }`}
              >
                <span aria-hidden className="text-xl leading-none">
                  {c.flag}
                </span>
                <span
                  className={`flex-1 text-[14px] ${active ? "font-bold text-primary" : "font-medium"}`}
                >
                  {name(c)}
                </span>
                <span className="num text-[12.5px] text-muted-foreground">
                  +{c.callingCode}
                </span>
              </button>
            );
          })}
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {t("countryNoResult")}
            </p>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
