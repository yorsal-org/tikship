import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'

/**
 * Get commerce stats (only when commerce module enabled)
 * @description Products, orders, revenue
 * @tag Admin - Dashboard
 * @auth bearerAuth
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.ADMIN_USER_VIEW)
    if (error) return error

    const now = new Date()
    const last30Days = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    last30Days.setDate(last30Days.getDate() - 30)

    const [
      totalProducts,
      activeProducts,
      totalOrders,
      completedOrders,
      pendingOrders,
      failedOrders,
      orders,
      ordersLast30Days,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'completed' } }),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { status: 'failed' } }),
      prisma.order.findMany({
        where: { status: 'completed' },
        select: { amount: true, currency: true, createdAt: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: last30Days }, status: 'completed' },
        select: { createdAt: true, amount: true, currency: true },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    // Calculate total revenue by currency
    const revenueByCurrency = new Map<string, number>()
    orders.forEach(order => {
      const currency = order.currency.toUpperCase()
      revenueByCurrency.set(currency, (revenueByCurrency.get(currency) || 0) + order.amount)
    })

    // Calculate revenue for last 30 days by currency
    const revenueLastMonthByCurrency = new Map<string, number>()
    orders
      .filter(order => order.createdAt >= last30Days)
      .forEach(order => {
        const currency = order.currency.toUpperCase()
        revenueLastMonthByCurrency.set(
          currency,
          (revenueLastMonthByCurrency.get(currency) || 0) + order.amount
        )
      })

    const totalRevenueByCurrency = Array.from(revenueByCurrency.entries()).map(
      ([currency, amount]) => ({ currency, amount })
    )

    const revenueLastMonthArray = Array.from(revenueLastMonthByCurrency.entries()).map(
      ([currency, amount]) => ({ currency, amount })
    )

    // Process order trend data - group by date and currency
    const orderTrendMap = new Map<string, { count: number; revenueByCurrency: Map<string, number> }>()
    ordersLast30Days.forEach(order => {
      const dateStr = order.createdAt.toISOString().split('T')[0]
      const existing = orderTrendMap.get(dateStr) || { count: 0, revenueByCurrency: new Map() }
      const currency = order.currency.toUpperCase()
      existing.revenueByCurrency.set(
        currency,
        (existing.revenueByCurrency.get(currency) || 0) + order.amount
      )
      orderTrendMap.set(dateStr, {
        count: existing.count + 1,
        revenueByCurrency: existing.revenueByCurrency,
      })
    })
    const orderTrend = Array.from(orderTrendMap.entries())
      .map(([date, data]) => ({
        date,
        count: data.count,
        revenueByCurrency: Array.from(data.revenueByCurrency.entries()).map(([currency, amount]) => ({
          currency,
          amount,
        })),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return ApiResponse.success({
      products: {
        total: totalProducts,
        active: activeProducts,
      },
      orders: {
        total: totalOrders,
        completed: completedOrders,
        pending: pendingOrders,
        failed: failedOrders,
      },
      revenue: {
        byCurrency: totalRevenueByCurrency,
        lastMonth: revenueLastMonthArray,
      },
      charts: {
        orderTrend,
      },
    })
  } catch (error) {
    console.error('Get commerce stats error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}
