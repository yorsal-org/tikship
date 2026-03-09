/**
 * UI-related type definitions
 */

/**
 * Toast notification variant types
 */
export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

/**
 * Toast position options
 */
export type ToastPosition =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end'

/**
 * Toast data structure
 */
export interface ToastData {
  id: string
  type: ToastVariant
  message: string
  duration?: number
  position?: ToastPosition
}

/**
 * Pagination component props
 */
export interface PaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
  showSummary?: boolean
}
/**
 * DateTimePicker component props
 */
export interface DateTimePickerProps {
  selected: Date | null
  onChange: (date: Date | null) => void
  minDate?: Date
  placeholder?: string
  className?: string
}
