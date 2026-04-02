import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'

/**
 * Get product statistics
 * @description Retrieve product statistics including total count, active/inactive status, and revenue
 * @tag Admin - Products
 * @auth bearerAuth
 * @response 200:Returns product statistics
 * @responseSet auth
 * @openapi
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.PRODUCT_VIEW)
    if (error) return error

    const [total, active, inactive, orders] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: false } }),
      prisma.order.findMany({
        where: { status: 'completed' },
        select: { amount: true, currency: true },
      }),
    ])

    // Calculate revenue by currency
    const revenueByCurrency = new Map<string, number>()
    orders.forEach(order => {
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
      active,
      inactive,
      totalRevenueByCurrency,
    })
  } catch (error) {
    console.error('Get product stats error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}
