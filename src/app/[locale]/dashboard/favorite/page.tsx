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
          <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-gray-600 text-sm">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="relative mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-1 relative flex items-center">
          <span className="w-1.5 h-4 bg-brutal-pink mr-2"></span>
          {t("title")}
        </h2>
        <p className="text-gray-600 text-xs relative">
          {t("subtitle")}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder={t("search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white px-3 py-1.5 text-xs text-black border-[2px] border-gray-300 focus:outline-none focus:border-black pl-8 transition-all"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        </div>

        <div className="ml-auto text-xs text-gray-600 font-bold">
          {t("found_items", { count: filteredFavorites.length })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredFavorites.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredFavorites.map((item) => {
            // Discount is not available in public API
            const maxDiscount = 0;
            const showDiscount = false;

            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -4 }}
                className="bg-white border-[3px] border-black overflow-hidden group relative flex flex-col"
                style={{ boxShadow: "4px 4px 0 0 #000000" }}
              >
                <div className="relative aspect-square border-b-[3px] border-black overflow-hidden">
                  {showDiscount && (
                    <div
                      className="absolute top-2 left-2 z-10 bg-brutal-pink px-2 py-1 text-[10px] font-bold text-white border-[2px] border-black"
                      style={{ boxShadow: "2px 2px 0 0 #000000" }}
                    >
                      -{maxDiscount}%
                    </div>
                  )}

                  <div className="absolute top-2 right-2 z-10">
                    <button
                      onClick={(e) => removeFavorite(item.id, e)}
                      className="w-7 h-7 bg-white border-[2px] border-black text-black hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                      style={{ boxShadow: "2px 2px 0 0 #000000" }}
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
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Package size={24} className="text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="p-2.5 flex flex-col flex-1">
                  <h3 className="text-black text-xs font-bold mb-1 line-clamp-1 group-hover:text-brutal-blue transition-colors">
                    {item.product.name}
                  </h3>
                  <p className="text-gray-500 text-xs font-bold mb-2 text-right">
                    {item.product.types && item.product.types.length > 0
                      ? `${t("starting_at")} ${formatPrice(getMinPrice(item.product.types))}`
                      : t("view_more")}
                  </p>

                  <div className="mt-auto flex gap-2">
                    <Link
                      href={`/games/${item.product.slug}`}
                      className="flex-1 bg-white hover:bg-gray-50 text-black border-[2px] border-black py-1 flex items-center justify-center text-[10px] font-bold transition-all"
                      style={{ boxShadow: "2px 2px 0 0 #000000" }}
                    >
                      <ExternalLink size={10} className="mr-1" />
                      {t("view_more")}
                    </Link>
                    <motion.button
                      onClick={() => toast.success(t("added_to_cart"))}
                      whileHover={{ y: -1 }}
                      whileTap={{ y: 0 }}
                      className="flex-1 bg-brutal-blue hover:bg-brutal-blue/90 text-white border-[2px] border-black py-1 flex items-center justify-center text-[10px] font-bold transition-all"
                      style={{ boxShadow: "2px 2px 0 0 #000000" }}
                    >
                      <ShoppingCart size={10} className="mr-1" />
                      {t("buy_now")}
                    </motion.button>
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
          className="bg-white border-[3px] border-black p-6 text-center"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <div className="w-12 h-12 bg-gray-100 border-[3px] border-black flex items-center justify-center mx-auto mb-3">
            <Heart size={24} className="text-gray-400" />
          </div>
          <h2 className="text-base font-bold text-black mb-1">
            {t("no_favorites")}
          </h2>
          <p className="text-gray-600 text-xs max-w-md mx-auto mb-4 font-bold">
            {searchTerm
              ? t("no_search_results", { query: searchTerm })
              : t("no_favorites_desc")}
          </p>
          <Link
            href="/"
            className="bg-black hover:bg-gray-800 text-white px-4 py-2 border-[3px] border-black text-xs font-bold inline-flex items-center transition-all hover:-translate-y-0.5"
            style={{ boxShadow: "3px 3px 0 0 #000000" }}
          >
            {t("start_shopping")}
          </Link>
        </motion.div>
      )}
    </div>
  );
}
