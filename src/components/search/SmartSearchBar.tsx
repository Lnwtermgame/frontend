"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, Gamepad2, Tag, Clock } from "lucide-react";
import { motion } from "@/lib/framer-exports";
import { Link, useRouter } from "@/i18n/routing";
import { useOnClickOutside } from "@/lib/hooks/use-on-click-outside";
import { productApi, Product } from "@/lib/services/product-api";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

// Types
export interface SearchResult {
  id: string;
  type: "game" | "card" | "category" | "coupon" | "history";
  title: string;
  subtitle?: string;
  image?: string;
  url: string;
}

export interface SmartSearchProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
  maxResults?: number;
}

// Search products using the real API
const searchAPI = async (query: string): Promise<SearchResult[]> => {
  if (!query.trim()) return [];

  try {
    const response = await productApi.getProducts({
      search: query,
      isActive: true,
      limit: 8,
    });

    if (!response.success) {
      return [];
    }

    return response.data.map((product: Product) => ({
      id: product.id,
      type: "game" as const,
      title: product.name,
      subtitle: product.category?.name
        ? `${product.category.name} • ${product.gameDetails?.publisher || "Game Store"}`
        : product.gameDetails?.publisher || "Game Store",
      image: product.imageUrl,
      url: `/games/${product.slug || product.id}`,
    }));
  } catch (error) {
    console.error("Search API error:", error);
    return [];
  }
};

// Recent searches storage
const saveRecentSearch = (query: string) => {
  if (typeof window === "undefined" || !query.trim()) return;

  try {
    const recentSearches = JSON.parse(
      window.localStorage.getItem("recentSearches") || "[]",
    );

    // Add to front, remove duplicates, limit to 5
    const updatedSearches = [
      query,
      ...recentSearches.filter((s: string) => s !== query),
    ].slice(0, 5);

    window.localStorage.setItem(
      "recentSearches",
      JSON.stringify(updatedSearches),
    );
  } catch (error) {
    console.error("Failed to save recent search", error);
  }
};

const getRecentSearches = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem("recentSearches") || "[]");
  } catch (error) {
    console.error("Failed to get recent searches", error);
    return [];
  }
};

