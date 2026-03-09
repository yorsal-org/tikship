'use client'

import { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'

export type PaginationType = 'traditional' | 'loadMore' | 'infinite'

export interface PaginationWrapperProps {
  // Data
  items: unknown[]
  totalCount: number
  currentPage: number
  pageSize: number

  // Pagination type
  type: PaginationType

  // Callbacks
  onPageChange: (page: number) => void
  onLoadMore?: () => void

  // Loading states
  loading?: boolean
  hasMore?: boolean

  // Render function - should render the entire content area including layout
  renderData: (data: unknown[]) => ReactNode

  // Optional customization
  containerClassName?: string
  showSummary?: boolean
  loadMoreText?: string
  loadingText?: string
  noMoreText?: string
  observerTarget?: React.RefObject<HTMLDivElement | null>
}

export function PaginationWrapper({
  items,
  totalCount,
  currentPage,
  pageSize,
  type,
  onPageChange,
  onLoadMore,
  loading = false,
  hasMore = true,
  renderData,
  containerClassName = '',
  showSummary = true,
  loadMoreText = 'Load More',
  loadingText = 'Loading...',
  noMoreText = 'No more items',
  observerTarget,
}: PaginationWrapperProps) {
  const totalPages = Math.ceil(totalCount / pageSize)

  // Traditional pagination - render page buttons
  const renderTraditionalPagination = () => {
    if (totalPages <= 1) return null

    const buttons = []
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        buttons.push(
          <button
            key={i}
            className={`btn btn-sm join-item ${currentPage === i ? 'btn-primary' : ''}`}
            onClick={() => onPageChange(i)}
            disabled={loading}
          >
            {i}
          </button>
        )
      } else if (
        (i === 2 && currentPage > 3) ||
        (i === totalPages - 1 && currentPage < totalPages - 2)
      ) {
        buttons.push(
          <button key={`ellipsis-${i}`} className="btn btn-sm btn-disabled join-item">
            ...
          </button>
        )
      }
    }

    return (
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
        {showSummary && (
          <div className="text-sm text-base-content/60">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
          </div>
        )}

        <div className="join">
          <button
            className="btn btn-sm join-item"
            disabled={currentPage === 1 || loading}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {buttons}

          <button
            className="btn btn-sm join-item"
            disabled={currentPage === totalPages || loading}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // Load more button
  const renderLoadMoreButton = () => {
    if (!hasMore) {
      return (
        <div className="mt-12 text-center">
          <p className="text-base-content/60">{noMoreText}</p>
        </div>
      )
    }

    return (
      <div className="mt-12 flex justify-center">
        <button className="btn btn-primary btn-wide gap-2" onClick={onLoadMore} disabled={loading}>
          {loading ? (
            <>
              <span className="loading loading-spinner loading-sm" />
              {loadingText}
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              {loadMoreText}
            </>
          )}
        </button>
      </div>
    )
  }

  // Infinite scroll indicator and trigger
  const renderInfiniteScrollIndicator = () => {
    return (
      <div ref={observerTarget} className="mt-12 flex justify-center min-h-[100px]">
        {loading && hasMore && <span className="loading loading-spinner loading-lg" />}
        {!hasMore && <p className="text-base-content/60">{noMoreText}</p>}
      </div>
    )
  }

  return (
    <div className={containerClassName}>
      {/* Loading state for initial load */}
      {loading && items.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : !loading && items.length === 0 ? (
        /* Empty state */
        <div className="text-center py-20">
          <p className="text-base-content/60">No items found</p>
        </div>
      ) : (
        /* Render items using custom render function */
        renderData(items)
      )}

      {/* Pagination controls based on type */}
      {items.length > 0 && (
        <>
          {type === 'traditional' && renderTraditionalPagination()}
          {type === 'loadMore' && renderLoadMoreButton()}
          {type === 'infinite' && renderInfiniteScrollIndicator()}
        </>
      )}
    </div>
  )
}
