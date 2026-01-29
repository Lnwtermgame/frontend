"use client";

import React from 'react';
import { motion } from '@/lib/framer-exports';
import { Crown, Sparkles, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export interface PremiumUpsellCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  originalPrice?: number;
  savings?: number | string;
  savingsType?: 'percentage' | 'amount';
  features?: string[];
  ctaText?: string;
  ctaUrl?: string;
  variant?: 'horizontal' | 'vertical';
  className?: string;
}

export function PremiumUpsellCard({
  id,
  title,
  description,
  image,
  price,
  originalPrice,
  savings,
  savingsType = 'percentage',
  features = [],
  ctaText = "Upgrade Now",
  ctaUrl = `/games/${id}`,
  variant = 'horizontal',
  className = ''
}: PremiumUpsellCardProps) {
  // Calculate savings display
  const savingsDisplay = () => {
    if (!savings) return null;
    return savingsType === 'percentage' 
      ? `${savings}% OFF` 
      : `SAVE $${typeof savings === 'number' ? savings.toFixed(2) : savings}`;
  };
  
  // Choose layout based on variant
  const isHorizontal = variant === 'horizontal';
  
  return (
    <motion.div 
      className={`glass-card overflow-hidden relative group ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Premium badge */}
      <div className="absolute top-0 left-0 z-10 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-xs px-4 py-1 rounded-br font-medium flex items-center">
        <Crown className="h-3.5 w-3.5 mr-1.5" />
        <span>PREMIUM</span>
      </div>
      
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-500/20 opacity-60"></div>
      
      <div className={`flex ${isHorizontal ? 'flex-col lg:flex-row' : 'flex-col'}`}>
        {/* Image Section */}
        <div className={`relative overflow-hidden ${isHorizontal ? 'lg:w-2/5' : 'w-full'}`}>
          <div className={`${isHorizontal ? 'aspect-[16/9] lg:h-full' : 'aspect-[16/9]'} relative`}>
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          
          {/* Savings Badge */}
          {savings && (
            <div className="absolute top-4 right-4 bg-mali-red text-white px-3 py-1.5 rounded-full font-bold text-sm shadow-glow">
              {savingsDisplay()}
            </div>
          )}
        </div>
        
        {/* Content Section */}
        <div className={`p-6 ${isHorizontal ? 'lg:w-3/5' : 'w-full'} relative z-10`}>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center">
            {title}
            <Sparkles className="h-4 w-4 text-amber-400 ml-2" />
          </h3>
          
          <p className="text-mali-text-secondary mb-4">{description}</p>
          
          {/* Features List */}
          {features.length > 0 && (
            <ul className="space-y-2 mb-4">
              {features.map((feature, index) => (
                <li 
                  key={index}
                  className="flex items-center text-sm text-white"
                >
                  <span className="h-4 w-4 rounded-full bg-mali-blue/30 flex items-center justify-center mr-2">
                    <span className="h-2 w-2 rounded-full bg-mali-blue-light"></span>
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          )}
          
          {/* Price and CTA */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex flex-col">
              <div className="flex items-baseline">
                <span className="text-white font-bold text-2xl">${price.toFixed(2)}</span>
                {originalPrice && (
                  <span className="text-mali-text-secondary line-through ml-2">${originalPrice.toFixed(2)}</span>
                )}
              </div>
              {savings && (
                <span className="text-mali-green text-sm">
                  You save: {savingsType === 'percentage' 
                    ? `${savings}%` 
                    : `$${typeof savings === 'number' ? savings.toFixed(2) : savings}`}
                </span>
              )}
            </div>
            
            <Link href={ctaUrl}>
              <motion.button 
                className="bg-gradient-to-r from-mali-blue to-mali-purple text-white px-4 py-2 rounded-lg flex items-center font-medium shadow-button-glow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {ctaText}
                <ArrowRight className="h-4 w-4 ml-2" />
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Additional glow effects */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/30 rounded-full blur-2xl"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-500/30 rounded-full blur-2xl"></div>
    </motion.div>
  );
} 