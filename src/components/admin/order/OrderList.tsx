'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Search, Eye, RefreshCw, Download } from 'lucide-react'
import { toast } from '@/lib/utils/toast'
import { Table, Column } from '@/components/ui/Table'
import { OrderDetailsModal } from '@/components/admin/order/OrderDetailsModal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatters } from '@/lib/utils/formatters'
import { truncateId } from '@/lib/utils/string'
import { getOrderStatusVariant } from '@/lib/utils/badge'
import { useApi } from '@/hooks/useApi'
import { useAdminPagination as usePagination } from '@/hooks/useAdminPagination'
import { siteConfig } from '@/config/site'
import type { Order, OrdersListResponse } from '@/types/order'

export function OrderList() {
  const t = useTranslations('admin.orders')
  const router = useRouter()

  const {
    page: currentPage,
    search: searchParam,
    searchInput,
    setSearchInput,
    handlePageChange,
    handleFilterChange: syncFilters,
    getParam,
    pageSize,
  } = usePagination({ pageSize: siteConfig.admin.pageSize })

  const statusParam = getParam('status')
  const paymentProviderParam = getParam('paymentProvider')

  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: siteConfig.admin.pageSize as number,
    total: 0,
    totalPages: 0,
  })

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // API hooks
  const ordersApi = useApi<OrdersListResponse>('/api/admin/orders', 'GET')
  const updateApi = useApi('', 'PATCH')

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
        setOrders(ordersRes.data.orders || [])
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

  const columns: Column<Order>[] = [
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
    </>
  )
}
