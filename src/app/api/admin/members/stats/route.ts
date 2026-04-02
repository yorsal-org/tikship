import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'
import { startOfDay, subDays } from 'date-fns'

/**
 * Get member statistics
 * @description Retrieve member statistics including total users, new registrations, and activity metrics
 * @tag Admin - Members
 * @auth bearerAuth
 * @response 200:Returns member statistics
 * @responseSet auth
 * @openapi
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.USER_VIEW)
    if (error) return error

    const now = new Date()
    const todayStart = startOfDay(now)
    const last7DaysStart = startOfDay(subDays(now, 7))

    const [
      totalUsers,
      totalAccounts,
      newToday,
      active7dCount,
      providerStats,
      totalVerificationRequests,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.account.count(),
      prisma.user.count({
        where: { createdAt: { gte: todayStart } },
      }),
      // Native query or distinct count for activity
      prisma.loginAttempt
        .groupBy({
          by: ['userId'],
          where: {
            successful: true,
            userId: { not: null },
            createdAt: { gte: last7DaysStart },
          },
        })
        .then(res => res.length),
      prisma.account.groupBy({
        by: ['provider'],
        _count: {
          userId: true,
        },
      }),
      prisma.emailVerificationCode.count({
        where: { type: 'REGISTER' },
      }),
    ])

    // Calculate conversion rate (approximate)
    const conversionRate =
      totalVerificationRequests > 0
        ? Math.round(((totalUsers - totalAccounts) / totalVerificationRequests) * 100)
        : 0

    return ApiResponse.success({
      totalUsers,
      newToday,
      active7d: active7dCount,
      conversionRate,
      providers: providerStats.map(stat => ({
        provider: stat.provider,
        count: stat._count.userId,
      })),
    })
  } catch (error) {
    console.error('Get member stats error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}
