import { format } from 'date-fns'

/**
 * Unified formatting utilities for consistent data display across the application
 */
export const formatters = {
  /**
   * Format price with currency symbol
   * @param amount - Amount in cents
   * @param currency - Currency code (e.g., 'usd', 'eur')
   * @returns Formatted price string
   */
  price: (amount: number, currency: string = 'usd'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  },

  /**
   * Format date with full date and time
   * @param dateString - Date string or Date object
   * @param locale - Locale code (default: 'zh-CN')
   * @returns Formatted date string
   */
  date: (dateString: string | Date, locale: string = 'zh-CN'): string => {
    return new Date(dateString).toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  },

  /**
   * Format date in short format (YYYY-MM-DD)
   * @param dateString - Date string or Date object
   * @returns Formatted date string
   */
  dateShort: (dateString: string | Date): string => {
    return format(new Date(dateString), 'yyyy-MM-dd')
  },

  /**
   * Format subscription interval
   * @param mode - Payment mode ('payment' or 'subscription')
   * @param interval - Interval unit (e.g., 'month', 'year')
   * @param intervalCount - Number of intervals
   * @returns Formatted interval string
   */
  interval: (mode: string, interval?: string | null, intervalCount?: number | null): string => {
    if (mode !== 'subscription') return 'One-time payment'
    const count = intervalCount || 1
    return `${count} ${interval}${count > 1 ? 's' : ''}`
  },
}
