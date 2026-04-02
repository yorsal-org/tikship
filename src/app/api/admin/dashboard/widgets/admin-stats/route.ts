import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'

/**
 * Get admin system stats (always available)
 * Admin users, roles, permissions, audit logs
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.ADMIN_USER_VIEW)
    if (error) return error

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const last7Days = new Date(today)
    last7Days.setDate(last7Days.getDate() - 7)

    const [
      totalUsers,
      activeUsers,
      totalRoles,
      defaultRoles,
      totalPermissions,
      totalAuditLogs,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.adminUser.count(),
      prisma.adminUser.count({ where: { isActive: true } }),
      prisma.adminRole.count(),
      prisma.adminRole.count({ where: { isDefault: true } }),
      prisma.adminPermission.count(),
      prisma.adminAuditLog.count(),
      prisma.adminAuditLog.count({
        where: { createdAt: { gte: last7Days } },
      }),
    ])

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
    })
  } catch (error) {
    console.error('Get admin stats error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}
