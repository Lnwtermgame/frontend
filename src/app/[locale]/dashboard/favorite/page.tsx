"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { favoriteApi, Favorite } from "@/lib/services/favorite-api";
import { getMinPrice, formatPrice } from "@/lib/utils";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Search,
  ExternalLink,
  Package,
} from "lucide-react";
import { motion } from "@/lib/framer-exports";
import Link from "next/link";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function FavoritePage() {
  const t = useTranslations("Favorites");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const pathname = usePathname();
  const { user, isInitialized } = useAuth();

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFavorites, setFilteredFavorites] = useState<Favorite[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch favorites from API
  useEffect(() => {
    if (isInitialized && user) {
      fetchFavorites();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isInitialized, user]);

  const fetchFavorites = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      const response = await favoriteApi.getFavorites(1, 20, controller.signal);
      if (response.success) {
        setFavorites(response.data);
        setFilteredFavorites(response.data);
      }
    } catch (error: any) {
      if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
        toast.error(t("error_loading"));
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isInitialized && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, router, isInitialized, pathname]);

  // Filter favorites based on search term
  useEffect(() => {
    if (searchTerm) {
      setFilteredFavorites(
        favorites.filter((item) =>
          item.product.name.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      );
    } else {
      setFilteredFavorites(favorites);
    }
  }, [searchTerm, favorites]);

  // Remove item from favorites
  const removeFavorite = async (favoriteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const response = await favoriteApi.removeFavorite(favoriteId);
      if (response.success) {
        toast.success(t("remove_success"));
        setFavorites((prev) => prev.filter((item) => item.id !== favoriteId));
      }
    } catch (error) {
      const message = favoriteApi.getErrorMessage(error);
      toast.error(message || t("remove_failed"));
    }
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#222427] border-t-[var(--site-accent)] rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400 font-medium">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="relative mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 relative flex items-center">
          <span className="w-1.5 h-6 bg-[var(--site-accent)] mr-3 rounded-full"></span>
          {t("title")}
        </h2>
        <p className="text-gray-400 text-sm ml-4 border-l-2 border-site-border pl-3">
          {t("subtitle")}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder={t("search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1A1C1E] border border-site-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--site-accent)] pl-10 transition-all placeholder-gray-500"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        </div>

        <div className="ml-auto text-sm text-gray-400 font-medium">
          {t("found_items", { count: filteredFavorites.length })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 bg-[#222427] border border-site-border rounded-xl shadow-ocean">
          <div className="w-8 h-8 border-3 border-[#1A1C1E] border-t-[var(--site-accent)] rounded-full animate-spin"></div>
        </div>
      ) : filteredFavorites.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredFavorites.map((item) => {
            // Discount is not available in public API
            const maxDiscount = 0;
            const showDiscount = false;

            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -4 }}
                className="bg-[#222427] border border-site-border rounded-xl overflow-hidden group relative flex flex-col shadow-ocean"
              >
                <div className="relative aspect-square border-b border-site-border overflow-hidden bg-[#1A1C1E]">
                  {showDiscount && (
                    <div className="absolute top-2 left-2 z-10 bg-[var(--site-accent)] px-2.5 py-1 text-[10px] font-bold text-white rounded-md">
                      -{maxDiscount}%
                    </div>
                  )}

                  <div className="absolute top-2 right-2 z-10">
                    <button
                      onClick={(e) => removeFavorite(item.id, e)}
                      className="w-8 h-8 bg-black/50 backdrop-blur-sm border border-site-border/50 rounded-full text-white hover:bg-red-500 hover:border-red-500/30 hover:text-white flex items-center justify-center transition-all shadow-sm"
                      title={t("remove_success")}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {item.product.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#1A1C1E] flex items-center justify-center">
                      <Package size={24} className="text-gray-600" />
                    </div>
                  )}
                </div>

                <div className="p-3.5 flex flex-col flex-1">
                  <h3 className="text-white text-sm font-semibold mb-1 line-clamp-1 group-hover:text-[var(--site-accent)] transition-colors">
                    {item.product.name}
                  </h3>
                  <p className="text-[var(--site-accent)] text-xs font-medium mb-3">
                    {item.product.types && item.product.types.length > 0
                      ? `${t("starting_at")} ${formatPrice(getMinPrice(item.product.types))}`
                      : t("view_more")}
                  </p>

                  <div className="mt-auto flex flex-col gap-2">
                    <motion.button
                      onClick={() => toast.success(t("added_to_cart"))}
                      whileHover={{ y: -1 }}
                      whileTap={{ y: 0 }}
                      className="w-full bg-[var(--site-accent)] hover:bg-[var(--site-accent)]/90 text-white py-2 rounded-lg flex items-center justify-center text-xs font-semibold transition-all shadow-[0_0_10px_rgba(103,176,186,0.2)]"
                    >
                      <ShoppingCart size={14} className="mr-1.5" />
                      {t("buy_now")}
                    </motion.button>
                    <Link
                      href={`/games/${item.product.slug}`}
                      className="w-full bg-[#1A1C1E] hover:bg-[#2A2D31] text-white border border-site-border py-2 rounded-lg flex items-center justify-center text-xs font-medium transition-all"
                    >
                      <ExternalLink size={12} className="mr-1.5" />
                      {t("view_more")}
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#222427] border border-site-border rounded-xl shadow-ocean p-8 text-center"
        >
          <div className="w-16 h-16 bg-[#1A1C1E] border border-site-border rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart size={28} className="text-gray-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {t("no_favorites")}
          </h2>
          <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
            {searchTerm
              ? t("no_search_results", { query: searchTerm })
              : t("no_favorites_desc")}
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-2.5 rounded-lg bg-[var(--site-accent)] hover:bg-[var(--site-accent)]/90 text-white font-semibold transition-all shadow-[0_0_15px_rgba(103,176,186,0.3)] text-sm"
          >
            {t("start_shopping")}
          </Link>
        </motion.div>
      )}
    </div>
  );
}
