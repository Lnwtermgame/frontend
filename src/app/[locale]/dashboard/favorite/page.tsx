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
import Link from "next/link";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonListRow } from "@/components/ui/Skeleton";

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
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-8" />
          <p className="text-site-muted font-medium">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader level={1} title={t("title")} />

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder={t("search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="site-input w-full pl-10"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-site-dim" />
        </div>

        <div className="ml-auto text-xs text-site-muted font-medium">
          {t("found_items", { count: filteredFavorites.length })}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <SkeletonListRow key={i} />)}
        </div>
      ) : filteredFavorites.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredFavorites.map((item) => {
            // Discount is not available in public API
            const maxDiscount = 0;
            const showDiscount = false;

            return (
              <div
                key={item.id}
                className="site-card overflow-hidden group relative flex flex-col"
              >
                <div className="relative aspect-square border-b border-site-border-soft overflow-hidden bg-site-raised">
                  {showDiscount && (
                    <div className="absolute top-2 left-2 z-10 bg-site-accent px-2 py-0.5 text-[10px] font-bold text-site-bg rounded-4">
                      -{maxDiscount}%
                    </div>
                  )}

                  <div className="absolute top-2 right-2 z-10">
                    <button
                      onClick={(e) => removeFavorite(item.id, e)}
                      className="w-7 h-7 bg-site-bg/50 border border-site-border-soft rounded-4 text-site-text hover:bg-status-danger hover:border-status-danger/20 hover:text-site-bg flex items-center justify-center transition-colors"
                      title={t("remove_success")}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {item.product.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-site-raised flex items-center justify-center">
                      <Package size={24} className="text-site-dim" />
                    </div>
                  )}
                </div>

                <div className="p-3 flex flex-col flex-1">
                  <h3 className="text-site-text text-sm font-semibold mb-1 line-clamp-1 group-hover:text-site-accent transition-colors">
                    {item.product.name}
                  </h3>
                  <p className="text-site-accent text-xs font-medium mb-3">
                    {item.product.types && item.product.types.length > 0
                      ? `${t("starting_at")} ${formatPrice(getMinPrice(item.product.types))}`
                      : t("view_more")}
                  </p>

                  <div className="mt-auto flex flex-col gap-2">
                    <button
                      onClick={() => toast.success(t("added_to_cart"))}
                      className="site-btn w-full py-2 rounded-6 flex items-center justify-center text-xs"
                    >
                      <ShoppingCart size={14} className="mr-1.5" />
                      {t("buy_now")}
                    </button>
                    <Link
                      href={`/games/${item.product.slug}`}
                      className="w-full bg-site-surface hover:bg-site-raised text-site-text border border-site-border-soft py-2 rounded-6 flex items-center justify-center text-xs font-medium transition-colors"
                    >
                      <ExternalLink size={12} className="mr-1.5" />
                      {t("view_more")}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="site-card p-8 text-center">
          <EmptyState icon={Heart} message={
            searchTerm
              ? t("no_search_results", { query: searchTerm })
              : t("no_favorites_desc")
          } />
          <Link
            href="/"
            className="site-btn inline-flex mt-4"
          >
            {t("start_shopping")}
          </Link>
        </div>
      )}
    </div>
  );
}
