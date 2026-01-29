"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { motion } from '@/lib/framer-exports';

interface GameCardProps {
  id: string;
  title: string;
  image: string;
  price?: number;
  originalPrice?: number;
  type?: 'riot' | 'garena' | 'steam' | 'default';
  region?: string;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
}

export function GameCard({
  id,
  title,
  image,
  price,
  originalPrice,
  type = 'default',
  region,
  isFavorite = false,
  onFavoriteToggle
}: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [favorite, setFavorite] = useState(isFavorite);
  
  const discount = originalPrice && price ? Math.round((1 - price / originalPrice) * 100) : 0;
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorite(!favorite);
    if (onFavoriteToggle) {
      onFavoriteToggle(id);
    }
  };

  const getBadgeColor = () => {
    switch (type) {
      case 'riot':
        return 'bg-red-600';
      case 'garena':
        return 'bg-yellow-600';
      case 'steam':
        return 'bg-blue-600';
      default:
        return 'bg-mali-blue';
    }
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-lg group"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/games/${id}`}>
        <div className="relative h-52 md:h-60 w-full overflow-hidden bg-mali-card rounded-lg border border-mali-blue/20 group-hover:border-mali-blue-light/40 transition-all duration-300 group-hover:shadow-card-hover">
          {/* Game Type Badge */}
          <div className={`absolute top-2 left-2 z-10 px-2 py-1 text-xs font-medium text-white rounded ${getBadgeColor()}`}>
            {type.toUpperCase()}
          </div>
          
          {/* Region Badge if exists */}
          {region && (
            <div className="absolute top-2 right-2 z-10 px-2 py-1 text-xs font-medium text-white bg-mali-blue/80 rounded">
              {region}
            </div>
          )}
          
          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            className="absolute top-10 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-mali-dark/50 backdrop-blur-sm hover:bg-mali-dark/70 transition-all duration-300"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${favorite ? 'fill-red-500 text-red-500' : 'text-white'}`}
            />
          </button>
          
          {/* Image */}
          <div className="relative h-full w-full">
            <img
              src={image}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-game-card-gradient opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          
          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
            <h3 className="text-white font-medium text-sm mb-1 line-clamp-1 group-hover:text-mali-blue-light transition-colors">{title}</h3>
            
            {price !== undefined && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {originalPrice && originalPrice > price && (
                    <span className="text-mali-text-secondary line-through text-xs">
                      ${originalPrice.toFixed(2)}
                    </span>
                  )}
                  <span className="text-white font-bold group-hover:text-mali-blue-light transition-colors">
                    ${price.toFixed(2)}
                  </span>
                </div>
                
                {discount > 0 && (
                  <span className="bg-mali-pink px-1.5 py-0.5 text-xs font-medium text-white rounded">
                    -{discount}%
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Hover overlay with button */}
          <motion.div 
            className="absolute inset-0 bg-black/60 opacity-0 transition-opacity flex items-center justify-center backdrop-blur-[2px]"
            animate={{ opacity: isHovered ? 1 : 0 }}
          >
            <motion.div 
              className="bg-mali-blue-accent text-white px-6 py-2 rounded font-bold text-sm relative z-10 hover:bg-white hover:text-black transition-colors border border-transparent hover:border-white"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: isHovered ? 0 : 20, opacity: isHovered ? 1 : 0 }}
              transition={{ delay: 0.1 }}
            >
              View Game
            </motion.div>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
} 
