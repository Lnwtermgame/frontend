"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useFavorites } from "@/lib/query/hooks";
import { removeFavorite } from "@/lib/api/dashboard";
import { ProductTile } from "@/components/product/product-tile";
import { Skeleton } from "@/components/ui/skeleton";
import { Pager, DashErrorState, DashEmptyState, DashPageHead } from "@/components/dashboard/shared";

export default function DashboardFavoritesPage() {
  const t = useTranslations("dashboard");
  const [page, setPage] = useState(1);
  const favorites = useFavorites({ page, limit: 12 });
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (favId: string) => {
    setRemovingId(favId);
    try {
      await removeFavorite(favId);
      favorites.refetch();
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div>
      <DashPageHead title={t("favorites")} description={t("favoritesDesc")} />

      <div className="mt-3">
        {favorites.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-[14px]" />
            ))}
          </div>
        ) : favorites.isError ? (
          <DashErrorState onRetry={() => favorites.refetch()} />
        ) : !favorites.data?.data.length ? (
          <DashEmptyState title={t("emptyFavorites")} description={t("emptyFavoritesDesc")} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {favorites.data.data.map((fav) => (
              <div key={fav.id} className="group relative">
                <ProductTile product={fav.product} />
                <button
                  type="button"
                  aria-label={t("removeFavorite")}
                  disabled={removingId === fav.id}
                  onClick={() => handleRemove(fav.id)}
                  className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/60 text-white/90 opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/80 hover:text-white focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-50"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {!favorites.isLoading && !favorites.isError && favorites.data?.meta ? (
        <Pager
          page={favorites.data.meta.page}
          totalPages={favorites.data.meta.totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      ) : null}
    </div>
  );
}
