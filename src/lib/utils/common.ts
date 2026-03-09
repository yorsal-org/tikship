import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility for merging Tailwind CSS classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a URL-friendly slug from a string
 * Preserves Unicode characters (Chinese, Japanese, Korean, etc.)
 */
export function generateSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\p{L}\p{N}\-]/gu, '') // Keep letters, numbers, and hyphens (Unicode-aware)
    .replace(/-{2,}/g, '-') // Merge multiple hyphens into one
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Convert MIME types to format names
 * @param mimeTypes Array of MIME types (e.g., ['image/jpeg', 'image/webp'])
 * @returns Array of format names (e.g., ['JPG', 'WebP'])
 */
export function mimeTypesToFormatNames(mimeTypes: readonly string[]): string[] {
  const formatMap: Record<string, string> = {
    'image/jpeg': 'JPG',
    'image/jpg': 'JPG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
    'image/gif': 'GIF',
    'image/svg+xml': 'SVG',
    'image/bmp': 'BMP',
    'image/tiff': 'TIFF',
  }

  return mimeTypes
    .map(
      mimeType =>
        formatMap[mimeType.toLowerCase()] || mimeType.split('/')[1]?.toUpperCase() || mimeType
    )
    .filter((format, index, self) => self.indexOf(format) === index) // Remove duplicates
}
