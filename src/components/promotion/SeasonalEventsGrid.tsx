"use client";

import React from "react";
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
      <div className={`space-y-3 ${className}`}>
        {title && (
          <div className="flex justify-between items-end mb-3">
            <div>
              <h2 className="text-lg font-black text-black thai-font">
                {title}
              </h2>
              {description && (
                <p className="text-gray-600 mt-0.5 text-sm thai-font">
                  {description}
                </p>
              )}
            </div>
          </div>
        )}
        <div
          className="bg-white border-2 border-black p-4 text-center"
          style={{ boxShadow: "3px 3px 0 0 #000000" }}
        >
          <p className="text-gray-500 text-sm thai-font">
            ไม่มีโปรโมชั่นพิเศษในขณะนี้
          </p>
          <p className="text-gray-500 mt-0.5 text-sm thai-font">
            กลับมาตรวจสอบใหม่ภายหลัง!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {title && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 bg-brutal-pink border-2 border-black flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: "2px 2px 0 0 #000000" }}
            >
              <span className="text-white font-black text-sm">%</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-black thai-font">
                {title}
              </h2>
              {description && (
                <p className="text-gray-600 text-sm thai-font">{description}</p>
              )}
            </div>
          </div>

          {viewAllUrl && events.length > (maxItems || 0) && (
            <Link
              href={viewAllUrl}
              className="text-sm text-black hover:text-brutal-pink transition-colors flex items-center group font-bold thai-font"
            >
              <span>{viewAllText}</span>
              <ChevronRight className="h-3.5 w-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      )}

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 ${featuredLayout ? "gap-3" : "lg:grid-cols-3 gap-3"}`}
      >
        {displayEvents.map((event, index) => (
          <SeasonalEventCard
            key={event.id}
            {...event}
            featured={index === 0 && featuredLayout}
          />
        ))}
      </div>
    </div>
  );
}
