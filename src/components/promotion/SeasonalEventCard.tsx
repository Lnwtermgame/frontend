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
      case 'blue': return 'bg-brutal-blue';
      case 'purple': return 'bg-purple-400';
      case 'green': return 'bg-brutal-green';
      case 'pink': return 'bg-brutal-pink';
      default: return 'bg-brutal-yellow';
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
      className={`bg-white border-[3px] border-black overflow-hidden relative group ${className}`}
      style={{ boxShadow: '4px 4px 0 0 #000000' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{
        y: -4,
        boxShadow: '6px 6px 0 0 #000000'
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
            <div className={`absolute top-4 right-4 ${getBadgeColor()} text-black px-4 py-2 font-black text-lg border-[2px] border-black`}
              style={{ boxShadow: '2px 2px 0 0 #000000' }}
            >
              {discount}
            </div>
          )}

          {/* Event type badge */}
          <div className="absolute top-4 left-4 bg-black text-white px-3 py-1.5 flex items-center text-sm font-bold border-[2px] border-black">
            {getEventTypeIcon()}
            <span className="ml-1.5 capitalize thai-font">{type}</span>
          </div>
        </div>
        
        <div className={contentContainerClass}>
          <h3 className="text-xl font-black text-black mb-2 thai-font">{title}</h3>
          <p className="text-gray-600 mb-4 thai-font">{description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-brutal-yellow border-[2px] border-black flex items-center justify-center mr-2"
                style={{ boxShadow: '2px 2px 0 0 #000000' }}
              >
                <Calendar className="h-4 w-4 text-black" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-bold thai-font">ระยะเวลา:</div>
                <div className="text-black text-sm font-medium">{formatDate(startDate)} - {formatDate(endDate)}</div>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-8 h-8 bg-brutal-pink border-[2px] border-black flex items-center justify-center mr-2"
                style={{ boxShadow: '2px 2px 0 0 #000000' }}
              >
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-bold thai-font">เหลืออีก:</div>
                <div className="text-black text-sm font-medium">
                  <span className="font-black text-brutal-pink">{calculateDaysRemaining(endDate)}</span> วัน
                </div>
              </div>
            </div>
          </div>

          {games.length > 0 && (
            <div className="mb-6">
              <div className="text-xs text-gray-500 mb-2 font-bold thai-font">เกมที่ร่วมรายการ:</div>
              <div className="flex flex-wrap gap-2">
                {games.map((game, index) => (
                  <span
                    key={index}
                    className="bg-brutal-gray text-black text-xs px-3 py-1 border-[2px] border-black font-bold"
                  >
                    {game}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto">
            <Link href={href}>
              <motion.button
                className="bg-black text-white px-6 py-3 flex items-center justify-center font-bold thai-font border-[3px] border-black w-full sm:w-auto"
                style={{ boxShadow: '4px 4px 0 0 #000000' }}
                whileHover={{ y: -2, boxShadow: '6px 6px 0 0 #000000' }}
                whileTap={{ scale: 0.98 }}
              >
                รับโปรโมชั่น
                <ArrowRight className="h-4 w-4 ml-2" />
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
      
    </motion.div>
  );
} 
