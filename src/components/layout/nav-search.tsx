"use client";

import { useState, useRef, useEffect, useMemo, useId } from "react";
import Image from "next/image";
import { Search, X, Loader2, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { useFeatured, useProducts } from "@/lib/query/hooks";
import { productImage } from "@/lib/product-image";

export function NavSearch({
  className = "",
  withButton = true,
}: {
  className?: string;
  withButton?: boolean;
}) {
  const t = useTranslations("nav");
  const th = useTranslations("home");
  const tp = useTranslations("product");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  // index ของ option ที่ active ใน listbox (-1 = ไม่มี) — สำหรับ aria-activedescendant
  const [activeIndexRaw, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // id ของ listbox — strip ":" ที่ useId ใส่มาเพื่อให้ id สะอาด
  const listboxId = `nav-search-listbox-${useId().replace(/:/g, "")}`;

  // Popular products when query is empty
  const featured = useFeatured(6);

  // Live search products when typing
  const searchResults = useProducts({
    search: query.trim() || undefined,
    limit: 6,
  });

  const displayList = useMemo(() => {
    if (query.trim()) {
      return searchResults.data ?? [];
    }
    return featured.data ?? [];
  }, [query, searchResults.data, featured.data]);

  /* clamp active ให้อยู่ในขอบเขต list — derive ตอน render แทน effect
     (list สั้นลงจากการพิมพ์ต่อ index ที่เกินจะตกไป -1 เอง ไม่ต้อง setState) */
  const activeIndex = Math.min(activeIndexRaw, displayList.length - 1);

  const closeDropdown = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  /** เลือก option ที่ active — ใช้ทั้ง Enter ใน input */
  const pickActive = (index: number) => {
    const product = displayList[index];
    if (!product) return;
    closeDropdown();
    router.push(`/games/${product.slug}`);
  };

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // เลื่อน option ที่ active ให้มองเห็นใน dropdown
  useEffect(() => {
    if (activeIndex < 0) return;
    document
      .getElementById(`${listboxId}-opt-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, listboxId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    closeDropdown();
    router.push(`/games?search=${encodeURIComponent(query.trim())}`);
  };

  // ประกาศจำนวนผลให้ screen reader รู้ (แบบ polite)
  const announceText =
    !query.trim() || searchResults.isLoading
      ? ""
      : displayList.length > 0
        ? t("searchResultsCount", { count: displayList.length })
        : t("noResults");

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      if (displayList.length === 0) return;
      setActiveIndex((i) => {
        if (i === -1) return e.key === "ArrowDown" ? 0 : displayList.length - 1;
        const delta = e.key === "ArrowDown" ? 1 : -1;
        return (i + delta + displayList.length) % displayList.length;
      });
    } else if (e.key === "Enter") {
      // มี option ที่ active → เข้าหน้าสินค้านั้น แทนการ submit ฟอร์ม
      if (isOpen && activeIndex >= 0 && displayList[activeIndex]) {
        e.preventDefault();
        pickActive(activeIndex);
      }
    } else if (e.key === "Escape") {
      if (isOpen) {
        e.preventDefault();
        closeDropdown();
        inputRef.current?.focus();
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form
        onSubmit={handleSubmit}
        className={`flex h-10 items-center gap-1 rounded-[10px] border border-input bg-card pl-3 transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/25 ${
          withButton ? "pr-1" : "pr-3"
        }`}
      >
        <Search className="size-4 shrink-0 text-muted-foreground/70" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder={t("searchPlaceholder")}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
          }
          aria-label={t("searchAria")}
          className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground/70"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
            aria-label={t("clearSearch")}
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
        {withButton ? (
          <button
            type="submit"
            className="h-8 shrink-0 rounded-[8px] bg-primary px-4 text-[13px] font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("searchButton")}
          </button>
        ) : null}
      </form>

      {/* ประกาศจำนวนผลการค้นหาให้ screen reader */}
      <div role="status" aria-live="polite" className="sr-only">
        {announceText}
      </div>

      {/* Instant Dropdown */}
      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-[14px] border bg-popover text-popover-foreground shadow-2xl animate-in fade-in-0 zoom-in-95">
          <div className="p-3 border-b text-xs font-semibold text-muted-foreground">
            {query.trim() ? t("searchResults") : th("popularTitle")}
          </div>

          {query.trim() && searchResults.isLoading ? (
            <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin mr-2" />
              {t("searching")}
            </div>
          ) : displayList.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              {t("noResultsHelp")}
            </p>
          ) : (
            <div
              role="listbox"
              id={listboxId}
              aria-label={query.trim() ? t("searchResults") : th("popularTitle")}
              className="max-h-80 overflow-y-auto p-1.5"
            >
              {displayList.map((product, index) => (
                <Link
                  key={product.id}
                  id={`${listboxId}-opt-${index}`}
                  href={`/games/${product.slug}`}
                  role="option"
                  aria-selected={activeIndex === index}
                  tabIndex={-1}
                  onClick={() => closeDropdown()}
                  className={`flex items-center gap-3 rounded-[10px] p-2 transition-colors hover:bg-card hover:text-primary ${
                    activeIndex === index ? "bg-card text-primary" : ""
                  }`}
                >
                  <div className="relative size-9 shrink-0 overflow-hidden rounded-[8px]">
                    <Image
                      src={productImage(product.name, product.imageUrl)}
                      alt={product.name}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{product.name}</p>
                    <p className="text-[11.5px] text-muted-foreground truncate">
                      {product.category?.name ?? (product.productType === "DIRECT_TOPUP" ? tp("type_DIRECT_TOPUP") : tp("type_CARD"))}
                    </p>
                  </div>
                  <ArrowRight className="size-3 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}

          {query.trim() ? (
            <div className="border-t p-2">
              <button
                type="button"
                onClick={handleSubmit}
                className="flex w-full items-center justify-center gap-1.5 rounded-[8px] py-1.5 text-xs font-semibold text-primary hover:bg-card"
              >
                {t("viewAllResults", { query })}
                <ArrowRight className="size-3" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
