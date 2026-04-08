'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PaginationProps } from '@/types/ui'

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  showSummary = true,
  loading = false,
}: PaginationProps & { onPageSizeChange?: (pageSize: number) => void; loading?: boolean }) {
  const t = useTranslations('common.pagination')
  const [inputValue, setInputValue] = useState<string>(pageSize.toString())

  useEffect(() => {
    setInputValue(pageSize.toString())
  }, [pageSize])

  const handlePageSizeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handlePageSizeInputBlur = () => {
    const val = parseInt(inputValue, 10)
    if (val >= 10 && val <= 100) {
      onPageSizeChange?.(val)
    } else {
      setInputValue(pageSize.toString())
    }
  }

  const handlePageSizeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = parseInt(inputValue, 10)
      if (val >= 10 && val <= 100) {
        onPageSizeChange?.(val)
      } else {
        setInputValue(pageSize.toString())
      }
    }
  }

  const renderPageButtons = () => {
    const buttons = []

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        buttons.push(
          <button
            key={i}
            className={`btn btn-sm join-item ${currentPage === i ? 'btn-primary' : ''}`}
            disabled={loading}
            onClick={() => onPageChange(i)}
          >
            {i}
          </button>
        )
      } else if (
        (i === 2 && currentPage > 3) ||
        (i === totalPages - 1 && currentPage < totalPages - 2)
      ) {
        buttons.push(
          <button key={i} className="btn btn-sm btn-disabled join-item">
            ...
          </button>
        )
      }
    }

    return buttons
  }

  return (
    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-base-200">
      <div className="flex items-center gap-4">
        {showSummary && (
          <div className="text-sm text-base-content/60">
            {t('showing_results', {
              from: (currentPage - 1) * pageSize + 1,
              to: Math.min(currentPage * pageSize, totalCount),
              total: totalCount,
            })}
          </div>
        )}
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-base-content/60">{t('per_page')}:</label>
            <input
              type="number"
              min="10"
              max="100"
              value={inputValue}
              onChange={handlePageSizeInputChange}
              onBlur={handlePageSizeInputBlur}
              onKeyDown={handlePageSizeInputKeyDown}
              className="input input-sm input-bordered w-16"
            />
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="join">
          <button
            className="btn btn-sm join-item"
            disabled={currentPage === 1 || loading}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {renderPageButtons()}

          <button
            className="btn btn-sm join-item"
            disabled={currentPage === totalPages || loading}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
