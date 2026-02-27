"use client";

import React from "react";
import { motion } from "@/lib/framer-exports";
import { SeasonalEventCard, SeasonalEventProps } from "./SeasonalEventCard";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export interface SeasonalEventsGridProps {
  title?: string;
  description?: string;
  events: SeasonalEventProps[];
  viewAllUrl?: string;
  viewAllText?: string;
  featuredLayout?: boolean;
  className?: string;
  maxItems?: number;
}

export function SeasonalEventsGrid({
  title = "Special Events",
  description,
  events = [],
  viewAllUrl = "/special-events",
  viewAllText = "View all events",
  featuredLayout = false,
  className = "",
  maxItems,
}: SeasonalEventsGridProps) {
  const displayEvents = maxItems ? events.slice(0, maxItems) : events;

  // If no events, display a message
  if (events.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {title && (
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-2xl font-black text-black thai-font">
                {title}
              </h2>
              {description && (
                <p className="text-gray-600 mt-1 thai-font">{description}</p>
              )}
            </div>
          </div>
        )}
        <div
          className="bg-white border-[3px] border-black p-8 text-center"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <p className="text-gray-500 thai-font">ไม่มีโปรโมชั่นพิเศษในขณะนี้</p>
          <p className="text-gray-500 mt-1 thai-font">
            กลับมาตรวจสอบใหม่ภายหลัง!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {title && (
        <div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 gap-4"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 bg-brutal-pink border-[2px] border-black flex items-center justify-center"
              style={{ boxShadow: "2px 2px 0 0 #000000" }}
            >
              <span className="text-white font-black">%</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-black thai-font">
                {title}
              </h2>
              {description && (
                <p className="text-gray-600 mt-1 thai-font">{description}</p>
              )}
            </div>
          </div>

          {viewAllUrl && events.length > (maxItems || 0) && (
            <Link
              href={viewAllUrl}
              className="text-black hover:text-brutal-pink transition-colors flex items-center group font-bold thai-font"
            >
              <span>{viewAllText}</span>
              <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      )}

      <div
        className={`grid grid-cols-1 ${featuredLayout ? "gap-6" : "md:grid-cols-2 gap-4"}`}
      >
        {displayEvents.map((event, index) => (
          <div
            key={event.id}
            className="transition-transform duration-200 hover:-translate-y-1"
          >
            <SeasonalEventCard
              {...event}
              featured={index === 0 && featuredLayout}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
