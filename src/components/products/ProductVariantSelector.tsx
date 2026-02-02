'use client';

import { useState } from 'react';
import { ProductVariant } from '@/lib/services/product-api';
import { cn } from '@/lib/utils';

interface ProductVariantSelectorProps {
  variants: ProductVariant[];
  onSelect: (variant: ProductVariant) => void;
  selectedVariantId?: string;
  className?: string;
}

export function ProductVariantSelector({
  variants,
  onSelect,
  selectedVariantId,
  className,
}: ProductVariantSelectorProps) {
  const [selected, setSelected] = useState<string | undefined>(selectedVariantId);

  const handleSelect = (variant: ProductVariant) => {
    setSelected(variant.id);
    onSelect(variant);
  };

  // Group variants by option name (e.g., "Color", "Size")
  const groupedOptions = variants.reduce((acc, variant) => {
    variant.options?.forEach((option) => {
      if (!acc[option.name]) {
        acc[option.name] = new Map();
      }
      acc[option.name].set(option.value, option);
    });
    return acc;
  }, {} as Record<string, Map<string, { name: string; value: string }>>);

  if (variants.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="font-semibold text-gray-900">Select Option</h3>

      {/* If variants have options, group them */}
      {Object.keys(groupedOptions).length > 0 ? (
        Object.entries(groupedOptions).map(([name, values]) => (
          <div key={name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{name}</label>
            <div className="flex flex-wrap gap-2">
              {Array.from(values.entries()).map(([value]) => {
                // Find variant with this option
                const variantWithOption = variants.find((v) =>
                  v.options?.some((o) => o.name === name && o.value === value)
                );

                if (!variantWithOption) return null;

                const isSelected = selected === variantWithOption.id;
                const isOutOfStock = variantWithOption.stockQuantity <= 0;

                return (
                  <button
                    key={value}
                    onClick={() =>
                      !isOutOfStock && handleSelect(variantWithOption)
                    }
                    disabled={isOutOfStock}
                    className={cn(
                      'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300',
                      isOutOfStock &&
                        'opacity-50 cursor-not-allowed line-through'
                    )}
                  >
                    {value}
                    {variantWithOption.price && (
                      <span className="ml-1 text-xs">
                        (+{variantWithOption.price})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        // Simple variant list (no options)
        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => {
            const isSelected = selected === variant.id;
            const isOutOfStock = variant.stockQuantity <= 0;

            return (
              <button
                key={variant.id}
                onClick={() => !isOutOfStock && handleSelect(variant)}
                disabled={isOutOfStock}
                className={cn(
                  'px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all min-w-[100px]',
                  isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300',
                  isOutOfStock && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div>{variant.name}</div>
                {variant.price && (
                  <div className="text-xs text-gray-500">
                    {variant.price} ฿
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Selected variant info */}
      {selected && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          {(() => {
            const variant = variants.find((v) => v.id === selected);
            if (!variant) return null;
            return (
              <div className="text-sm">
                <span className="font-medium">Selected:</span>{' '}
                {variant.name}
                {variant.sku && (
                  <span className="text-gray-500 ml-2">(SKU: {variant.sku})</span>
                )}
                <div className="mt-1 text-gray-600">
                  Stock: {variant.stockQuantity} available
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
