"use client";

import { Info, Package, Award, Calendar, Smartphone } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import ProductDescription from "@/components/products/ProductDescription";
import type { GameDetails } from "./types";

export function ProductInfoPanel({
  game,
}: {
  game: GameDetails;
}) {
  const t = useTranslations("ProductDetail");
  const locale = useLocale();

  return (
    <div className="site-card overflow-hidden mb-8">
      <div className="py-3.5 px-5 md:px-6 text-sm font-bold text-site-text flex items-center w-full border-b-2 border-site-accent uppercase tracking-wide">
        <Info size={18} className="mr-2 text-site-accent" aria-hidden="true" />
        {t("game_info")}
      </div>

      <div className="p-5 md:p-6 space-y-6">
        <ProductDescription
          description={game.longDescription || game.description}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-site-surface border border-site-border-soft p-4 rounded-8">
            <h4 className="text-site-muted font-medium mb-2 flex items-center text-xs uppercase tracking-wider">
              <Package className="mr-2" size={16} />
              {t("developer")}
            </h4>
            <p className="text-site-text font-medium">
              {game.developer || t("unknown")}
            </p>
          </div>

          <div className="bg-site-surface border border-site-border-soft p-4 rounded-8">
            <h4 className="text-site-muted font-medium mb-2 flex items-center text-xs uppercase tracking-wider">
              <Award className="mr-2" size={16} />
              {t("publisher")}
            </h4>
            <p className="text-site-text font-medium">
              {game.publisher || t("unknown")}
            </p>
          </div>

          {game.releaseDate && (
            <div className="bg-site-surface border border-site-border-soft p-4 rounded-8">
              <h4 className="text-site-muted font-medium mb-2 flex items-center text-xs uppercase tracking-wider">
                <Calendar className="mr-2" size={16} />
                {t("release_date")}
              </h4>
              <p className="text-site-text font-medium">
                {new Date(game.releaseDate).toLocaleDateString(locale)}
              </p>
            </div>
          )}

          <div className="bg-site-surface border border-site-border-soft p-4 rounded-8">
            <h4 className="text-site-muted font-medium mb-2 flex items-center text-xs uppercase tracking-wider">
              <Smartphone className="mr-2" size={16} />
              {t("platforms")}
            </h4>
            <p className="text-site-text font-medium">
              {game.platforms.length > 0
                ? game.platforms.join(", ")
                : t("unknown")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
