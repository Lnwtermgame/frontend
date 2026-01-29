"use client";

import React from 'react';
import { motion } from '@/lib/framer-exports';
import { Calendar, Clock, Tag, ArrowRight, Gift } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export interface SeasonalEventProps {
  id: string;
  title: string;
  description: string;
  image: string;
  startDate: string;
  endDate: string;
  type: 'cashback' | 'discount' | 'bonus' | 'special';
  discount?: string;
  discountColor?: 'blue' | 'purple' | 'green' | 'pink';
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
  discountColor = 'blue',
  games = [],
  featured = false,
  href = `/special-events/${id}`,
  className = ''
}: SeasonalEventProps) {
  // Format the date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
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
    switch(discountColor) {
      case 'blue': return 'bg-mali-blue-light';
      case 'purple': return 'bg-mali-purple';
      case 'green': return 'bg-mali-green';
      case 'pink': return 'bg-pink-500';
      default: return 'bg-mali-blue-light';
    }
  };

  // Get event type icon
  const getEventTypeIcon = () => {
    switch(type) {
      case 'cashback': return <Tag className="h-5 w-5" />;
      case 'discount': return <Tag className="h-5 w-5" />;
      case 'bonus': return <Gift className="h-5 w-5" />;
      case 'special': return <Gift className="h-5 w-5" />;
      default: return <Tag className="h-5 w-5" />;
    }
  };

  // Style variations based on featured status
  const cardLayout = featured 
    ? "flex flex-col md:flex-row" 
    : "flex flex-col";
  
  const imageContainerClass = featured
    ? "md:w-1/2 relative"
    : "w-full relative";
  
  const contentContainerClass = featured
    ? "p-6 md:w-1/2 flex flex-col"
    : "p-6 flex flex-col";

  return (
    <motion.div 
      className={`glass-card overflow-hidden relative group ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ 
        boxShadow: `0 0 20px 0 rgba(${discountColor === 'blue' ? '66, 153, 225' : discountColor === 'purple' ? '159, 122, 234' : discountColor === 'green' ? '72, 187, 120' : '236, 72, 153'}, 0.3)`
      }}
    >
      <div className={cardLayout}>
        <div className={imageContainerClass}>
          <div className={`${featured ? 'aspect-[16/9] md:aspect-auto md:h-full' : 'aspect-[16/9]'} relative`}>
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          
          {/* Floating discount badge */}
          {discount && (
            <div className={`absolute top-4 right-4 ${getBadgeColor()} text-white px-4 py-2 rounded-full font-bold text-lg shadow-glow`}>
              {discount}
            </div>
          )}
          
          {/* Event type badge */}
          <div className="absolute top-4 left-4 bg-mali-card/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full flex items-center text-sm font-medium">
            {getEventTypeIcon()}
            <span className="ml-1.5 capitalize">{type}</span>
          </div>
        </div>
        
        <div className={contentContainerClass}>
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-mali-text-secondary mb-4">{description}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-mali-blue-light mr-2" />
              <div>
                <div className="text-xs text-mali-text-secondary">ระยะเวลา:</div>
                <div className="text-white text-sm">{formatDate(startDate)} - {formatDate(endDate)}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-mali-blue-light mr-2" />
              <div>
                <div className="text-xs text-mali-text-secondary">เหลืออีก:</div>
                <div className="text-white text-sm">
                  <span className="font-semibold">{calculateDaysRemaining(endDate)}</span> วัน
                </div>
              </div>
            </div>
          </div>
          
          {games.length > 0 && (
            <div className="mb-6">
              <div className="text-xs text-mali-text-secondary mb-2">เกมที่ร่วมรายการ:</div>
              <div className="flex flex-wrap gap-2">
                {games.map((game, index) => (
                  <span 
                    key={index} 
                    className="bg-mali-blue/20 text-white text-xs px-3 py-1 rounded-full border border-mali-blue/30"
                  >
                    {game}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-auto">
            <Link href={href}>
              <button className="bg-button-gradient text-white px-4 py-2 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity shadow-button-glow w-full sm:w-auto">
                รับโปรโมชั่น
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Subtle glow effect */}
      <div 
        className={`absolute -inset-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm -z-10 ${
          discountColor === 'blue' 
            ? 'from-mali-blue/30 to-mali-blue-light/30'
            : discountColor === 'purple'
            ? 'from-mali-purple/30 to-purple-400/30'
            : discountColor === 'green'
            ? 'from-mali-green/30 to-green-400/30'
            : 'from-pink-500/30 to-pink-400/30'
        }`}
      ></div>
    </motion.div>
  );
} 