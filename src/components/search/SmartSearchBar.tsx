"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, Gamepad2, Tag, Clock } from "lucide-react";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnClickOutside } from "@/lib/hooks/use-on-click-outside";
import { productApi, Product } from "@/lib/services/product-api";

// Types
export interface SearchResult {
  id: string;
  type: 'game' | 'card' | 'category' | 'coupon' | 'history';
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
      type: 'game' as const,
      title: product.name,
      subtitle: product.category?.name
        ? `${product.category.name} • ${product.gameDetails?.publisher || 'Game Store'}`
        : product.gameDetails?.publisher || 'Game Store',
      image: product.imageUrl,
      url: `/games/${product.slug || product.id}`,
    }));
  } catch (error) {
    console.error('Search API error:', error);
    return [];
  }
};

// Recent searches storage
const saveRecentSearch = (query: string) => {
  if (typeof window === 'undefined' || !query.trim()) return;

  try {
    const recentSearches = JSON.parse(window.localStorage.getItem('recentSearches') || '[]');

    // Add to front, remove duplicates, limit to 5
    const updatedSearches = [
      query,
      ...recentSearches.filter((s: string) => s !== query)
    ].slice(0, 5);

    window.localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  } catch (error) {
    console.error('Failed to save recent search', error);
  }
};

const getRecentSearches = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem('recentSearches') || '[]');
  } catch (error) {
    console.error('Failed to get recent searches', error);
    return [];
  }
};

export function SmartSearchBar({
  placeholder = "ค้นหาเกม บัตรเติมเงิน และอื่นๆ…",
  className = "",
  onSearch,
  maxResults = 5
}: SmartSearchProps) {
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
  useOnClickOutside(searchRef as React.RefObject<HTMLDivElement>, () => setIsDropdownOpen(false));

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
      console.error('Search error:', error);
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
      case 'ArrowDown':
        e.preventDefault();
        setSelectedResultIndex(prev => (prev < resultCount - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedResultIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
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
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        break;
    }
  };

  // Result icon based type (decorative)
  const getIconForResult = (type: string) => {
    switch (type) {
      case 'game':
        return <Gamepad2 size={16} className="text-mali-blue-light" aria-hidden="true" />;
      case 'coupon':
        return <Tag size={16} className="text-mali-purple" aria-hidden="true" />;
      case 'history':
        return <Clock size={16} className="text-mali-text-secondary" aria-hidden="true" />;
      default:
        return <Search size={16} className="text-mali-blue-light" aria-hidden="true" />;
    }
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
            {isLoading ? (
              <Loader2 size={18} className="text-mali-blue/70 animate-spin" />
            ) : (
              <Search size={18} className="text-mali-blue/70" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            autoComplete="off"
            aria-label="ค้นหาเกม"
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
            className="bg-mali-navy/80 w-full border border-mali-blue/20 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-mali-text-secondary focus:outline-none focus:ring-2 focus:ring-mali-blue-accent focus:border-mali-blue-accent"
            aria-expanded={isDropdownOpen}
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              aria-label="ล้างการค้นหา"
            >
              <X size={18} className="text-mali-text-secondary hover:text-white" />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown Results */}
      <AnimatePresence>
        {isDropdownOpen && (query.trim() || recentSearches.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute mt-2 w-full bg-mali-card border border-mali-blue/20 rounded-lg shadow-lg shadow-black/30 z-50 overflow-hidden"
          >
            <div className="p-1 max-h-80 overflow-y-auto">
              {/* Loading state */}
              {isLoading && query.trim() && (
                <div className="p-4 flex items-center justify-center">
                  <Loader2 size={24} className="text-mali-blue animate-spin" />
                </div>
              )}

              {/* No results state */}
              {!isLoading && query.trim() && results.length === 0 && (
                <div className="p-4 text-center">
                  <p className="text-mali-text-secondary text-sm">ไม่พบผลลัพธ์สำหรับ "{query}"</p>
                </div>
              )}

              {/* Search Results */}
              {!isLoading && results.length > 0 && (
                <div className="py-1">
                  <div className="px-3 py-1.5 text-xs text-mali-text-secondary">ผลการค้นหา</div>
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
                        className={`px-3 py-2 flex items-center hover:bg-mali-blue/20 ${index === selectedResultIndex ? 'bg-mali-blue/20' : ''
                          } rounded-md mx-1 cursor-pointer transition-colors`}
                      >
                        {result.image ? (
                          <div className="h-8 w-8 rounded overflow-hidden mr-3 bg-mali-navy flex-shrink-0">
                            <img src={result.image} alt={result.title} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-mali-blue/20 flex items-center justify-center mr-3 flex-shrink-0" aria-hidden="true">
                            {getIconForResult(result.type)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white font-medium truncate">{result.title}</div>
                          {result.subtitle && (
                            <div className="text-xs text-mali-text-secondary truncate">{result.subtitle}</div>
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
                  <div className="px-3 py-1.5 text-xs text-mali-text-secondary">ค้นหาล่าสุด</div>
                  {recentSearches.map((search, index) => (
                    <div
                      key={`recent-${index}`}
                      className="px-3 py-2 hover:bg-mali-blue/20 rounded-md mx-1 cursor-pointer transition-colors flex items-center justify-between"
                      onClick={() => {
                        setQuery(search);
                        performSearch(search);
                      }}
                    >
                      <div className="flex items-center">
                        <Clock size={16} className="text-mali-text-secondary mr-2" aria-hidden="true" />
                        <span className="text-sm text-white">{search}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newRecentSearches = recentSearches.filter((_, i) => i !== index);
                          setRecentSearches(newRecentSearches);
                          if (typeof window !== 'undefined' && window.localStorage) {
                            window.localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
                          }
                        }}
                        className="text-mali-text-secondary hover:text-white"
                        aria-label="ลบออกจากประวัติการค้นหา"
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
              <div className="px-3 py-2 border-t border-mali-blue/20">
                <button
                  type="button"
                  onClick={() => {
                    saveRecentSearch(query);
                    setRecentSearches(getRecentSearches());
                    router.push(`/games?search=${encodeURIComponent(query)}`);
                    setIsDropdownOpen(false);
                  }}
                  className="text-sm text-mali-blue-accent hover:text-mali-blue-light w-full text-center"
                >
                  ดูผลลัพธ์ทั้งหมดสำหรับ "{query}"
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 
