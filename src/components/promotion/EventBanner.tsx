import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from "@/lib/framer-exports";
import { Calendar, Clock, ChevronRight } from "lucide-react";

export interface EventBannerProps {
  id: string;
  title: string;
  description: string;
  image: string;
  startDate: string;
  endDate: string;
  discount?: string;
  discountColor?: 'blue' | 'green' | 'purple' | 'red';
  isActive: boolean;
  actionLabel?: string;
  actionLink?: string;
  size?: 'small' | 'medium' | 'large';
  gameList?: string[];
}

export const EventBanner = ({
  id,
  title,
  description,
  image,
  startDate,
  endDate,
  discount,
  discountColor = 'blue',
  isActive = true,
  actionLabel = 'รับโปรโมชั่น',
  actionLink,
  size = 'medium',
  gameList = []
}: EventBannerProps) => {
  // Get the current date to calculate remaining days
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isHovered, setIsHovered] = useState(false);
  
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
    const diffTime = end.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Get discount badge color
  const getDiscountBgColor = () => {
    switch (discountColor) {
      case 'blue': 
        return 'bg-mali-blue-light';
      case 'green':
        return 'bg-mali-green';
      case 'purple':
        return 'bg-mali-purple';
      case 'red':
        return 'bg-mali-red';
      default:
        return 'bg-mali-blue-light';
    }
  };
  
  const daysRemaining = calculateDaysRemaining(endDate);
  const link = actionLink || `/special-events/${id}`;
  
  // Different layout based on size
  if (size === 'small') {
    return (
      <motion.div 
        className="glass-card overflow-hidden relative group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ y: -4 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link href={link} className="block">
          <div className="relative">
            <div className="aspect-[16/9] relative">
              <Image
                src={image}
                alt={title}
                fill
                className={`object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-mali-dark to-transparent opacity-70"></div>
            </div>
            
            {discount && (
              <div className={`absolute top-3 right-3 ${getDiscountBgColor()} text-white px-3 py-1 rounded-full font-bold`}>
                {discount}
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="font-bold text-white text-sm mb-1 line-clamp-1">{title}</h3>
              <div className="flex items-center text-mali-text-secondary text-xs">
                <Clock className="h-3 w-3 mr-1" />
                <span>เหลือ {daysRemaining} วัน</span>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }
  
  // Default medium/large size
  return (
    <motion.div 
      className="glass-card overflow-hidden relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row">
        <div className={`${size === 'large' ? 'md:w-2/3' : 'md:w-1/2'} relative`}>
          <div className="aspect-[16/9] md:aspect-auto md:h-full relative">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          
          {discount && (
            <div className={`absolute top-4 right-4 ${getDiscountBgColor()} text-white px-4 py-2 rounded-full font-bold ${size === 'large' ? 'text-xl' : 'text-lg'}`}>
              {discount}
            </div>
          )}
        </div>
        
        <div className={`p-6 ${size === 'large' ? 'md:w-1/3' : 'md:w-1/2'} flex flex-col`}>
          <h2 className={`${size === 'large' ? 'text-2xl' : 'text-xl'} font-bold text-white mb-2`}>{title}</h2>
          <p className="text-mali-text-secondary mb-4">{description}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-mali-blue-light mr-2" />
              <div>
                <div className="text-sm text-mali-text-secondary">ระยะเวลา:</div>
                <div className="text-white">{formatDate(startDate)} - {formatDate(endDate)}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-mali-blue-light mr-2" />
              <div>
                <div className="text-sm text-mali-text-secondary">เหลืออีก:</div>
                <div className="text-white">{daysRemaining} วัน</div>
              </div>
            </div>
          </div>
          
          {gameList.length > 0 && (
            <div className="mb-6">
              <div className="text-sm text-mali-text-secondary mb-2">เกมที่ร่วมรายการ:</div>
              <div className="flex flex-wrap gap-2">
                {gameList.map((game, index) => (
                  <span 
                    key={index} 
                    className="bg-mali-blue/20 text-white text-xs px-3 py-1 rounded-full"
                  >
                    {game}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-auto">
            <Link href={link}>
              <button className="btn-primary w-full sm:w-auto flex items-center justify-center">
                {actionLabel}
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 
