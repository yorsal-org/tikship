const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export interface PaginationParams {
  page: number
  pageSize: number
}

/**
 * Parse and validate pagination parameters with boundary protection
 * @param page - Page number (1-based)
 * @param pageSize - Items per page
 * @param options - Optional overrides for defaults and max
 */
export function parsePagination(
  page: string | null,
  pageSize: string | null,
  options: {
    defaultPage?: number
    defaultPageSize?: number
    maxPageSize?: number
  } = {}
): PaginationParams {
  const {
    defaultPage = DEFAULT_PAGE,
    defaultPageSize = DEFAULT_PAGE_SIZE,
    maxPageSize = MAX_PAGE_SIZE,
  } = options

  const parsedPage = parseInt(page || '')
  const parsedPageSize = parseInt(pageSize || '')

  // NaN protection and minimum value (1)
  const safePage = isNaN(parsedPage) || parsedPage < 1 ? defaultPage : parsedPage

  // NaN protection, minimum value (1), and maximum cap
  const safePageSize = isNaN(parsedPageSize) || parsedPageSize < 1
    ? defaultPageSize
    : Math.min(parsedPageSize, maxPageSize)

  return {
    page: safePage,
    pageSize: safePageSize,
  }
}
