'use client'

import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PaginationProps } from '@/types/ui'

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  showSummary = true,
}: PaginationProps) {
  const t = useTranslations('common.pagination')

  if (totalPages <= 1) return null

  const renderPageButtons = () => {
    const buttons = []

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        buttons.push(
          <button
            key={i}
            className={`btn btn-sm join-item ${currentPage === i ? 'btn-primary' : ''}`}
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
      {showSummary && (
        <div className="text-sm text-base-content/60">
          {t('showing_results', {
            from: (currentPage - 1) * pageSize + 1,
            to: Math.min(currentPage * pageSize, totalCount),
            total: totalCount,
          })}
        </div>
      )}

      <div className="join">
        <button
          className="btn btn-sm join-item"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {renderPageButtons()}

        <button
          className="btn btn-sm join-item"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
