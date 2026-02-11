import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names using clsx and then merges Tailwind classes using tailwind-merge.
 * This helps to avoid conflicts when multiple Tailwind classes target the same CSS property.
 *
 * @param inputs - Class names to combine and merge
 * @returns - String of merged class names
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Get the minimum price from product types (seagmTypes)
 * Uses sellingPrice if available, falls back to originPrice, then unitPrice
 * @param types - Array of product types with prices
 * @returns Minimum price or 0 if no types
 */
export function getMinPrice(
  types:
    | { sellingPrice?: number; originPrice?: number; unitPrice: number }[]
    | undefined,
): number {
  if (!types || types.length === 0) return 0;
  return Math.min(
    ...types.map((t) => t.sellingPrice ?? t.originPrice ?? t.unitPrice),
  );
}

/**
 * Format price with Thai Baht currency
 * @param price - Price number
 * @returns Formatted price string
 */
export function formatPrice(price: number): string {
  return `฿${price.toFixed(0)}`;
}
