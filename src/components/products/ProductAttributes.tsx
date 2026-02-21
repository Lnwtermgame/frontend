"use client";

import { ProductAttribute } from "@/lib/services/product-api";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

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
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="font-bold text-black flex items-center gap-2 thai-font">
        <div
          className="w-6 h-6 rounded-lg bg-brutal-blue border-[2px] border-black flex items-center justify-center"
          style={{ boxShadow: "2px 2px 0 0 #000000" }}
        >
          <Info className="w-3 h-3 text-black" />
        </div>
        รายละเอียดสินค้า
      </h3>

      <div
        className="bg-brutal-gray border-[2px] border-black rounded-xl overflow-hidden"
        style={{ boxShadow: "3px 3px 0 0 #000000" }}
      >
        <table className="w-full text-sm">
          <tbody>
            {sortedAttributes.map((attr, index) => (
              <tr
                key={attr.id}
                className={
                  index !== sortedAttributes.length - 1
                    ? "border-b border-gray-200"
                    : ""
                }
              >
                <td className="px-4 py-3 font-bold text-gray-600 w-1/3 thai-font">
                  {attr.name}
                </td>
                <td className="px-4 py-3 text-black font-medium">
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
