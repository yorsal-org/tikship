import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/auth/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit/service'
import type { AssignRolePermissionsBody } from '@/types/api'

/**
 * Assign permissions to role
 * @description Assign or update permissions for a specific role
 * @tag Admin - Roles
 * @auth bearerAuth
 * @body AssignRolePermissionsBody
 * @response 200:Permissions assigned successfully
 * @responseSet auth
 * @openapi
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: roleId } = await params

    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.ROLE_ASSIGN_PERMISSION)
    if (error) return error

    if (!adminUserId) return await ApiResponse.adminError('unauthorized', 401)

    const { permissionIds } = (await req.json()) as AssignRolePermissionsBody

    if (!Array.isArray(permissionIds)) {
      return await ApiResponse.adminError('invalid_permission_ids', 400)
    }

    // Delete existing permissions
    await prisma.adminRolePermission.deleteMany({
      where: { roleId },
    })

    // Assign new permissions
    await Promise.all(
      permissionIds.map((permissionId: string) =>
        prisma.adminRolePermission.create({
          data: {
            roleId,
            permissionId,
          },
        })
      )
    )

    await logAudit({
      adminUserId,
      action: AUDIT_ACTIONS.ROLE_ASSIGN_PERMISSION,
      resource: 'role',
      resourceId: roleId,
      details: { permissionIds },
    })

    return ApiResponse.success({
      message: 'Permissions assigned successfully',
    })
  } catch (error) {
    console.error('Assign permissions error:', error)
    return await await ApiResponse.adminError('operation_failed', 500)
  }
}
