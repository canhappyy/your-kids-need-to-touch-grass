import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines and merges Tailwind CSS classes using clsx and tailwind-merge.
 *
 * Resolves class conflicts predictably (e.g. `p-4` overridden by `p-2`)
 * while supporting conditional class evaluation.
 *
 * @param inputs - Variable number of class values, objects, or arrays.
 * @returns Merged single class string without style collisions.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
