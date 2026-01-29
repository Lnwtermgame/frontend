"use client";

import React from 'react';
import { motion } from '@/lib/framer-exports';
import { SeasonalEventCard, SeasonalEventProps } from './SeasonalEventCard';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

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
  maxItems
}: SeasonalEventsGridProps) {
  const displayEvents = maxItems ? events.slice(0, maxItems) : events;
  
  // If no events, display a message
  if (events.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {title && (
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              {description && <p className="text-mali-text-secondary mt-1">{description}</p>}
            </div>
          </div>
        )}
        <div className="glass-card p-8 text-center">
          <p className="text-mali-text-secondary">No special events available at this time.</p>
          <p className="text-mali-text-secondary mt-1">Check back later for new promotions!</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {title && (
        <motion.div 
          className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 gap-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            {description && <p className="text-mali-text-secondary mt-1">{description}</p>}
          </div>
          
          {viewAllUrl && events.length > (maxItems || 0) && (
            <Link href={viewAllUrl} className="text-mali-blue-light hover:text-white transition-colors flex items-center group">
              <span>{viewAllText}</span>
              <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </motion.div>
      )}
      
      <div className={`grid grid-cols-1 ${featuredLayout ? 'gap-6' : 'md:grid-cols-2 gap-4'}`}>
        {displayEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <SeasonalEventCard 
              {...event} 
              featured={index === 0 && featuredLayout}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
} 
