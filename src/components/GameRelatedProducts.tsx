"use client";

import React, { useState } from 'react';
import { motion } from '@/lib/framer-exports';
import { ChevronRight, ChevronLeft, Sparkles, Zap, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export interface RelatedProduct {
  id: string;
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  type: 'game' | 'card' | 'subscription' | 'addon' | 'bundle';
  region?: string;
  discount?: string;
  tag?: string;
  tagColor?: 'blue' | 'green' | 'purple' | 'pink' | 'orange';
}

export interface GameRelatedProductsProps {
  title?: string;
  subtitle?: string;
  products: RelatedProduct[];
  type?: 'cross-sell' | 'up-sell' | 'bundle';
  viewAllUrl?: string;
  viewAllText?: string;
  className?: string;
  itemsToShow?: number;
}

export function GameRelatedProducts({
  title = "You may also like",
  subtitle,
  products = [],
  type = 'cross-sell',
  viewAllUrl,
  viewAllText = "View all",
  className = "",
  itemsToShow = 4
}: GameRelatedProductsProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Get title and icon based on type
  const getTitleAndIcon = () => {
    switch(type) {
      case 'up-sell':
        return {
          defaultTitle: "Upgrade your experience",
          icon: <Sparkles className="h-5 w-5 text-mali-purple" />
        };
      case 'bundle':
        return {
          defaultTitle: "Bundle & Save",
          icon: <ShoppingCart className="h-5 w-5 text-mali-green" />
        };
      default:
        return {
          defaultTitle: "You may also like",
          icon: <Zap className="h-5 w-5 text-mali-blue-light" />
        };
    }
  };
  
  const { defaultTitle, icon } = getTitleAndIcon();
  const displayTitle = title || defaultTitle;
  
  // Get tag color class
  const getTagColorClass = (color?: string) => {
    switch(color) {
      case 'blue': return 'bg-mali-blue-light';
      case 'green': return 'bg-mali-green';
      case 'purple': return 'bg-mali-purple';
      case 'pink': return 'bg-pink-500';
      case 'orange': return 'bg-orange-500';
      default: return 'bg-mali-blue-light';
    }
  };
  
  // Handle horizontal scrolling
  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('related-products-container');
    if (container) {
      const scrollAmount = direction === 'left' ? -250 : 250;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
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
          <div className="h-8 w-8 rounded-full bg-mali-blue/20 flex items-center justify-center mr-3">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{displayTitle}</h3>
            {subtitle && <p className="text-mali-text-secondary text-sm">{subtitle}</p>}
          </div>
        </div>
        
        {viewAllUrl && (
          <Link
            href={viewAllUrl}
            className="text-mali-blue-light hover:text-white transition-colors flex items-center text-sm"
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
          onClick={() => scroll('left')}
          className="absolute -left-4 top-1/2 transform -translate-y-1/2 z-10 bg-mali-blue/20 hover:bg-mali-blue/40 rounded-full p-2 text-white transition-colors"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        {/* Products Container */}
        <div 
          id="related-products-container"
          className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4 -mx-2 px-2"
          style={{ scrollBehavior: 'smooth' }}
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
                <div className="glass-card overflow-hidden group h-full flex flex-col">
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
                      <div className="absolute top-2 right-2 bg-mali-red text-white text-xs px-2 py-0.5 rounded font-medium">
                        {product.discount}
                      </div>
                    )}
                    
                    {/* Custom Tag */}
                    {product.tag && (
                      <div className={`absolute top-2 left-2 ${getTagColorClass(product.tagColor)} text-white text-xs px-2 py-0.5 rounded font-medium`}>
                        {product.tag}
                      </div>
                    )}
                    
                    {/* Region Badge */}
                    {product.region && (
                      <div className="absolute bottom-2 left-2 bg-mali-navy/80 backdrop-blur-sm text-mali-text-secondary text-xs px-2 py-0.5 rounded">
                        {product.region}
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-3 flex flex-col flex-grow">
                    <h4 className="font-medium text-white mb-1 line-clamp-2">{product.title}</h4>
                    
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div className="flex items-baseline">
                        <span className="text-white font-semibold">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-mali-text-secondary line-through text-xs ml-2">
                            ${product.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      <div className={`
                        px-1.5 py-0.5 rounded text-xs 
                        ${product.type === 'game' ? 'bg-blue-500/20 text-blue-400' : 
                          product.type === 'card' ? 'bg-green-500/20 text-green-400' : 
                          product.type === 'subscription' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-amber-500/20 text-amber-400'}
                      `}>
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
          onClick={() => scroll('right')}
          className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-10 bg-mali-blue/20 hover:bg-mali-blue/40 rounded-full p-2 text-white transition-colors"
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
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i * itemsToShow <= scrollPosition && scrollPosition < (i + 1) * itemsToShow
                ? 'w-6 bg-mali-blue-light'
                : 'w-1.5 bg-mali-blue/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
} 