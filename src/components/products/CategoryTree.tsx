'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Category } from '@/lib/services/product-api';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';

interface CategoryTreeProps {
  categories: Category[];
  className?: string;
  activeSlug?: string;
  maxDepth?: number;
}

interface CategoryNodeProps {
  category: Category;
  depth: number;
  maxDepth: number;
  activeSlug?: string;
}

function CategoryNode({ category, depth, maxDepth, activeSlug }: CategoryNodeProps) {
  const [isExpanded, setIsExpanded] = useState(
    activeSlug === category.slug || category.children?.some(c => c.slug === activeSlug)
  );
  const hasChildren = category.children && category.children.length > 0;
  const isActive = activeSlug === category.slug;

  if (depth > maxDepth) return null;

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-1 py-2 px-2 cursor-pointer transition-colors thai-font',
          isActive ? 'bg-brutal-yellow border-[2px] border-black font-bold text-black' : 'hover:bg-brutal-gray',
          depth > 0 && 'ml-4 border-l-2 border-gray-300 pl-4'
        )}
        style={{ paddingLeft: depth > 0 ? `${depth * 12 + 8}px` : '8px' }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 hover:bg-brutal-gray border border-transparent hover:border-gray-300 transition-all"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ) : (
          <span className="w-6" />
        )}

        <Link
          href={`/products?category=${category.slug}`}
          className="flex items-center gap-2 flex-1"
        >
          <div className={cn(
            "w-6 h-6 flex items-center justify-center border-[2px] border-black",
            isExpanded ? "bg-brutal-yellow" : "bg-gray-100"
          )}
            style={isExpanded ? { boxShadow: '1px 1px 0 0 #000000' } : {}}
          >
            {isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-black" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-gray-500" />
            )}
          </div>
          <span className={cn('font-bold', isActive && 'text-black')}>
            {category.name}
          </span>          {category.productCount !== undefined && (
            <span className="text-xs bg-brutal-gray px-2 py-0.5 font-bold text-gray-600 border border-gray-300 ml-auto">
              {category.productCount}
            </span>
          )}
        </Link>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1">
          {category.children!.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              depth={depth + 1}
              maxDepth={maxDepth}
              activeSlug={activeSlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTree({
  categories,
  className,
  activeSlug,
  maxDepth = 10,
}: CategoryTreeProps) {
  if (!categories || categories.length === 0) {
    return (
      <div className={cn('p-4 text-gray-500 text-center thai-font', className)}>
        ไม่มีหมวดหมู่
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-2 mb-3 px-2">
        <span className="w-1.5 h-4 bg-brutal-pink"></span>
        <h3 className="font-bold text-black thai-font">หมวดหมู่</h3>
      </div>
      {categories.map((category) => (
        <CategoryNode
          key={category.id}
          category={category}
          depth={0}
          maxDepth={maxDepth}
          activeSlug={activeSlug}
        />
      ))}
    </div>
  );
}
