"use client";

import Image from "next/image";
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

  const screenshots = (game.screenshots ?? []).slice(0, 8);

  const facts = [
    {
      icon: Package,
      label: t("developer"),
      value: game.developer || t("unknown"),
    },
    {
      icon: Award,
      label: t("publisher"),
      value: game.publisher || t("unknown"),
    },
    ...(game.releaseDate
      ? [
          {
            icon: Calendar,
            label: t("release_date"),
            value: new Date(game.releaseDate).toLocaleDateString(locale),
          },
        ]
      : []),
    {
      icon: Smartphone,
      label: t("platforms"),
      value:
        game.platforms.length > 0 ? game.platforms.join(", ") : t("unknown"),
    },
  ];

  return (
    <div className="site-card overflow-hidden mb-8">
      <div className="py-3.5 px-5 md:px-6 text-sm font-bold text-site-text flex items-center justify-between w-full border-b border-site-border-soft">
        <span className="flex items-center">
          <Info size={18} className="mr-2 text-site-accent" aria-hidden="true" />
          {t("game_info")}
        </span>
        {screenshots.length > 0 && (
          <span className="hidden sm:block text-xs font-medium text-site-dim">
            {t("screenshots_hint")}
          </span>
        )}
      </div>

      <div className="p-5 md:p-6 space-y-6">
        {/* Media rail — horizontal screenshot scroller */}
        {screenshots.length > 0 && (
          <div
            className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1"
            role="list"
            aria-label={t("game_info")}
          >
            {screenshots.map((src, i) => (
              <div
                key={src}
                role="listitem"
                className="relative shrink-0 w-[220px] sm:w-[260px] aspect-video rounded-lg overflow-hidden border border-site-border-soft bg-site-raised"
              >
                <Image
                  src={src}
                  alt={`${game.title} — ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 220px, 260px"
                  className="object-cover"
                />
                <span className="absolute bottom-1.5 right-1.5 text-[10px] leading-none text-white/70 bg-black/50 rounded-full px-2 py-1 backdrop-blur-sm">
                  {i + 1} / {screenshots.length}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Metadata pills */}
        <div className="flex flex-wrap gap-2">
          {facts.map(({ icon: Icon, label, value }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full bg-site-raised border border-site-border-soft px-3.5 py-1.5 text-xs font-semibold text-site-text"
            >
              <Icon
                size={13}
                className="text-site-accent shrink-0"
                aria-hidden="true"
              />
              <span className="text-site-dim font-medium">{label}</span>
              {value}
            </span>
          ))}
        </div>

        <ProductDescription
          description={game.longDescription || game.description}
        />
      </div>
    </div>
  );
}
