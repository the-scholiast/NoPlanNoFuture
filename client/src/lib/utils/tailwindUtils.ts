import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * A utility function for intelligently merging Tailwind CSS classes.
 * 
 * This function combines two powerful libraries:
 * - `clsx`: Handles conditional class logic and various input types
 * - `twMerge`: Resolves Tailwind CSS class conflicts by keeping the most specific classes
 * 
 * @param inputs - Any number of class values that can be:
 *   - strings: "px-4 py-2"
 *   - objects: { "bg-red-500": isError }
 *   - arrays: ["text-sm", condition && "font-bold"]
 *   - nested combinations of the above
 *  
 * @returns A string of merged CSS classes with conflicts resolved
 * 
 * @example
 * // Basic usage with string concatenation
 * cn("px-4 py-2", "bg-blue-500")
 * // Returns: "px-4 py-2 bg-blue-500"
 * 
 * @example
 * // Conflict resolution - twMerge keeps the last conflicting class
 * cn("px-2 py-4", "px-6")
 * // Returns: "py-4 px-6" (px-2 is removed, px-6 is kept)
 * 
 * @example
 * // Conditional classes using clsx
 * cn("base-class", {
 *   "text-red-500": hasError,
 *   "text-green-500": isSuccess
 * })
 * 
 * @example
 * // Common pattern in components - merging base styles with custom className
 * cn("bg-accent animate-pulse rounded-md", className)
 * // Allows components to have default styles while accepting custom overrides
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}