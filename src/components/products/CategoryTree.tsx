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
          'flex items-center gap-1 py-2 px-2 rounded-lg cursor-pointer transition-colors',
          isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100',
          depth > 0 && 'ml-4 border-l border-gray-200 pl-4'
        )}
        style={{ paddingLeft: depth > 0 ? `${depth * 12 + 8}px` : '8px' }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 hover:bg-gray-200 rounded"
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
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-yellow-500" />
          ) : (
            <Folder className="w-4 h-4 text-gray-400" />
          )}
          <span className={cn('font-medium', isActive && 'text-blue-700')}>
            {category.name}
          </span>          {category.productCount !== undefined && (
            <span className="text-xs text-gray-500 ml-auto">
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
      <div className={cn('p-4 text-gray-500 text-center', className)}>
        No categories available
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      <h3 className="font-semibold text-gray-900 mb-3 px-2">Categories</h3>
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
