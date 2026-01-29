import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names using clsx and then merges Tailwind classes using tailwind-merge.
 * This helps to avoid conflicts when multiple Tailwind classes target the same CSS property.
 * 
 * @param inputs - Class names to combine and merge
 * @returns - String of merged class names
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
