"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Star, ShoppingCart } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "./Button";
import { Card, CardContent, CardFooter } from "./Card";
import { motion } from "framer-motion";

export interface GameCardProps {
  id: string;
  slug: string;
  title: string;
  image: string;
  price: number | string;
  originalPrice?: number | string;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  isFeatured?: boolean;
  className?: string;
}

export function GameCard({
  id,
  slug,
  title,
  image,
  price,
  originalPrice,
  rating,
  reviewCount,
  tags,
  isFeatured,
  className,
}: GameCardProps) {
  const tProducts = useTranslations("Products");
  return (
    <div
      className={cn("h-full", className)}
    >
      <Link href={`/games/${slug}`} className="block h-full">
        <Card className="h-full flex flex-col overflow-hidden hover:shadow-gaming-card-hover transition-shadow duration-200">
          {/* Image Container */}
          <div className="relative aspect-[4/3] w-full bg-gaming-dark overflow-hidden">
            {image ? (
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover transition-transform duration-500 hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-500">
                No Image
              </div>
            )}

            {isFeatured && (
              <div className="absolute left-2 top-2 bg-gaming-btn text-white border border-blue-500 px-2 py-0.5 text-xs font-bold rounded-full">
                {tProducts("recommended")}
              </div>
            )}

            {/* Tags Overlay */}
            {tags && tags.length > 0 && (
              <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap">
                {tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="bg-black/70 text-white text-[10px] px-1.5 py-0.5 font-bold rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <CardContent className="flex-1 p-3 space-y-2">
            <h3
              className="font-bold text-white text-base line-clamp-1 thai-font"
              title={title}
            >
              {title}
            </h3>

            <div className="flex items-center gap-1 text-sm">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold">{rating?.toFixed(1) || "0.0"}</span>
              <span className="text-zinc-500 text-xs">
                ({reviewCount || 0})
              </span>
            </div>
          </CardContent>

          {/* Footer / Price */}
          <CardFooter className="p-3 pt-0 mt-auto flex items-center justify-between border-t-2 border-transparent">
            <div className="flex flex-col">
              {originalPrice && (
                <span className="text-xs text-zinc-500 line-through">
                  {typeof originalPrice === "number"
                    ? formatPrice(originalPrice)
                    : originalPrice}
                </span>
              )}
              <span className="text-lg font-black text-blue-400">
                {typeof price === "number" ? formatPrice(price) : price}
              </span>
            </div>

            <div className="bg-gaming-btn text-white p-2 rounded-lg hover:shadow-gaming-btn transition-all">
              <ShoppingCart size={16} />
            </div>
          </CardFooter>
        </Card>
      </Link>
    </div>
  );
}
