/**
 * String utility functions
 */

/**
 * Truncate a string ID to a specified length
 * @param id - The ID string to truncate
 * @param length - The length to truncate to (default: 8)
 * @param suffix - The suffix to append (default: '...')
 * @returns Truncated string
 */
export function truncateId(id: string, length: number = 8, suffix: string = '...'): string {
  if (!id || id.length <= length) return id
  return id.slice(0, length) + suffix
}

/**
 * Capitalize the first letter of a string
 * @param str - The string to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Convert snake_case or kebab-case to Title Case
 * @param str - The string to convert
 * @returns Title case string
 */
export function toTitleCase(str: string): string {
  if (!str) return str
  return str
    .replace(/[_-]/g, ' ')
    .split(' ')
    .map(word => capitalize(word))
    .join(' ')
}

/**
 * Generate initials from a name
 * @param name - The name to generate initials from
 * @param maxLength - Maximum number of initials (default: 2)
 * @returns Initials string
 */
export function getInitials(name: string, maxLength: number = 2): string {
  if (!name) return ''

  const words = name.trim().split(/\s+/)
  const initials = words
    .slice(0, maxLength)
    .map(word => word.charAt(0).toUpperCase())
    .join('')

  return initials
}

/**
 * Truncate text with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - The suffix to append (default: '...')
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + suffix
}
