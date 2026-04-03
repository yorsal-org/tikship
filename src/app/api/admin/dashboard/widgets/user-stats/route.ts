import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'

/**
 * Get user/member stats (only when user module enabled)
 * @description Members, user growth
 * @tag Admin - Dashboard
 * @auth bearerAuth
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.ADMIN_USER_VIEW)
    if (error) return error

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const last7Days = new Date(today)
    last7Days.setDate(last7Days.getDate() - 7)
    const last30Days = new Date(today)
    last30Days.setDate(last30Days.getDate() - 30)

    const [totalMembers, newTodayMembers, recentMembers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: last30Days } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    // Count users who logged in within the last 7 days
    const activeLast7Days = await prisma.user.count({
      where: {
        lastLoginAt: { gte: last7Days },
      },
    })

    // Process user growth data - group by date
    const userGrowthMap = new Map<string, number>()
    recentMembers.forEach(user => {
      const dateStr = user.createdAt.toISOString().split('T')[0]
      userGrowthMap.set(dateStr, (userGrowthMap.get(dateStr) || 0) + 1)
    })
    const userGrowth = Array.from(userGrowthMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return ApiResponse.success({
      members: {
        total: totalMembers,
        newToday: newTodayMembers,
        activeLast7Days,
      },
      charts: {
        userGrowth,
      },
    })
  } catch (error) {
    console.error('Get user stats error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}
