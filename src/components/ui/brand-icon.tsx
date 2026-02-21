"use client";

import React, { useState } from "react";
import { Smartphone } from "lucide-react";
import Image from "next/image";

interface BrandIconProps {
  brand: string;
  size?: number;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

// Brand to filename mapping
const brandIconMap: Record<string, string> = {
  ais: "ais.svg",
  dtac: "dtac.png",
  true: "truemove-h.png",
  truemove: "truemove-h.png",
};

// Brand to color mapping for fallback
const brandColorMap: Record<string, string> = {
  ais: "text-orange-500",
  dtac: "text-blue-500",
  true: "text-red-500",
  truemove: "text-red-500",
};

export function BrandIcon({
  brand,
  size = 20,
  className = "",
  fallbackIcon,
}: BrandIconProps) {
  const [imageError, setImageError] = useState(false);
  const lowerBrand = brand.toLowerCase();
  const iconFilename = brandIconMap[lowerBrand];

  if (iconFilename && !imageError) {
    return (
      <div
        className={`relative ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={`/brand-icons/${iconFilename}`}
          alt={brand}
          fill
          className="object-contain"
          onError={() => setImageError(true)}
          unoptimized
        />
      </div>
    );
  }

  // Fallback to provided icon or default Smartphone icon
  if (fallbackIcon) {
    return <span className={className}>{fallbackIcon}</span>;
  }

  const colorClass = brandColorMap[lowerBrand] || "text-gray-500";
  return <Smartphone size={size} className={`${colorClass} ${className}`} />;
}

// Helper function to check if brand has custom icon
export function hasBrandIcon(brand: string): boolean {
  const lowerBrand = brand.toLowerCase();
  return !!brandIconMap[lowerBrand];
}
