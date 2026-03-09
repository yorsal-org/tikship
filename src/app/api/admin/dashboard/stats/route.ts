import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/auth/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'

/**
 * Get dashboard statistics
 * @description Retrieve comprehensive dashboard statistics including users, orders, revenue, and trends
 * @tag Admin - Dashboard
 * @auth bearerAuth
 * @response 200:Returns comprehensive dashboard statistics
 * @responseSet auth
 * @openapi
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.ADMIN_USER_VIEW)
    if (error) return error

    // Get date ranges
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const last7Days = new Date(today)
    last7Days.setDate(last7Days.getDate() - 7)
    const last30Days = new Date(today)
    last30Days.setDate(last30Days.getDate() - 30)

    // Fetch all statistics in parallel
    const [
      totalUsers,
      activeUsers,
      totalRoles,
      defaultRoles,
      totalPermissions,
      totalAuditLogs,
      recentAuditLogs,
      totalMembers,
      newMembersToday,
      activeMembersLast7Days,
      totalProducts,
      activeProducts,
      totalOrders,
      completedOrders,
      pendingOrders,
      failedOrders,
      orders,
      usersLast30Days,
      ordersLast30Days,
    ] = await Promise.all([
      // Admin users stats
      prisma.adminUser.count(),
      prisma.adminUser.count({ where: { isActive: true } }),

      // Roles stats
      prisma.adminRole.count(),
      prisma.adminRole.count({ where: { isDefault: true } }),

      // Permissions stats
      prisma.adminPermission.count(),

      // Audit logs stats
      prisma.adminAuditLog.count(),
      prisma.adminAuditLog.count({
        where: {
          createdAt: {
            gte: last7Days,
          },
        },
      }),

      // Members (regular users) stats
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: last7Days,
          },
        },
      }),

      // Products stats
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),

      // Orders stats
      prisma.order.count(),
      prisma.order.count({ where: { status: 'completed' } }),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { status: 'failed' } }),

      // Revenue calculation - group by currency
      prisma.order.findMany({
        where: { status: 'completed' },
        select: { amount: true, currency: true, createdAt: true },
      }),

      // User growth data (last 30 days) - using ORM
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: last30Days,
          },
        },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),

      // Order trend data (last 30 days) - using ORM
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: last30Days,
          },
          status: 'completed',
        },
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

    // Convert to array format
    const totalRevenueByCurrency = Array.from(revenueByCurrency.entries()).map(
      ([currency, amount]) => ({
        currency,
        amount,
      })
    )

    const revenueLastMonthArray = Array.from(revenueLastMonthByCurrency.entries()).map(
      ([currency, amount]) => ({
        currency,
        amount,
      })
    )

    // Process user growth data - group by date
    const userGrowthMap = new Map<string, number>()
    usersLast30Days.forEach(user => {
      const dateStr = user.createdAt.toISOString().split('T')[0]
      userGrowthMap.set(dateStr, (userGrowthMap.get(dateStr) || 0) + 1)
    })
    const userGrowth = Array.from(userGrowthMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

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
      adminUsers: {
        total: totalUsers,
        active: activeUsers,
      },
      roles: {
        total: totalRoles,
        default: defaultRoles,
      },
      permissions: {
        total: totalPermissions,
      },
      auditLogs: {
        total: totalAuditLogs,
        recent: recentAuditLogs,
      },
      members: {
        total: totalMembers,
        newToday: newMembersToday,
        activeLast7Days: activeMembersLast7Days,
      },
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
        userGrowth,
        orderTrend,
      },
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}
