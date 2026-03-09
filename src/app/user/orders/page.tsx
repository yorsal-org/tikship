'use client'

import { useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Package, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { PaginationWrapper } from '@/components/ui/PaginationWrapper'
import { usePagination } from '@/hooks/usePagination'

interface Product {
  id: string
  name: string
  description: string | null
  image: string | null
  price: number
  currency: string
}

interface Order {
  id: string
  status: string
  amount: number
  currency: string
  paymentProvider: string
  createdAt: string
  updatedAt: string
  product: Product
}

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  pending: {
    label: 'Pending',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    icon: <Clock className="w-4 h-4" />,
  },
  completed: {
    label: 'Completed',
    color: 'text-success',
    bgColor: 'bg-success/10',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  failed: {
    label: 'Failed',
    color: 'text-error',
    bgColor: 'bg-error/10',
    icon: <XCircle className="w-4 h-4" />,
  },
  expired: {
    label: 'Expired',
    color: 'text-base-content/40',
    bgColor: 'bg-base-200',
    icon: <Clock className="w-4 h-4" />,
  },
  refunded: {
    label: 'Refunded',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
    icon: <RefreshCw className="w-4 h-4" />,
  },
}

const paymentProviderConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  stripe: {
    label: 'Stripe',
    color: 'text-info',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
      </svg>
    ),
  },
  paypal: {
    label: 'PayPal',
    color: 'text-warning',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .76-.633h8.14c2.97 0 4.968 1.238 5.49 3.41.218.91.213 1.695-.013 2.39-.23.71-.646 1.315-1.238 1.79-.577.465-1.32.796-2.21 1.004-.866.203-1.88.305-3.016.305h-1.88a.77.77 0 0 0-.76.633l-.52 3.283-.024.13-.48 3.04a.641.641 0 0 1-.633.54zm.633-8.46h1.88c1.137 0 2.15-.102 3.016-.305.89-.208 1.633-.54 2.21-1.004.592-.475 1.008-1.08 1.238-1.79.226-.695.23-1.48.013-2.39-.522-2.172-2.52-3.41-5.49-3.41H2.47L.363 20.597h4.606l.52-3.283.024-.13.48-3.04a.77.77 0 0 1 .76-.633z" />
      </svg>
    ),
  },
}

export default function UserOrdersPage() {
  const { status } = useSession()
  const router = useRouter()

  // Fetch function for pagination
  const fetchOrders = useCallback(async (page: number, pageSize: number) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    })

    const response = await fetch(`/api/user/orders?${params}`)
    const data = await response.json()

    if (data.success && data.data) {
      const orders = data.data.orders
      const totalCount = data.data.pagination.total || orders.length

      return { items: orders, totalCount }
    }

    return { items: [], totalCount: 0 }
  }, [])

  // Use pagination hook
  const {
    items: orders,
    currentPage,
    totalCount,
    pageSize,
    loading,
    goToPage,
  } = usePagination<Order>({
    fetchFunction: fetchOrders,
    pageSize: 10,
    type: 'traditional',
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const renderOrders = useCallback((items: unknown[]) => {
    return (
      <>
        {items.map(item => {
          const order = item as Order
          const statusInfo = statusConfig[order.status] || statusConfig.pending

          return (
            <div
              key={order.id}
              className="p-6 hover:bg-base-200/50 transition-colors border-b border-base-200 last:border-b-0"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  <div className="w-full lg:w-24 h-24 rounded-lg bg-base-200 flex items-center justify-center overflow-hidden">
                    {order.product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={order.product.image}
                        alt={order.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-10 h-10 text-base-content/40" />
                    )}
                  </div>
                </div>

                {/* Order Details */}
                <div className="flex-grow min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold mb-1 truncate">{order.product.name}</h3>
                      <p className="text-xs text-base-content/50 font-mono">Order ID: {order.id}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {/* Payment Provider Badge */}
                      <div
                        className={`badge badge-lg gap-2 ${paymentProviderConfig[order.paymentProvider]?.color || 'text-base-content'}`}
                      >
                        {paymentProviderConfig[order.paymentProvider]?.icon}
                        {paymentProviderConfig[order.paymentProvider]?.label ||
                          order.paymentProvider}
                      </div>
                      {/* Status Badge */}
                      <div
                        className={`badge badge-lg gap-2 ${statusInfo.bgColor} ${statusInfo.color} border-0`}
                      >
                        {statusInfo.icon}
                        {statusInfo.label}
                      </div>
                    </div>
                  </div>

                  {order.product.description && (
                    <p className="text-sm text-base-content/60 mb-4 line-clamp-2">
                      {order.product.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <div>
                      <span className="text-base-content/60">Amount:</span>
                      <span className="font-semibold ml-2">
                        {formatAmount(order.amount, order.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-base-content/60">Payment:</span>
                      <span className="ml-2 capitalize font-medium">
                        {paymentProviderConfig[order.paymentProvider]?.label ||
                          order.paymentProvider}
                      </span>
                    </div>
                    <div>
                      <span className="text-base-content/60">Order Date:</span>
                      <span className="ml-2">{formatDate(order.createdAt)}</span>
                    </div>
                    {order.updatedAt !== order.createdAt && (
                      <div>
                        <span className="text-base-content/60">Last Updated:</span>
                        <span className="ml-2">{formatDate(order.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </>
    )
  }, [])

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">My Orders</h1>
          </div>
          <p className="text-base-content/60">View and manage your order history</p>
        </div>

        {/* Orders List with Pagination */}
        <div className="bg-base-100 border-t border-base-300 overflow-hidden">
          {orders.length === 0 && !loading ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-base-content/20" />
              <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
              <p className="text-base-content/60 mb-6">Start shopping to see your orders here</p>
              <button onClick={() => router.push('/products')} className="btn btn-primary">
                Browse Products
              </button>
            </div>
          ) : (
            <PaginationWrapper
              items={orders}
              totalCount={totalCount}
              currentPage={currentPage}
              pageSize={pageSize}
              type="traditional"
              onPageChange={goToPage}
              loading={loading}
              hasMore={false}
              renderData={renderOrders}
              loadingText="Loading Orders..."
            />
          )}
        </div>
      </div>
    </div>
  )
}
