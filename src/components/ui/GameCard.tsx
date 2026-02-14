"use client";

import Link from "next/link";
import Image from "next/image";
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
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn("h-full", className)}
    >
      <Link href={`/games/${slug}`} className="block h-full">
        <Card className="h-full flex flex-col overflow-hidden hover:shadow-[6px_6px_0_0_#000] transition-shadow duration-200">
          {/* Image Container */}
          <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
            {image ? (
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover transition-transform duration-500 hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                No Image
              </div>
            )}
            
            {/* Featured Badge */}
            {isFeatured && (
              <div className="absolute left-2 top-2 bg-brutal-yellow border-2 border-black px-2 py-0.5 text-xs font-bold shadow-[2px_2px_0_0_#000]">
                แนะนำ
              </div>
            )}

            {/* Tags Overlay */}
            {tags && tags.length > 0 && (
              <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap">
                {tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="bg-black text-white text-[10px] px-1.5 py-0.5 font-bold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <CardContent className="flex-1 p-3 space-y-2">
            <h3 className="font-bold text-black text-base line-clamp-1 thai-font" title={title}>
              {title}
            </h3>
            
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-3.5 h-3.5 fill-brutal-yellow text-black" />
              <span className="font-bold">{rating?.toFixed(1) || "0.0"}</span>
              <span className="text-gray-500 text-xs">({reviewCount || 0})</span>
            </div>
          </CardContent>

          {/* Footer / Price */}
          <CardFooter className="p-3 pt-0 mt-auto flex items-center justify-between border-t-2 border-transparent">
            <div className="flex flex-col">
              {originalPrice && (
                <span className="text-xs text-gray-500 line-through">
                  {typeof originalPrice === 'number' ? formatPrice(originalPrice) : originalPrice}
                </span>
              )}
              <span className="text-lg font-black text-brutal-pink">
                {typeof price === 'number' ? formatPrice(price) : price}
              </span>
            </div>
            
            <div className="bg-black text-white p-2 rounded-none hover:bg-gray-800 transition-colors">
              <ShoppingCart size={16} />
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
