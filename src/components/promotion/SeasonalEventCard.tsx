"use client";

import React from "react";
import { motion } from "@/lib/framer-exports";
import { Calendar, Clock, Tag, ArrowRight, Gift } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export interface SeasonalEventProps {
  id: string;
  title: string;
  description: string;
  image: string;
  startDate: string;
  endDate: string;
  type: "cashback" | "discount" | "bonus" | "special";
  discount?: string;
  discountColor?: "blue" | "purple" | "green" | "pink";
  games?: string[];
  featured?: boolean;
  href?: string;
  className?: string;
}

export function SeasonalEventCard({
  id,
  title,
  description,
  image,
  startDate,
  endDate,
  type,
  discount,
  discountColor = "blue",
  games = [],
  featured = false,
  href = `/special-events/${id}`,
  className = "",
}: SeasonalEventProps) {
  // Format the date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Calculate days remaining
  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const currentDate = new Date();
    const diffTime = end.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Get discount badge color
  const getBadgeColor = () => {
    switch (discountColor) {
      case "blue":
        return "bg-brutal-blue";
      case "purple":
        return "bg-purple-400";
      case "green":
        return "bg-brutal-green";
      case "pink":
        return "bg-brutal-pink";
      default:
        return "bg-brutal-yellow";
    }
  };

  // Get event type icon
  const getEventTypeIcon = () => {
    switch (type) {
      case "cashback":
        return <Tag className="h-3 w-3" />;
      case "discount":
        return <Tag className="h-3 w-3" />;
      case "bonus":
        return <Gift className="h-3 w-3" />;
      case "special":
        return <Gift className="h-3 w-3" />;
      default:
        return <Tag className="h-3 w-3" />;
    }
  };

  // Style variations based on featured status
  const cardLayout = featured ? "flex flex-col sm:flex-row" : "flex flex-col";

  const imageContainerClass = featured
    ? "sm:w-1/2 relative"
    : "w-full relative";

  const contentContainerClass = featured
    ? "p-3 sm:p-4 sm:w-1/2 flex flex-col"
    : "p-3 flex flex-col";

  return (
    <motion.div
      className={`bg-white border-2 border-black overflow-hidden relative group ${className}`}
      style={{ boxShadow: "3px 3px 0 0 #000000" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{
        y: -2,
        boxShadow: "5px 5px 0 0 #000000",
      }}
    >
      <div className={cardLayout}>
        <div className={imageContainerClass}>
          <div
            className={`${featured ? "aspect-[16/9] sm:aspect-auto sm:h-full" : "aspect-video"} relative`}
          >
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Floating discount badge */}
          {discount && (
            <div
              className={`absolute top-2 right-2 ${getBadgeColor()} text-black px-2 py-1 font-black text-sm border-2 border-black`}
              style={{ boxShadow: "2px 2px 0 0 #000000" }}
            >
              {discount}
            </div>
          )}

          {/* Event type badge */}
          <div className="absolute top-2 left-2 bg-black text-white px-2 py-0.5 flex items-center text-xs font-bold border-2 border-black">
            {getEventTypeIcon()}
            <span className="ml-1 capitalize thai-font">{type}</span>
          </div>
        </div>

        <div className={contentContainerClass}>
          <h3 className="text-base font-black text-black mb-1 thai-font line-clamp-1">
            {title}
          </h3>
          <p className="text-gray-600 text-sm mb-3 thai-font line-clamp-2">
            {description}
          </p>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 mb-3">
            <div className="flex items-center">
              <div
                className="w-6 h-6 bg-brutal-yellow border-2 border-black flex items-center justify-center mr-1.5 flex-shrink-0"
                style={{ boxShadow: "2px 2px 0 0 #000000" }}
              >
                <Calendar className="h-3 w-3 text-black" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500 font-bold thai-font">
                  ระยะเวลา:
                </div>
                <div className="text-black text-xs font-medium truncate">
                  {formatDate(startDate)} - {formatDate(endDate)}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <div
                className="w-6 h-6 bg-brutal-pink border-2 border-black flex items-center justify-center mr-1.5 flex-shrink-0"
                style={{ boxShadow: "2px 2px 0 0 #000000" }}
              >
                <Clock className="h-3 w-3 text-white" />
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-bold thai-font">
                  เหลืออีก:
                </div>
                <div className="text-black text-xs font-medium">
                  <span className="font-black text-brutal-pink">
                    {calculateDaysRemaining(endDate)}
                  </span>{" "}
                  วัน
                </div>
              </div>
            </div>
          </div>

          {games.length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] text-gray-500 mb-1 font-bold thai-font">
                เกมที่ร่วมรายการ:
              </div>
              <div className="flex flex-wrap gap-1">
                {games.slice(0, 3).map((game, index) => (
                  <span
                    key={index}
                    className="bg-brutal-gray text-black text-[10px] px-2 py-0.5 border border-black font-bold"
                  >
                    {game}
                  </span>
                ))}
                {games.length > 3 && (
                  <span className="text-gray-600 text-[10px] px-1 py-0.5 font-medium">
                    +{games.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="mt-auto">
            <Link href={href}>
              <motion.button
                className="bg-black text-white px-3 py-1.5 flex items-center justify-center font-bold thai-font text-sm border-2 border-black w-full sm:w-auto"
                style={{ boxShadow: "3px 3px 0 0 #000000" }}
                whileHover={{ y: -1, boxShadow: "4px 4px 0 0 #000000" }}
                whileTap={{ scale: 0.98 }}
              >
                รับโปรโมชั่น
                <ArrowRight className="h-3 w-3 ml-1.5" />
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
