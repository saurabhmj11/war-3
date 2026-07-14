import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS class names, resolving conflicts using `tailwind-merge`
 * and conditional application using `clsx`.
 *
 * @param inputs - Any number of class values: strings, objects, arrays, or falsy values.
 * @returns A single deduplicated, conflict-resolved class name string.
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-emerald-500', 'text-white')
 * // => 'px-4 py-2 bg-emerald-500 text-white'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
