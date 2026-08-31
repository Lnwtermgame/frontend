"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Heart, Share2, Check, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CountryFlag, getCountryFlagCode } from "@/components/ui/country-flag";
import type { GameDetails } from "./types";

// Compact SEAGM-style product header: small square artwork, one-line meta,
// favourite/share actions — no full-width cover banner.
export function ProductHero({
  game,
  isFavorite,
  copied,
  onToggleFavorite,
  onCopyLink,
}: {
  game: GameDetails;
  isFavorite: boolean;
  copied: boolean;
  onToggleFavorite: () => void;
  onCopyLink: () => void;
}) {
  const t = useTranslations("ProductDetail");
  const flagCode = getCountryFlagCode(game.category);

  return (
    <div className="site-card p-4 sm:p-5 flex items-start sm:items-center gap-4 mb-8">
      {/* Square artwork */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden rounded-8 border border-site-border-soft bg-site-raised">
        <Image
          src={
            game.mainImage ||
            game.coverImage ||
            "/images/placeholder-game.svg"
          }
          alt={game.title}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <h1 className="text-lg sm:text-xl font-bold text-site-text leading-tight break-words">
          {game.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2">
          <Badge variant="neutral" className="gap-1.5">
            {flagCode && (
              <CountryFlag
                code={flagCode}
                size="S"
              />
            )}
            {game.category}
          </Badge>

          {/* Social proof — real data only */}
          {typeof game.rating === "number" && game.rating > 0 && (
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-site-text">
              <Star
                size={12}
                className="fill-amber-400 text-amber-400"
                aria-hidden="true"
              />
              {game.rating.toFixed(1)}
              {typeof game.ratingCount === "number" &&
                game.ratingCount > 0 && (
                  <span className="font-normal text-site-dim">
                    ({game.ratingCount})
                  </span>
                )}
            </span>
          )}
          {typeof game.soldCount === "number" && game.soldCount > 0 && (
            <span className="text-[12px] text-site-muted">
              {t("sold_count", { count: game.soldCount })}
            </span>
          )}
        </div>

        <p className="text-[12px] text-site-muted mt-1.5">
          {t("by_developer", {
            developer: game.publisher || game.developer || t("unknown"),
          })}{" "}
          ·{" "}
          <Link
            href="/refund-policy"
            className="hover:text-site-text transition-colors underline underline-offset-2"
          >
            {t("refund_label")}
          </Link>
        </p>
      </div>

      {/* Favourite / share */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleFavorite}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? t("remove_favorite") : t("add_favorite")}
          className={`w-9 h-9 ${isFavorite ? "text-status-danger border-status-danger/30 bg-status-danger/10" : "text-site-muted"}`}
        >
          <Heart size={18} className={isFavorite ? "fill-current" : ""} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onCopyLink}
          aria-label={t("share_link")}
          className={`w-9 h-9 ${copied ? "text-status-success border-status-success/30 bg-status-success/10" : "text-site-muted"}`}
        >
          {copied ? <Check size={18} /> : <Share2 size={18} />}
        </Button>
      </div>
    </div>
  );
}
