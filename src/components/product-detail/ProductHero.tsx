"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Share2, Check, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CountryFlag, getCountryFlagCode } from "@/components/ui/country-flag";
import type { GameDetails } from "./types";

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
    <div className="site-card p-5 space-y-4">
      {/* Cover image */}
      <div className="relative w-full overflow-hidden rounded-8 border border-site-border-soft">
        <Image
          src={
            game.coverImage ||
            (game.screenshots && game.screenshots.length > 0
              ? game.screenshots[0]
              : game.mainImage) ||
            "/images/placeholder-game.svg"
          }
          alt={game.title}
          width={800}
          height={400}
          className="w-full h-auto object-cover"
          sizes="(max-width: 768px) 100vw, 700px"
        />
      </div>

      {/* Title row with favourite/share actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-site-text leading-tight">
            {game.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="neutral" className="gap-1.5">
              {flagCode && (
                <CountryFlag
                  code={flagCode}
                  size="S"
                />
              )}
              {game.category}
            </Badge>

            {/* Social proof — SEAGM-style rating + sold count (real data only) */}
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

          <p className="text-[13px] text-site-muted mt-2">
            {t("by_developer", {
              developer: game.publisher || game.developer || t("unknown"),
            })}{" "}
            ·{" "}
            <Link
              href="/refund"
              className="hover:text-site-text transition-colors underline underline-offset-2"
            >
              {t("refund_label")}
            </Link>
          </p>
        </div>

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

      {/* Short description */}
      <p className="text-[13px] text-site-muted leading-relaxed line-clamp-3">
        {game.shortDescription || game.description}
      </p>
    </div>
  );
}
