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
    default: 'bg-brutal-gray hover:bg-brutal-yellow text-black border-[2px] border-black',
    outline: 'border-[2px] border-black hover:bg-brutal-yellow text-black bg-white',
    filled: 'bg-black text-white border-[2px] border-black hover:bg-gray-800',
  };

  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="text-sm font-bold text-black flex items-center gap-2 thai-font">
        <div className="w-6 h-6 rounded-lg bg-brutal-pink border-[2px] border-black flex items-center justify-center"
          style={{ boxShadow: '2px 2px 0 0 #000000' }}
        >
          <TagIcon className="w-3 h-3 text-white" />
        </div>
        แท็ก
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            href={`/products?tag=${tag.slug}`}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-bold transition-all thai-font',
              variantStyles[variant]
            )}
            style={variant === 'default' ? { boxShadow: '2px 2px 0 0 #000000' } : variant === 'filled' ? { boxShadow: '2px 2px 0 0 #000000' } : {}}
          >
            {tag.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
