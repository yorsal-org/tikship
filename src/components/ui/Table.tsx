'use client'

import { ReactNode } from 'react'
import { Pagination } from '@/components/ui/Pagination'

export interface Column<T> {
  key: string
  label: ReactNode
  render: (item: T) => ReactNode
  className?: string
}

export interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  onPageChange?: (page: number) => void
  getRowKey: (item: T) => string
  variant?: 'card' | 'plain'
}

export function Table<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  pagination,
  onPageChange,
  getRowKey,
  variant = 'card',
}: TableProps<T>) {
  const tableContent = (
    <>
      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : data.length === 0 ? (
        <div className="py-12 text-center text-base-content/60">{emptyMessage}</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  {columns.map(column => (
                    <th key={column.key} className={column.className}>
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map(item => (
                  <tr key={getRowKey(item)}>
                    {columns.map(column => (
                      <td key={column.key} className={column.className}>
                        {column.render(item)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && onPageChange && (
            <div className="mt-4">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                pageSize={pagination.pageSize}
                totalCount={pagination.total}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </>
      )}
    </>
  )

  if (variant === 'plain') {
    return <>{tableContent}</>
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">{tableContent}</div>
    </div>
  )
}
