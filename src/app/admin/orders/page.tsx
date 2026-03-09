'use client'

import { OrderList } from '@/components/admin/order/OrderList'
import { OrderStats } from '@/components/admin/order/OrderStats'

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <OrderStats />
      <OrderList />
    </div>
  )
}
