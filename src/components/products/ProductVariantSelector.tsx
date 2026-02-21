"use client";

import { useState } from "react";
import { ProductVariant } from "@/lib/services/product-api";
import { cn } from "@/lib/utils";
import { motion } from "@/lib/framer-exports";

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
  const [selected, setSelected] = useState<string | undefined>(
    selectedVariantId,
  );

  const handleSelect = (variant: ProductVariant) => {
    setSelected(variant.id);
    onSelect(variant);
  };

  // Group variants by option name (e.g., "Color", "Size")
  const groupedOptions = variants.reduce(
    (acc, variant) => {
      variant.options?.forEach((option) => {
        if (!acc[option.name]) {
          acc[option.name] = new Map();
        }
        acc[option.name].set(option.value, option);
      });
      return acc;
    },
    {} as Record<string, Map<string, { name: string; value: string }>>,
  );

  if (variants.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="font-bold text-black thai-font">เลือกตัวเลือก</h3>

      {/* If variants have options, group them */}
      {Object.keys(groupedOptions).length > 0 ? (
        Object.entries(groupedOptions).map(([name, values]) => (
          <div key={name} className="space-y-2">
            <label className="text-sm font-bold text-gray-700 thai-font">
              {name}
            </label>
            <div className="flex flex-wrap gap-2">
              {Array.from(values.entries()).map(([value]) => {
                // Find variant with this option
                const variantWithOption = variants.find((v) =>
                  v.options?.some((o) => o.name === name && o.value === value),
                );

                if (!variantWithOption) return null;

                const isSelected = selected === variantWithOption.id;
                const isOutOfStock = variantWithOption.stockQuantity <= 0;

                return (
                  <motion.button
                    key={value}
                    onClick={() =>
                      !isOutOfStock && handleSelect(variantWithOption)
                    }
                    disabled={isOutOfStock}
                    whileHover={
                      !isOutOfStock
                        ? { y: -2, boxShadow: "3px 3px 0 0 #000000" }
                        : {}
                    }
                    whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
                    className={cn(
                      "px-4 py-2 border-[3px] text-sm font-bold transition-all thai-font",
                      isSelected
                        ? "border-black bg-brutal-yellow text-black"
                        : "border-gray-200 bg-white hover:border-gray-400",
                      isOutOfStock &&
                        "opacity-50 cursor-not-allowed line-through",
                    )}
                    style={
                      isSelected ? { boxShadow: "3px 3px 0 0 #000000" } : {}
                    }
                  >
                    {value}
                    {variantWithOption.price && (
                      <span className="ml-1 text-xs">
                        (+{variantWithOption.price})
                      </span>
                    )}
                  </motion.button>
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
              <motion.button
                key={variant.id}
                onClick={() => !isOutOfStock && handleSelect(variant)}
                disabled={isOutOfStock}
                whileHover={
                  !isOutOfStock
                    ? { y: -2, boxShadow: "3px 3px 0 0 #000000" }
                    : {}
                }
                whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
                className={cn(
                  "px-4 py-3 border-[3px] text-sm font-bold transition-all min-w-[100px] thai-font",
                  isSelected
                    ? "border-black bg-brutal-yellow text-black"
                    : "border-gray-200 bg-white hover:border-gray-400",
                  isOutOfStock && "opacity-50 cursor-not-allowed",
                )}
                style={isSelected ? { boxShadow: "3px 3px 0 0 #000000" } : {}}
              >
                <div>{variant.name}</div>
                {variant.price && (
                  <div className="text-xs text-gray-600">{variant.price} ฿</div>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Selected variant info */}
      {selected && (
        <div
          className="mt-4 p-4 bg-brutal-gray border-[2px] border-black"
          style={{ boxShadow: "3px 3px 0 0 #000000" }}
        >
          {(() => {
            const variant = variants.find((v) => v.id === selected);
            if (!variant) return null;
            return (
              <div className="text-sm">
                <span className="font-bold text-black thai-font">
                  ที่เลือก:
                </span>{" "}
                <span className="text-black font-medium">{variant.name}</span>
                {variant.sku && (
                  <span className="text-gray-500 ml-2 font-medium">
                    (SKU: {variant.sku})
                  </span>
                )}
                <div className="mt-1 text-gray-600 font-medium">
                  สต็อก: {variant.stockQuantity} ชิ้น
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
