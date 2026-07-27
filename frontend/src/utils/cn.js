import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes intelligently — resolves conflicts.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
