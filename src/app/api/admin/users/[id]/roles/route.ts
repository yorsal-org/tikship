import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/auth/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit/service'
import type { AssignAdminUserRolesBody } from '@/types/api'

/**
 * Assign roles to admin user
 * @description Assign or update roles for a specific admin user
 * @tag Admin - Users
 * @auth bearerAuth
 * @body AssignAdminUserRolesBody
 * @response 200:Roles assigned successfully
 * @responseSet auth
 * @add 404
 * @openapi
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: targetUserId } = await params

    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.ADMIN_USER_ASSIGN_ROLE)
    if (error) return error

    const { roleIds } = (await req.json()) as AssignAdminUserRolesBody

    // Check if target user is superuser
    const targetUser = await prisma.adminUser.findUnique({
      where: { id: targetUserId },
      select: { isSuperuser: true },
    })

    if (!targetUser) {
      return await ApiResponse.adminError('user_not_found', 404)
    }

    // Prevent modifying superuser by others
    if (targetUser.isSuperuser && adminUserId !== targetUserId) {
      return await ApiResponse.adminError('cannot_modify_superuser', 403)
    }

    if (!Array.isArray(roleIds)) {
      return await ApiResponse.adminError('invalid_role_ids', 400)
    }

    // Delete existing roles
    await prisma.adminUserRole.deleteMany({
      where: { adminUserId: targetUserId },
    })

    // Assign new roles
    await Promise.all(
      roleIds.map((roleId: string) =>
        prisma.adminUserRole.create({
          data: {
            adminUserId: targetUserId,
            roleId,
            assignedBy: adminUserId,
          },
        })
      )
    )

    await logAudit({
      adminUserId,
      action: AUDIT_ACTIONS.ADMIN_USER_ASSIGN_ROLE,
      resource: 'admin_user',
      resourceId: targetUserId,
      details: { roleIds },
    })

    return ApiResponse.success({ message: 'Roles assigned successfully' })
  } catch (error) {
    console.error('Assign roles error:', error)
    return await await ApiResponse.adminError('operation_failed', 500)
  }
}
