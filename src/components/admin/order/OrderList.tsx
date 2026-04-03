'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Search, Eye, RefreshCw, Download } from 'lucide-react'
import { DeleteConfirmModal } from '@/components/admin/common/DeleteConfirmModal'
import { toast } from '@/lib/utils/toast'
import { Table, Column } from '@/components/ui/Table'
import { OrderDetailsModal } from '@/components/admin/order/OrderDetailsModal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatters } from '@/lib/utils/formatters'
import { truncateId } from '@/lib/utils/string'
import { getOrderStatusVariant } from '@/lib/utils/badge'
import { useApi } from '@/hooks/useApi'
import { useAdminPagination as usePagination } from '@/hooks/useAdminPagination'
import type { Order, OrdersListResponse } from '@/types/order'

type OrderBulkAction = 'completed' | 'failed' | 'refunded' | 'delete'

export function OrderList() {
  const t = useTranslations('admin.orders')
  const router = useRouter()

  const {
    page: currentPage,
    search: searchParam,
    searchInput,
    setSearchInput,
    handlePageChange,
    handlePageSizeChange,
    handleFilterChange: syncFilters,
    getParam,
    pageSize,
  } = usePagination()

  const statusParam = getParam('status')
  const paymentProviderParam = getParam('paymentProvider')

  const [orders, setOrders] = useState<Order[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pendingBulkAction, setPendingBulkAction] = useState<OrderBulkAction | null>(null)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [pagination, setPagination] = useState({})

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // API hooks
  const ordersApi = useApi<OrdersListResponse>('/api/admin/orders', 'GET')
  const updateApi = useApi('', 'PATCH')
  const bulkOrdersApi = useApi<{ count: number }>('/api/admin/orders', 'PUT')

  const fetchData = useCallback(
    async (page: number) => {
      const ordersRes = await ordersApi.request(undefined, {
        params: {
          page,
          pageSize,
          search: searchParam || undefined,
          status: statusParam || undefined,
          paymentProvider: paymentProviderParam || undefined,
        },
        onError: (err: string) => toast.error(err),
      })

      if (ordersRes.success && ordersRes.data) {
        const nextOrders = ordersRes.data.orders || []
        setOrders(nextOrders)
        setSelectedIds(current => current.filter(id => nextOrders.some(order => order.id === id)))
        setPagination({
          page: ordersRes.data.pagination.page,
          pageSize: ordersRes.data.pagination.pageSize,
          total: ordersRes.data.pagination.total,
          totalPages: ordersRes.data.pagination.totalPages,
        })
      }
    },
    [ordersApi, pageSize, searchParam, statusParam, paymentProviderParam]
  )

  useEffect(() => {
    const loadData = async () => {
      await fetchData(currentPage)
    }
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, searchParam, statusParam, paymentProviderParam])

  const handleStatusFilterChange = (value: string) => {
    syncFilters({ status: value })
  }

  const handlePaymentProviderFilterChange = (value: string) => {
    syncFilters({ paymentProvider: value })
  }

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailsOpen(true)
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const { success } = await updateApi.request(
      { status: newStatus },
      {
        urlOverride: `/api/admin/orders/${orderId}`,
        onError: (err: string) => toast.error(err),
      }
    )

    if (success) {
      toast.success(t('update_success'))
      setIsDetailsOpen(false)
      router.refresh()
      await fetchData(currentPage)
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...(searchParam && { search: searchParam }),
        ...(statusParam && { status: statusParam }),
        ...(paymentProviderParam && { paymentProvider: paymentProviderParam }),
        export: 'true',
      })

      const response = await fetch(`/api/admin/orders?${params}`)
      const result = await response.json()

      if (result.success && result.data) {
        const csv = convertToCSV(result.data.orders)
        downloadCSV(csv, `orders-${new Date().toISOString().split('T')[0]}.csv`)
        toast.success('Export successful')
      } else {
        toast.error('Export failed')
      }
    } catch {
      toast.error('Export failed')
    }
  }

  const convertToCSV = (data: Order[]) => {
    const headers = ['ID', 'Product', 'User', 'Amount', 'Status', 'Created At']
    const rows = data.map(order => [
      order.id,
      order.product.name,
      order.user?.email || 'N/A',
      formatters.price(order.amount, order.currency),
      order.status,
      formatters.date(order.createdAt),
    ])
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  const selectedOrders = useMemo(
    () => orders.filter(order => selectedIds.includes(order.id)),
    [orders, selectedIds]
  )
  const selectedCount = selectedIds.length
  const allSelected = orders.length > 0 && selectedIds.length === orders.length
  const hasNonCompletedSelection = selectedOrders.some(order => order.status !== 'completed')
  const hasNonFailedSelection = selectedOrders.some(order => order.status !== 'failed')
  const hasNonRefundedSelection = selectedOrders.some(order => order.status !== 'refunded')

  const handleToggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : orders.map(order => order.id))
  }

  const handleToggleSelect = (orderId: string) => {
    setSelectedIds(current =>
      current.includes(orderId) ? current.filter(id => id !== orderId) : [...current, orderId]
    )
  }

  const resetBulkState = () => {
    setPendingBulkAction(null)
    setIsBulkModalOpen(false)
  }

  const handleBulkAction = async (action: OrderBulkAction) => {
    if (selectedIds.length === 0) return

    const { success, data } = await bulkOrdersApi.request(
      { ids: selectedIds, action },
      {
        onError: (err: string) => toast.error(err),
      }
    )

    if (success) {
      toast.success(
        t(action === 'delete' ? 'bulk_delete_success' : 'bulk_status_updated', {
          count: data?.count ?? selectedIds.length,
        })
      )
      setSelectedIds([])
      resetBulkState()
      router.refresh()
      await fetchData(currentPage)
    }
  }

  const requestBulkAction = (action: OrderBulkAction) => {
    setPendingBulkAction(action)
    setIsBulkModalOpen(true)
  }

  const handleBulkExport = () => {
    if (selectedOrders.length === 0) return
    const csv = convertToCSV(selectedOrders)
    downloadCSV(csv, `orders-selected-${new Date().toISOString().split('T')[0]}.csv`)
    toast.success(t('export_success'))
  }

  const bulkActionOptions = useMemo(() => {
    const options: { value: OrderBulkAction; label: string }[] = []

    if (hasNonCompletedSelection) {
      options.push({ value: 'completed', label: t('bulk_mark_completed') })
    }
    if (hasNonFailedSelection) {
      options.push({ value: 'failed', label: t('bulk_mark_failed') })
    }
    if (hasNonRefundedSelection) {
      options.push({ value: 'refunded', label: t('bulk_mark_refunded') })
    }

    // Only show delete if all selected orders are failed
    const allFailed = selectedOrders.every(o => o.status === 'failed')
    if (allFailed && selectedCount > 0) {
      options.push({ value: 'delete', label: t('bulk_delete') })
    }

    return options
  }, [hasNonCompletedSelection, hasNonFailedSelection, hasNonRefundedSelection, selectedOrders, selectedCount, t])

  const getBulkModalMessage = () => {
    if (!pendingBulkAction) return ''
    if (pendingBulkAction === 'completed') {
      return t('bulk_mark_completed_confirm', { count: selectedCount })
    }
    if (pendingBulkAction === 'failed') {
      return t('bulk_mark_failed_confirm', { count: selectedCount })
    }
    if (pendingBulkAction === 'refunded') {
      return t('bulk_mark_refunded_confirm', { count: selectedCount })
    }
    return t('bulk_delete_confirm', { count: selectedCount })
  }

  const columns: Column<Order>[] = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={allSelected}
          onChange={handleToggleSelectAll}
          aria-label={t('select_all')}
        />
      ),
      className: 'w-12',
      render: order => (
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={selectedIds.includes(order.id)}
          onChange={() => handleToggleSelect(order.id)}
          aria-label={t('select_item', { name: truncateId(order.id) })}
        />
      ),
    },
    {
      key: 'id',
      label: t('order_id'),
      render: order => <code className="text-xs" title={order.id}>{truncateId(order.id)}</code>,
    },
    {
      key: 'product',
      label: t('product'),
      render: order => (
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 h-10 rounded relative bg-base-200 flex items-center justify-center">
              {order.product.image ? (
                <Image
                  src={order.product.image}
                  alt={order.product.name}
                  fill
                  className="object-cover rounded"
                />
              ) : (
                <svg
                  className="w-5 h-5 text-base-content/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              )}
            </div>
          </div>
          <span className="font-medium">{order.product.name}</span>
        </div>
      ),
    },
    {
      key: 'user',
      label: t('user'),
      render: order =>
        order.user ? (
          <div>
            <div className="font-medium">{order.user.name || 'N/A'}</div>
            <div className="text-sm text-base-content/60">{order.user.email}</div>
          </div>
        ) : (
          <span className="text-base-content/40">Guest</span>
        ),
    },
    {
      key: 'paymentProvider',
      label: t('payment_provider'),
      render: order => (
        <StatusBadge
          status={order.paymentProvider}
          variant={order.paymentProvider === 'stripe' ? 'info' : 'warning'}
        />
      ),
    },
    {
      key: 'amount',
      label: t('amount'),
      render: order => (
        <span className="font-semibold">{formatters.price(order.amount, order.currency)}</span>
      ),
    },
    {
      key: 'status',
      label: t('status'),
      render: order => (
        <StatusBadge
          status={order.status}
          variant={getOrderStatusVariant(order.status)}
          label={t(`status_${order.status}`)}
        />
      ),
    },
    {
      key: 'createdAt',
      label: t('created_at'),
      render: order => <span className="text-sm">{formatters.date(order.createdAt)}</span>,
    },
    {
      key: 'actions',
      label: t('actions'),
      render: order => (
        <button
          onClick={() => handleViewDetails(order)}
          className="btn btn-ghost btn-sm btn-square"
          title={t('view_details')}
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ]

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-2 text-base-content/70">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchData(currentPage)}
            className="btn btn-ghost gap-2"
            disabled={ordersApi.loading}
          >
            <RefreshCw className={`w-4 h-4 ${ordersApi.loading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </button>
          <button onClick={handleExport} className="btn btn-outline gap-2">
            <Download className="w-4 h-4" />
            {t('export')}
          </button>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="alert bg-base-200 border border-base-300 flex flex-wrap items-center gap-3">
          <span className="font-medium">{t('selected_count', { count: selectedCount })}</span>
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <button className="btn btn-sm btn-outline" onClick={handleBulkExport}>
              <Download className="w-4 h-4" />
              {t('export')}
            </button>
            {bulkActionOptions.map(option => (
              <button
                key={option.value}
                className={`btn btn-sm${option.value === 'delete' ? ' btn-error btn-outline' : ''}`}
                onClick={() => requestBulkAction(option.value)}
                disabled={bulkOrdersApi.loading}
              >
                {option.label}
              </button>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds([])}>
              {t('clear_selection')}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute z-1 left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="input input-bordered w-full pl-10"
          />
        </div>
        <select
          value={statusParam || ''}
          onChange={e => handleStatusFilterChange(e.target.value)}
          className="select select-bordered w-40"
        >
          <option value="">{t('all_status')}</option>
          <option value="pending">{t('status_pending')}</option>
          <option value="completed">{t('status_completed')}</option>
          <option value="failed">{t('status_failed')}</option>
          <option value="refunded">{t('status_refunded')}</option>
        </select>
        <select
          value={paymentProviderParam || ''}
          onChange={e => handlePaymentProviderFilterChange(e.target.value)}
          className="select select-bordered w-40"
        >
          <option value="">{t('all_providers')}</option>
          <option value="stripe">Stripe</option>
          <option value="paypal">PayPal</option>
        </select>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={orders}
        loading={ordersApi.loading}
        emptyMessage={t('no_orders')}
        pagination={pagination}
        onPageSizeChange={handlePageSizeChange}
        onPageChange={handlePageChange}
        getRowKey={order => order.id}
    />

      {/* Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          order={selectedOrder}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      <DeleteConfirmModal
        isOpen={isBulkModalOpen}
        onClose={resetBulkState}
        onConfirm={() => {
          if (pendingBulkAction) {
            void handleBulkAction(pendingBulkAction)
          }
        }}
        loading={bulkOrdersApi.loading}
        title={
          pendingBulkAction === 'delete'
            ? t('bulk_delete')
            : pendingBulkAction === 'completed'
              ? t('bulk_mark_completed')
              : pendingBulkAction === 'failed'
                ? t('bulk_mark_failed')
                : t('bulk_mark_refunded')
        }
        message={getBulkModalMessage()}
        warning={pendingBulkAction === 'delete' ? t('delete_warning') : undefined}
        confirmText={
          pendingBulkAction === 'delete'
            ? t('bulk_delete')
            : pendingBulkAction === 'completed'
              ? t('bulk_mark_completed')
              : pendingBulkAction === 'failed'
                ? t('bulk_mark_failed')
                : t('bulk_mark_refunded')
        }
      />
    </>
  )
}
