"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Popular products when query is empty
  const featured = useFeatured(6);

  // Live search products when typing
  const searchResults = useProducts({
    search: query.trim() || undefined,
    limit: 6,
  });

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    router.push(`/games?search=${encodeURIComponent(query.trim())}`);
  };

  const displayList = useMemo(() => {
    if (query.trim()) {
      return searchResults.data ?? [];
    }
    return featured.data ?? [];
  }, [query, searchResults.data, featured.data]);

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
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={t("searchPlaceholder")}
          className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground/70"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="shrink-0 px-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="clear"
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

      {/* Instant Dropdown */}
      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-[14px] border bg-popover text-popover-foreground shadow-2xl animate-in fade-in-0 zoom-in-95">
          <div className="p-3 border-b text-xs font-semibold text-muted-foreground">
            {query.trim() ? "ผลการค้นหา" : "เกมยอดนิยม"}
          </div>

          <div className="max-h-80 overflow-y-auto p-1.5">
            {query.trim() && searchResults.isLoading ? (
              <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin mr-2" />
                กำลังค้นหา…
              </div>
            ) : displayList.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                ไม่พบสินค้าที่ตรงกับคำค้นหา
              </p>
            ) : (
              displayList.map((product) => (
                <Link
                  key={product.id}
                  href={`/games/${product.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-[10px] p-2 transition-colors hover:bg-card hover:text-primary"
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
                    <p className="text-[11px] text-muted-foreground truncate">
                      {product.category?.name ?? (product.productType === "DIRECT_TOPUP" ? "เติมตรง" : "บัตรเติมเงิน")}
                    </p>
                  </div>
                  <ArrowRight className="size-3 text-muted-foreground" />
                </Link>
              ))
            )}
          </div>

          {query.trim() ? (
            <div className="border-t p-2">
              <button
                type="button"
                onClick={handleSubmit}
                className="flex w-full items-center justify-center gap-1.5 rounded-[8px] py-1.5 text-xs font-semibold text-primary hover:bg-card"
              >
                ดูผลการค้นหาทั้งหมดสำหรับ &ldquo;{query}&rdquo;
                <ArrowRight className="size-3" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
