"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from '@/lib/framer-exports';
import { usePromotion, Promotion } from '@/lib/context/promotion-context';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  Tag,
  Timer
} from 'lucide-react';

interface PromotionSliderProps {
  maxItems?: number;
  autoplay?: boolean;
  interval?: number;
}

export function PromotionSlider({ 
  maxItems = 3, 
  autoplay = true, 
  interval = 5000 
}: PromotionSliderProps) {
  const { getActivePromotions } = usePromotion();
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const activePromotions = getActivePromotions().slice(0, maxItems);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  // Start autoplay
  useEffect(() => {
    if (autoplay && !isPaused && activePromotions.length > 1) {
      timerRef.current = setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % activePromotions.length);
      }, interval);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [autoplay, isPaused, activeIndex, activePromotions.length, interval]);
  
  // Format date for countdown
  const formatTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) {
      return 'Ended';
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };
  
  // Navigation handlers
  const goToSlide = (index: number) => {
    setActiveIndex(index);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };
  
  const goToPrevious = () => {
    const newIndex = activeIndex === 0 ? activePromotions.length - 1 : activeIndex - 1;
    goToSlide(newIndex);
  };
  
  const goToNext = () => {
    const newIndex = (activeIndex + 1) % activePromotions.length;
    goToSlide(newIndex);
  };
  
  // If no active promotions, don't render the slider
  if (activePromotions.length === 0) {
    return null;
  }
  
  // For a single promotion, render without navigation
  if (activePromotions.length === 1) {
    const promotion = activePromotions[0];
    return (
      <div className="mb-6 relative">
        <PromotionCard promotion={promotion} />
      </div>
    );
  }
  
  return (
    <div 
      className="mb-6 relative" 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slider */}
      <div className="overflow-hidden relative rounded-2xl">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {activePromotions.map((promotion) => (
            <div key={promotion.id} className="w-full flex-shrink-0">
              <PromotionCard promotion={promotion} />
            </div>
          ))}
        </div>
        
        {/* Navigation arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-mali-card/80 hover:bg-mali-card p-2 rounded-full"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
        
        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-mali-card/80 hover:bg-mali-card p-2 rounded-full"
        >
          <ChevronRight size={20} className="text-white" />
        </button>
      </div>
      
      {/* Indicators */}
      <div className="flex justify-center mt-4 space-x-2">
        {activePromotions.map((_, index) => (
          <button
            key={`indicator-${index}`}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full ${
              index === activeIndex 
                ? 'bg-mali-blue-accent' 
                : 'bg-mali-blue/30 hover:bg-mali-blue/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Promotion Card Component
function PromotionCard({ promotion }: { promotion: Promotion }) {
  const formatTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) {
      return 'Ended';
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  return (
    <Link 
      href={`/promotions/${promotion.id}`}
      className="block relative w-full aspect-[21/9] rounded-2xl overflow-hidden group"
    >
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        {promotion.bannerImage ? (
          <Image
            src={promotion.bannerImage}
            alt={promotion.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1200px"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-r 
            ${promotion.type === 'flash_sale' ? 'from-purple-900 to-blue-800' : 
              promotion.type === 'cashback' ? 'from-blue-900 to-cyan-800' : 
              promotion.type === 'referral' ? 'from-green-900 to-emerald-800' :
              'from-indigo-900 to-purple-800'}`}
          />
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      </div>
      
      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end">
        {/* Badge */}
        <div className="mb-auto">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            promotion.type === 'flash_sale' ? 'bg-purple-900/80 text-purple-300 border border-purple-700/50' :
            promotion.type === 'cashback' ? 'bg-blue-900/80 text-blue-300 border border-blue-700/50' :
            promotion.type === 'referral' ? 'bg-green-900/80 text-green-300 border border-green-700/50' :
            'bg-mali-blue/30 text-mali-blue-accent border border-mali-blue/50'
          }`}>
            {promotion.type === 'flash_sale' && <Timer size={14} />}
            {promotion.type === 'cashback' && <Tag size={14} />}
            {promotion.type === 'referral' && <Clock size={14} />}
            {promotion.type === 'flash_sale' ? 'Flash Sale' :
              promotion.type === 'cashback' ? 'Cashback' :
              promotion.type === 'referral' ? 'Referral' :
              promotion.type.replace('_', ' ')}
          </div>
        </div>
        
        {/* Title and description */}
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{promotion.title}</h3>
        <p className="text-sm md:text-base text-gray-300 mb-3 line-clamp-2">{promotion.description}</p>
        
        {/* Time remaining and CTA */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            <Clock size={14} />
            {formatTimeRemaining(promotion.endDate)}
          </div>
          
          <div className="px-4 py-1.5 bg-mali-blue-accent rounded-lg text-white text-sm group-hover:bg-white group-hover:text-mali-blue-accent transition-colors">
            View Details
          </div>
        </div>
      </div>
    </Link>
  );
} 