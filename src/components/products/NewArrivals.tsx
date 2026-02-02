'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product, productApi } from '@/lib/services/product-api';
import { cn } from '@/lib/utils';
import { Star, Clock } from 'lucide-react';

interface NewArrivalsProps {
  limit?: number;
  className?: string;
}

export function NewArrivals({ limit = 8, className }: NewArrivalsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        setLoading(true);
        const response = await productApi.getNewArrivals(limit);
        setProducts(response.data);
      } catch (err) {
        setError('Failed to load new arrivals');
      } finally {
        setLoading(false);
      }
    };

    fetchNewArrivals();
  }, [limit]);

  if (loading) {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
        {Array.from({ length: limit }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-100 rounded-lg aspect-[3/4] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error || products.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-green-500" />
        <h2 className="text-xl font-bold text-gray-900">New Arrivals</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/games/${product.slug}`}
            className="group bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative aspect-square bg-gray-100">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No Image
                </div>
              )}
              <span className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                New
              </span>
            </div>
            <div className="p-3">
              <h3 className="font-medium text-gray-900 line-clamp-1">
                {product.name}
              </h3>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-gray-600">
                  {product.averageRating?.toFixed(1) || '0.0'}
                </span>
                <span className="text-sm text-gray-400">
                  ({product.reviewCount || 0})
                </span>
              </div>
              <p className="mt-2 font-bold text-blue-600">
                {product.price} ฿
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
