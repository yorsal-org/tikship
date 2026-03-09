'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export interface UsePaginationOptions {
  pageSize?: number
  debounceMs?: number
}

/**
 * Hook to manage pagination and search state synchronized with URL parameters.
 */
export function useAdminPagination({ pageSize = 20, debounceMs = 500 }: UsePaginationOptions = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')

  const page = parseInt(searchParams.get('page') || '1', 10)
  const search = searchParams.get('search') || ''

  // Update local search input if URL changes externally (e.g., browser back button)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || ''
    if (searchInput !== urlSearch) {
      setSearchInput(urlSearch)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Debounce search input to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentUrlSearch = searchParams.get('search') || ''
      if (searchInput !== currentUrlSearch) {
        const params = new URLSearchParams(searchParams.toString())
        if (searchInput) {
          params.set('search', searchInput)
        } else {
          params.delete('search')
        }
        params.set('page', '1')
        router.push(`?${params.toString()}`)
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [searchInput, debounceMs, router, searchParams])

  /**
   * Navigate to a specific page
   */
  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', newPage.toString())
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  /**
   * Update multiple filter parameters at once and reset to page 1
   */
  const handleFilterChange = useCallback(
    (filters: Record<string, string | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      })
      params.set('page', '1')
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  /**
   * Get a parameter value from the URL or return a default
   */
  const getParam = useCallback(
    (key: string, defaultValue: string = '') => {
      return searchParams.get(key) || defaultValue
    },
    [searchParams]
  )

  return {
    page,
    search,
    searchInput,
    setSearchInput,
    handlePageChange,
    handleFilterChange,
    getParam,
    searchParams,
    pageSize,
  }
}
