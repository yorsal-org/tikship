'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Package, User, CreditCard, Calendar, FileText } from 'lucide-react'
import { formatters } from '@/lib/utils/formatters'
import { Modal } from '@/components/ui/Modal'
import type { Order } from '@/types/order'

interface OrderDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order
  onUpdateStatus: (orderId: string, newStatus: string) => Promise<void>
}

export function OrderDetailsModal({
  isOpen,
  onClose,
  order,
  onUpdateStatus,
}: OrderDetailsModalProps) {
  const t = useTranslations('admin.orders')
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState(order.status)

  useEffect(() => {
    setNewStatus(order.status)
  }, [order.status])

  const handleUpdateStatus = async () => {
    if (newStatus === order.status) {
      onClose()
      return
    }

    setUpdating(true)
    try {
      await onUpdateStatus(order.id, newStatus)
    } finally {
      setUpdating(false)
    }
  }

  const metadata = order.metadata ? JSON.parse(order.metadata) : {}

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('order_details')}
      maxWidth="3xl"
      showCloseButton
    >
      <div className="space-y-6">
        {/* Order Info */}
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h4 className="font-bold text-lg">{t('order_info')}</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-base-content/60">{t('order_id')}</div>
                <div className="font-mono text-sm mt-1">{order.id}</div>
              </div>
              <div>
                <div className="text-sm text-base-content/60">{t('payment_provider')}</div>
                <div className="font-medium mt-1 capitalize">{order.paymentProvider}</div>
              </div>
              {order.stripeSessionId && (
                <div>
                  <div className="text-sm text-base-content/60">{t('stripe_session_id')}</div>
                  <div className="font-mono text-sm mt-1 truncate">{order.stripeSessionId}</div>
                </div>
              )}
              {order.paypalOrderId && (
                <div>
                  <div className="text-sm text-base-content/60">{t('paypal_order_id')}</div>
                  <div className="font-mono text-sm mt-1 truncate">{order.paypalOrderId}</div>
                </div>
              )}
              {order.paypalSubscriptionId && (
                <div>
                  <div className="text-sm text-base-content/60">{t('paypal_subscription_id')}</div>
                  <div className="font-mono text-sm mt-1 truncate">
                    {order.paypalSubscriptionId}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-base-content/60">{t('amount')}</div>
                <div className="font-bold text-lg mt-1">
                  {formatters.price(order.amount, order.currency)}
                </div>
              </div>
              <div>
                <div className="text-sm text-base-content/60">{t('status')}</div>
                <div className="mt-1">
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    className="select select-bordered select-sm w-full"
                  >
                    <option value="pending">{t('status_pending')}</option>
                    <option value="completed">{t('status_completed')}</option>
                    <option value="failed">{t('status_failed')}</option>
                    <option value="refunded">{t('status_refunded')}</option>
                    <option value="expired">{t('status_expired')}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-primary" />
              <h4 className="font-bold text-lg">{t('product_info')}</h4>
            </div>
            <div className="flex items-start gap-4">
              {order.product.image && (
                <div className="avatar">
                  <div className="w-20 h-20 rounded-lg relative">
                    <Image
                      src={order.product.image}
                      alt={order.product.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                </div>
              )}
              <div className="flex-1">
                <div className="font-bold text-lg">{order.product.name}</div>
                {order.product.description && (
                  <div className="text-sm text-base-content/70 mt-2">
                    {order.product.description}
                  </div>
                )}
                <div className="text-xs text-base-content/50 mt-2">ID: {order.product.id}</div>
              </div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h4 className="font-bold text-lg">{t('user_info')}</h4>
            </div>
            {order.user ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-base-content/60">{t('user_name')}</div>
                  <div className="font-medium mt-1">{order.user.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-base-content/60">{t('user_email')}</div>
                  <div className="font-medium mt-1">{order.user.email}</div>
                </div>
                <div>
                  <div className="text-sm text-base-content/60">{t('user_id')}</div>
                  <div className="font-mono text-sm mt-1">{order.user.id}</div>
                </div>
                {order.stripeCustomerId && (
                  <div>
                    <div className="text-sm text-base-content/60">{t('stripe_customer_id')}</div>
                    <div className="font-mono text-sm mt-1">{order.stripeCustomerId}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-base-content/60">{t('guest_order')}</div>
            )}
          </div>
        </div>

        {/* Timestamps */}
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h4 className="font-bold text-lg">{t('timestamps')}</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-base-content/60">{t('created_at')}</div>
                <div className="font-medium mt-1">{formatters.date(order.createdAt)}</div>
              </div>
              <div>
                <div className="text-sm text-base-content/60">{t('updated_at')}</div>
                <div className="font-medium mt-1">{formatters.date(order.updatedAt)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Metadata */}
        {Object.keys(metadata).length > 0 && (
          <div className="card bg-base-200">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-primary" />
                <h4 className="font-bold text-lg">{t('metadata')}</h4>
              </div>
              <pre className="text-xs bg-base-300 p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="modal-action">
        <button onClick={onClose} className="btn btn-ghost">
          {t('cancel')}
        </button>
        <button
          onClick={handleUpdateStatus}
          className="btn btn-primary"
          disabled={updating || newStatus === order.status}
        >
          {updating ? <span className="loading loading-spinner loading-sm" /> : t('save')}
        </button>
      </div>
    </Modal>
  )
}
