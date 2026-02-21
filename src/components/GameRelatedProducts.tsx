"use client";

import React, { useState } from "react";
import { motion } from "@/lib/framer-exports";
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Zap,
  ShoppingCart,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export interface RelatedProduct {
  id: string;
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  type: "game" | "card" | "subscription" | "addon" | "bundle";
  region?: string;
  discount?: string;
  tag?: string;
  tagColor?: "blue" | "green" | "purple" | "pink" | "orange";
}

export interface GameRelatedProductsProps {
  title?: string;
  subtitle?: string;
  products: RelatedProduct[];
  type?: "cross-sell" | "up-sell" | "bundle";
  viewAllUrl?: string;
  viewAllText?: string;
  className?: string;
  itemsToShow?: number;
}

export function GameRelatedProducts({
  title = "You may also like",
  subtitle,
  products = [],
  type = "cross-sell",
  viewAllUrl,
  viewAllText = "View all",
  className = "",
  itemsToShow = 4,
}: GameRelatedProductsProps) {
  const [scrollPosition, setScrollPosition] = useState(0);

  // Get title and icon based on type
  const getTitleAndIcon = () => {
    switch (type) {
      case "up-sell":
        return {
          defaultTitle: "Upgrade your experience",
          icon: <Sparkles className="h-5 w-5 text-brutal-pink" />,
        };
      case "bundle":
        return {
          defaultTitle: "Bundle & Save",
          icon: <ShoppingCart className="h-5 w-5 text-brutal-green" />,
        };
      default:
        return {
          defaultTitle: "You may also like",
          icon: <Zap className="h-5 w-5 text-brutal-blue" />,
        };
    }
  };

  const { defaultTitle, icon } = getTitleAndIcon();
  const displayTitle = title || defaultTitle;

  // Get tag color class
  const getTagColorClass = (color?: string) => {
    switch (color) {
      case "blue":
        return "bg-brutal-blue border-black";
      case "green":
        return "bg-brutal-green border-black";
      case "purple":
        return "bg-brutal-purple border-black";
      case "pink":
        return "bg-brutal-pink border-black";
      case "orange":
        return "bg-brutal-yellow border-black";
      default:
        return "bg-brutal-blue border-black";
    }
  };

  // Handle horizontal scrolling
  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById("related-products-container");
    if (container) {
      const scrollAmount = direction === "left" ? -250 : 250;
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setScrollPosition(container.scrollLeft + scrollAmount);
    }
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div className="flex items-center mb-2 sm:mb-0">
          <div
            className="h-8 w-8 flex items-center justify-center mr-3 bg-brutal-yellow border-[2px] border-black"
            style={{ boxShadow: "2px 2px 0 0 #000000" }}
          >
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-black">{displayTitle}</h3>
            {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
          </div>
        </div>

        {viewAllUrl && (
          <Link
            href={viewAllUrl}
            className="text-brutal-blue hover:text-blue-700 transition-colors flex items-center text-sm font-medium"
          >
            {viewAllText}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        )}
      </div>

      {/* Products Slider */}
      <div className="relative">
        {/* Left Scroll Arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute -left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white hover:bg-gray-100 border-[2px] border-black p-2 text-black transition-colors"
          style={{ boxShadow: "3px 3px 0 0 #000000" }}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Products Container */}
        <div
          id="related-products-container"
          className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4 -mx-2 px-2"
          style={{ scrollBehavior: "smooth" }}
        >
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              className="flex-shrink-0 w-[250px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link href={`/games/${product.id}`}>
                <div
                  className="bg-white border-[3px] border-black overflow-hidden group h-full flex flex-col"
                  style={{ boxShadow: "4px 4px 0 0 #000000" }}
                >
                  {/* Product Image */}
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Discount Tag */}
                    {product.discount && (
                      <div
                        className="absolute top-2 right-2 bg-brutal-pink text-black text-xs px-2 py-0.5 font-bold border-[2px] border-black"
                        style={{ boxShadow: "2px 2px 0 0 #000000" }}
                      >
                        {product.discount}
                      </div>
                    )}

                    {/* Custom Tag */}
                    {product.tag && (
                      <div
                        className={`absolute top-2 left-2 ${getTagColorClass(product.tagColor)} text-black text-xs px-2 py-0.5 font-bold border-[2px] border-black`}
                        style={{ boxShadow: "2px 2px 0 0 #000000" }}
                      >
                        {product.tag}
                      </div>
                    )}

                    {/* Region Badge */}
                    {product.region && (
                      <div className="absolute bottom-2 left-2 bg-black text-white text-xs px-2 py-0.5 font-medium border-[2px] border-black">
                        {product.region}
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3 flex flex-col flex-grow">
                    <h4 className="font-medium text-black mb-1 line-clamp-2">
                      {product.title}
                    </h4>

                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div className="flex items-baseline">
                        <span className="text-black font-bold">
                          ฿{product.price?.toFixed(2) ?? "0"}
                        </span>
                        {product.originalPrice && (
                          <span className="text-gray-500 line-through text-xs ml-2">
                            ฿{product.originalPrice?.toFixed(2) ?? "0"}
                          </span>
                        )}
                      </div>

                      <div
                        className={`
                        px-1.5 py-0.5 text-xs font-medium border-[2px] border-black
                        ${
                          product.type === "game"
                            ? "bg-brutal-blue text-black"
                            : product.type === "card"
                              ? "bg-brutal-green text-black"
                              : product.type === "subscription"
                                ? "bg-brutal-purple text-white"
                                : "bg-brutal-yellow text-black"
                        }
                      `}
                      >
                        {product.type}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Right Scroll Arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white hover:bg-gray-100 border-[2px] border-black p-2 text-black transition-colors"
          style={{ boxShadow: "3px 3px 0 0 #000000" }}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Scroll Indicator Dots */}
      <div className="flex justify-center space-x-1 mt-4">
        {[...Array(Math.ceil(products.length / itemsToShow))].map((_, i) => (
          <div
            key={i}
            className={`h-1.5 transition-all duration-300 border-[2px] border-black ${
              i * itemsToShow <= scrollPosition &&
              scrollPosition < (i + 1) * itemsToShow
                ? "w-6 bg-brutal-blue"
                : "w-1.5 bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
