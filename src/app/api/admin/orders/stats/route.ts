import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'

/**
 * Get order statistics
 * @description Retrieve order statistics including total count, status breakdown, and revenue
 * @tag Admin - Orders
 * @auth bearerAuth
 * @response 200:Returns order statistics
 * @responseSet auth
 * @openapi
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.ORDER_VIEW)
    if (error) return error

    const [total, completed, pending, failed, completedOrders] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'completed' } }),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { status: 'failed' } }),
      prisma.order.findMany({
        where: { status: 'completed' },
        select: { amount: true, currency: true },
      }),
    ])

    // Calculate revenue by currency
    const revenueByCurrency = new Map<string, number>()
    completedOrders.forEach(order => {
      const currency = order.currency.toUpperCase()
      revenueByCurrency.set(currency, (revenueByCurrency.get(currency) || 0) + order.amount)
    })

    const totalRevenueByCurrency = Array.from(revenueByCurrency.entries()).map(
      ([currency, amount]) => ({
        currency,
        amount,
      })
    )

    return ApiResponse.success({
      total,
      completed,
      pending,
      failed,
      totalRevenueByCurrency,
    })
  } catch (error) {
    console.error('Get order stats error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}
