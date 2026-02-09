'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product, productApi } from '@/lib/services/product-api';
import { cn, getMinPrice, formatPrice } from '@/lib/utils';
import { Star, Link2 } from 'lucide-react';
import { motion } from '@/lib/framer-exports';

interface RelatedProductsProps {
  productId: string;
  limit?: number;
  className?: string;
}

export function RelatedProducts({
  productId,
  limit = 4,
  className,
}: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!productId) return;

      try {
        setLoading(true);
        const response = await productApi.getRelatedProducts(productId, limit);
        setProducts(response.data);
      } catch (err) {
        setError('Failed to load related products');
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [productId, limit]);

  if (loading) {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
        {Array.from({ length: limit }).map((_, i) => (
          <div
            key={i}
            className="bg-white border-[3px] border-black aspect-[3/4] animate-pulse"
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
        <div className="w-8 h-8 bg-brutal-blue border-[2px] border-black flex items-center justify-center"
          style={{ boxShadow: '2px 2px 0 0 #000000' }}
        >
          <Link2 className="w-4 h-4 text-black" />
        </div>
        <h2 className="text-xl font-black text-black thai-font">สินค้าที่คุณอาจชอบ</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <motion.div
            key={product.id}
            whileHover={{ y: -4, boxShadow: '6px 6px 0 0 #000000' }}
            transition={{ duration: 0.2 }}
          >
            <Link
              href={`/games/${product.slug}`}
              className="group block bg-white border-[3px] border-black overflow-hidden"
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
                <p className="mt-2 font-black text-brutal-pink text-lg">
                  {formatPrice(getMinPrice(product.seagmTypes))}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
