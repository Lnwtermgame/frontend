'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product, productApi } from '@/lib/services/product-api';
import { cn } from '@/lib/utils';
import { Star, TrendingUp } from 'lucide-react';
import { motion } from '@/lib/framer-exports';

interface BestsellerProductsProps {
  limit?: number;
  className?: string;
}

export function BestsellerProducts({ limit = 8, className }: BestsellerProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBestsellers = async () => {
      try {
        setLoading(true);
        const response = await productApi.getBestsellerProducts(limit);
        setProducts(response.data);
      } catch (err) {
        setError('Failed to load bestseller products');
      } finally {
        setLoading(false);
      }
    };

    fetchBestsellers();
  }, [limit]);

  if (loading) {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
        {Array.from({ length: limit }).map((_, i) => (
          <div
            key={i}
            className="bg-white border-[3px] border-black rounded-xl aspect-[3/4] animate-pulse"
            style={{ boxShadow: '4px 4px 0 0 #000000' }}
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
        <div className="w-8 h-8 rounded-lg bg-brutal-pink border-[2px] border-black flex items-center justify-center"
          style={{ boxShadow: '2px 2px 0 0 #000000' }}
        >
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-xl font-black text-black thai-font">สินค้าขายดี</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            whileHover={{ y: -4, boxShadow: '6px 6px 0 0 #000000' }}
            transition={{ duration: 0.2 }}
          >
            <Link
              href={`/games/${product.slug}`}
              className="group block bg-white rounded-xl border-[3px] border-black overflow-hidden"
              style={{ boxShadow: '4px 4px 0 0 #000000' }}
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
                {/* Rank badge */}
                <span
                  className={cn(
                    'absolute top-2 left-2 w-8 h-8 flex items-center justify-center rounded-lg text-black font-black text-sm border-[2px] border-black',
                    index === 0
                      ? 'bg-brutal-yellow'
                      : index === 1
                      ? 'bg-gray-200'
                      : index === 2
                      ? 'bg-orange-300'
                      : 'bg-gray-100'
                  )}
                  style={{ boxShadow: '2px 2px 0 0 #000000' }}
                >
                  #{index + 1}
                </span>
              </div>
              <div className="p-3">
                <h3 className="font-bold text-black line-clamp-1 thai-font">
                  {product.name}
                </h3>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 fill-brutal-yellow text-black" />
                  <span className="text-sm text-gray-600 font-medium">
                    {product.averageRating?.toFixed(1) || '0.0'}
                  </span>
                  <span className="text-sm text-gray-400">
                    ({product.reviewCount || 0})
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="font-black text-brutal-pink text-lg">
                    {product.price} ฿
                  </p>
                  {product.salesCount && (
                    <span className="text-xs text-gray-500 font-medium">
                      ขายแล้ว {product.salesCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
