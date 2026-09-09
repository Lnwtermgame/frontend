"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useFavorites } from "@/lib/query/hooks";
import { removeFavorite } from "@/lib/api/dashboard";
import { ProductTile } from "@/components/product/product-tile";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pager, DashErrorState, DashEmptyState } from "@/components/dashboard/shared";

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
      <h1 className="text-xl font-bold">{t("favorites")}</h1>

      <div className="mt-5">
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
              <div key={fav.id} className="relative">
                <ProductTile product={fav.product} />
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-1 w-full"
                  disabled={removingId === fav.id}
                  onClick={() => handleRemove(fav.id)}
                >
                  {t("removeFavorite")}
                </Button>
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
