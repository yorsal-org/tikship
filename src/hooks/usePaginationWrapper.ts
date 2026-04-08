'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { PaginationType } from '@/components/ui/PaginationWrapper'

export interface UsePaginationWrapperOptions<T> {
  fetchFunction: (page: number, pageSize: number) => Promise<{ items: T[]; totalCount: number }>
  pageSize?: number
  type?: PaginationType
  initialPage?: number
}

export interface UsePaginationWrapperReturn<T> {
  items: T[]
  currentPage: number
  totalCount: number
  pageSize: number
  loading: boolean
  hasMore: boolean
  error: Error | null
  goToPage: (page: number) => void
  loadMore: () => void
  refresh: () => void
  setType: (type: PaginationType) => void
  type: PaginationType
  observerTarget: React.RefObject<HTMLDivElement | null>
}

/**
 * Hook to manage pagination with data fetching for use with PaginationWrapper component.
 * Supports traditional, loadMore, and infinite scroll pagination types.
 */
export function usePaginationWrapper<T>({
  fetchFunction,
  pageSize = 12,
  type = 'traditional',
  initialPage = 1,
}: UsePaginationWrapperOptions<T>): UsePaginationWrapperReturn<T> {
  const [items, setItems] = useState<T[]>([])
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [paginationType, setPaginationType] = useState<PaginationType>(type)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const hasMore = currentPage * pageSize < totalCount

  const fetchData = useCallback(
    async (page: number, append = false) => {
      setLoading(true)
      setError(null)

      try {
        const result = await fetchFunction(page, pageSize)

        if (append) {
          setItems(prev => [...prev, ...result.items])
        } else {
          setItems(result.items)
        }

        setTotalCount(result.totalCount)
        setCurrentPage(page)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch data'))
      } finally {
        setLoading(false)
      }
    },
    [fetchFunction, pageSize]
  )

  // Initial load
  useEffect(() => {
    fetchData(initialPage)
  }, [fetchData, initialPage])

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > Math.ceil(totalCount / pageSize)) return

      fetchData(page, false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [fetchData, totalCount, pageSize]
  )

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return

    const nextPage = currentPage + 1
    fetchData(nextPage, true)
  }, [hasMore, loading, currentPage, fetchData])

  // Infinite scroll observer
  useEffect(() => {
    if (paginationType !== 'infinite') return

    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    }

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const target = entries[0]
      if (target.isIntersecting && hasMore && !loading) {
        loadMore()
      }
    }

    observerRef.current = new IntersectionObserver(handleIntersection, options)

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [paginationType, hasMore, loading, loadMore])

  const refresh = useCallback(() => {
    setCurrentPage(initialPage)
    setItems([])
    fetchData(initialPage, false)
  }, [fetchData, initialPage])

  const setType = useCallback(
    (newType: PaginationType) => {
      setPaginationType(newType)
      // Reset to first page when switching pagination type
      setCurrentPage(initialPage)
      setItems([])
      fetchData(initialPage, false)
    },
    [fetchData, initialPage]
  )

  return {
    items,
    currentPage,
    totalCount,
    pageSize,
    loading,
    hasMore,
    error,
    goToPage,
    loadMore,
    refresh,
    setType,
    type: paginationType,
    observerTarget: loadMoreRef,
  }
}
