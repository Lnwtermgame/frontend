"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/lib/services/product-api";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface ProductImageGalleryProps {
  images: ProductImage[];
  primaryImageUrl?: string;
  productName: string;
  className?: string;
}

export function ProductImageGallery({
  images,
  primaryImageUrl,
  productName,
  className,
}: ProductImageGalleryProps) {
  // Sort images: primary first, then by sortOrder
  const sortedImages = [...images].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return a.sortOrder - b.sortOrder;
  });

  // Add primary image if not in the list
  const allImages =
    primaryImageUrl && !images.some((img) => img.url === primaryImageUrl)
      ? [
          {
            id: "primary",
            url: primaryImageUrl,
            alt: productName,
            isPrimary: true,
            sortOrder: -1,
            createdAt: "",
          },
          ...sortedImages,
        ]
      : sortedImages;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  if (allImages.length === 0) {
    return (
      <div
        className={cn(
          "bg-gray-100 rounded-lg flex items-center justify-center aspect-square",
          className,
        )}
      >
        <span className="text-gray-400">No image available</span>
      </div>
    );
  }

  const selectedImage = allImages[selectedIndex];

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Image */}
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
        <Image
          src={selectedImage.url}
          alt={selectedImage.alt || productName}
          fill
          className={cn(
            "object-cover transition-transform duration-300",
            isZoomed && "scale-150 cursor-zoom-out",
          )}
          onClick={() => setIsZoomed(!isZoomed)}
          priority
        />

        {/* Zoom indicator */}
        {!isZoomed && (
          <button
            type="button"
            onClick={() => setIsZoomed(true)}
            aria-label="Zoom image"
            className="absolute top-4 right-4 p-2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ZoomIn className="w-5 h-5" aria-hidden="true" />
          </button>
        )}

        {/* Navigation arrows (only if multiple images) */}
        {allImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevious}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </>
        )}

        {/* Image counter */}
        {allImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
            {selectedIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all",
                selectedIndex === index
                  ? "border-blue-600 ring-2 ring-blue-100"
                  : "border-transparent hover:border-gray-300",
              )}
            >
              <Image
                src={image.url}
                alt={image.alt || `${productName} - ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