export function SmartSearchBar({
  placeholder,
  className = "",
  onSearch,
  maxResults = 5,
}: SmartSearchProps) {
  const t = useTranslations("Search");
  const actualPlaceholder = placeholder || t("placeholder_advanced");

  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Handle outside click to close dropdown
  useOnClickOutside(searchRef as React.RefObject<HTMLDivElement>, () =>
    setIsDropdownOpen(false),
  );

  // Search function
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await searchAPI(searchQuery);
      setResults(searchResults.slice(0, maxResults));
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, maxResults]);

  // Clear search
  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setSelectedResultIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (query.trim()) {
      saveRecentSearch(query);
      setRecentSearches(getRecentSearches());

      if (onSearch) {
        onSearch(query);
      } else {
        router.push(`/games?search=${encodeURIComponent(query)}`);
      }

      setIsDropdownOpen(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If dropdown is not open, don't handle special keys
    if (!isDropdownOpen) return;

    const resultCount = results.length;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedResultIndex((prev) =>
          prev < resultCount - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedResultIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();

        if (selectedResultIndex >= 0 && selectedResultIndex < resultCount) {
          const selectedResult = results[selectedResultIndex];
          saveRecentSearch(query);
          setRecentSearches(getRecentSearches());
          router.push(selectedResult.url);
          setIsDropdownOpen(false);
        } else {
          handleSubmit(e);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsDropdownOpen(false);
        break;
    }
  };

  // Result icon based type (decorative)
  const getIconForResult = (type: string) => {
    switch (type) {
      case "game":
        return (
          <Gamepad2 size={16} className="text-brutal-pink" aria-hidden="true" />
        );
      case "coupon":
        return (
          <Tag size={16} className="text-brutal-yellow" aria-hidden="true" />
        );
      case "history":
        return <Clock size={16} className="text-gray-400" aria-hidden="true" />;
      default:
        return (
          <Search size={16} className="text-gray-400" aria-hidden="true" />
        );
    }
  };

  return (
    <div className={cn("relative", className)} ref={searchRef}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div
            className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
            aria-hidden="true"
          >
            {isLoading ? (
              <Loader2 size={18} className="text-gray-400 animate-spin" />
            ) : (
              <Search size={18} className="text-gray-400" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder={actualPlaceholder}
            autoComplete="off"
            aria-label={t("aria_label_search")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsDropdownOpen(true);
              setSelectedResultIndex(-1);
            }}
            onClick={() => {
              if (query.trim() || recentSearches.length > 0) {
                setIsDropdownOpen(true);
              }
            }}
            onFocus={() => {
              if (query.trim() || recentSearches.length > 0) {
                setIsDropdownOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            className="bg-white w-full border-[2px] border-gray-300 rounded-xl pl-11 pr-10 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black transition-all"
            aria-expanded={isDropdownOpen}
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
              aria-label={t("aria_label_clear")}
            >
              <X
                size={18}
                className="text-gray-400 hover:text-black transition-colors"
              />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown Results */}
      {isDropdownOpen && (query.trim() || recentSearches.length > 0) && (
        <div
          className="absolute mt-2 w-full bg-white border-[3px] border-black rounded-xl z-50 overflow-hidden transition-opacity duration-200"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <div className="p-1 max-h-80 overflow-y-auto">
            {/* Loading state */}
            {isLoading && query.trim() && (
              <div className="p-4 flex items-center justify-center">
                <Loader2
                  size={24}
                  className="text-brutal-pink animate-spin"
                />
              </div>
            )}

            {/* No results state */}
            {!isLoading && query.trim() && results.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-gray-500 text-sm thai-font">
                  {t("no_results_for", { query })}
                </p>
              </div>
            )}

            {/* Search Results */}
            {!isLoading && results.length > 0 && (
              <div className="py-1">
                <div className="px-3 py-1.5 text-xs text-gray-500 font-bold thai-font">
                  {t("search_results")}
                </div>
                {results.map((result, index) => (
                  <Link
                    key={result.id}
                    href={result.url}
                    onClick={() => {
                      saveRecentSearch(query);
                      setRecentSearches(getRecentSearches());
                      setIsDropdownOpen(false);
                    }}
                  >
                    <div
                      className={cn(
                        "px-3 py-2 flex items-center hover:bg-brutal-yellow/30 rounded-lg mx-1 cursor-pointer transition-colors",
                        index === selectedResultIndex &&
                        "bg-brutal-yellow/30",
                      )}
                    >
                      {result.image ? (
                        <div className="h-10 w-10 rounded-lg overflow-hidden mr-3 bg-gray-100 flex-shrink-0 border-[2px] border-black">
                          <img
                            src={result.image}
                            alt={result.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className="h-10 w-10 rounded-lg bg-brutal-gray border-[2px] border-black flex items-center justify-center mr-3 flex-shrink-0"
                          aria-hidden="true"
                        >
                          {getIconForResult(result.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-black font-bold truncate thai-font">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="text-xs text-gray-500 truncate">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {!query.trim() && recentSearches.length > 0 && (
              <div className="py-1">
                <div className="px-3 py-1.5 text-xs text-gray-500 font-bold thai-font">
                  {t("recent_searches")}
                </div>
                {recentSearches.map((search, index) => (
                  <div
                    key={`recent-${index}`}
                    className="px-3 py-2 hover:bg-brutal-yellow/30 rounded-lg mx-1 cursor-pointer transition-colors flex items-center justify-between"
                    onClick={() => {
                      setQuery(search);
                      performSearch(search);
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-brutal-gray border-[2px] border-black flex items-center justify-center mr-2">
                        <Clock
                          size={14}
                          className="text-gray-500"
                          aria-hidden="true"
                        />
                      </div>
                      <span className="text-sm text-black font-medium">
                        {search}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newRecentSearches = recentSearches.filter(
                          (_, i) => i !== index,
                        );
                        setRecentSearches(newRecentSearches);
                        if (
                          typeof window !== "undefined" &&
                          window.localStorage
                        ) {
                          window.localStorage.setItem(
                            "recentSearches",
                            JSON.stringify(newRecentSearches),
                          );
                        }
                      }}
                      className="text-gray-400 hover:text-brutal-pink transition-colors"
                      aria-label={t("aria_label_remove_history")}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Show all results action */}
          {query.trim() && results.length > 0 && (
            <div className="px-3 py-2 border-t-[2px] border-gray-200">
              <button
                type="button"
                onClick={() => {
                  saveRecentSearch(query);
                  setRecentSearches(getRecentSearches());
                  router.push(`/games?search=${encodeURIComponent(query)}`);
                  setIsDropdownOpen(false);
                }}
                className="text-sm text-black hover:text-brutal-pink font-bold w-full text-center thai-font transition-colors"
              >
                {t("view_all_results_for", { query })}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
