'use client';

import { ProductAttribute } from '@/lib/services/product-api';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

interface ProductAttributesProps {
  attributes: ProductAttribute[];
  className?: string;
}

export function ProductAttributes({
  attributes,
  className,
}: ProductAttributesProps) {
  if (!attributes || attributes.length === 0) {
    return null;
  }

  // Sort by sortOrder
  const sortedAttributes = [...attributes].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <Info className="w-4 h-4" />
        Product Details
      </h3>

      <div className="bg-gray-50 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {sortedAttributes.map((attr, index) => (
              <tr
                key={attr.id}
                className={index !== sortedAttributes.length - 1 ? 'border-b border-gray-200' : ''}
              >
                <td className="px-4 py-3 font-medium text-gray-600 w-1/3">
                  {attr.name}
                </td>
                <td className="px-4 py-3 text-gray-900">
                  {attr.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
