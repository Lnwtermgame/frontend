'use client';

import Link from 'next/link';
import { Tag } from '@/lib/services/product-api';
import { cn } from '@/lib/utils';
import { Tag as TagIcon } from 'lucide-react';

interface ProductTagsProps {
  tags: Tag[];
  className?: string;
  variant?: 'default' | 'outline' | 'filled';
}

export function ProductTags({ tags, className, variant = 'default' }: ProductTagsProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  const variantStyles = {
    default: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    outline: 'border border-gray-300 hover:border-gray-400 text-gray-600',
    filled: 'bg-blue-600 hover:bg-blue-700 text-white',
  };

  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <TagIcon className="w-4 h-4" />
        Tags
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            href={`/products?tag=${tag.slug}`}
            className={cn(
              'px-3 py-1 rounded-full text-sm transition-colors',
              variantStyles[variant]
            )}
          >
            {tag.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
