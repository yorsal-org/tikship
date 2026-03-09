import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/auth/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit/service'
import type { UpdateRoleBody } from '@/types/api'

/**
 * Get role details
 * @description Get role details with permissions and user count
 * @tag Admin - Roles
 * @auth bearerAuth
 * @response 200:Returns role details
 * @responseSet auth
 * @add 404
 * @openapi
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { error } = await requireAdminAuth(req, [
      PERMISSIONS.ROLE_VIEW,
      PERMISSIONS.ROLE_ASSIGN_PERMISSION,
    ])
    if (error) return error

    const role = await prisma.adminRole.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            adminUsers: true,
          },
        },
      },
    })

    if (!role) {
      return await ApiResponse.adminError('role_not_found', 404)
    }

    return ApiResponse.success({ role })
  } catch (error) {
    console.error('Get role error:', error)
    return await await ApiResponse.adminError('operation_failed', 500)
  }
}

/**
 * Update role
 * @description Update role information and permissions
 * @tag Admin - Roles
 * @auth bearerAuth
 * @body UpdateRoleBody
 * @response 200:Role updated successfully
 * @responseSet auth
 * @openapi
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.ROLE_EDIT)
    if (error) return error

    if (!adminUserId) return await ApiResponse.adminError('unauthorized', 401)

    const { name, description, isDefault, permissionIds } = (await req.json()) as UpdateRoleBody

    const role = await prisma.adminRole.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isDefault !== undefined && { isDefault }),
      },
    })

    // Update permissions if provided
    if (permissionIds && Array.isArray(permissionIds)) {
      // Remove existing permissions
      await prisma.adminRolePermission.deleteMany({
        where: { roleId: id },
      })

      // Add new permissions
      if (permissionIds.length > 0) {
        await Promise.all(
          permissionIds.map((permissionId: string) =>
            prisma.adminRolePermission.create({
              data: {
                roleId: id,
                permissionId,
              },
            })
          )
        )
      }
    }

    await logAudit({
      adminUserId,
      action: AUDIT_ACTIONS.ROLE_UPDATE,
      resource: 'role',
      resourceId: id,
      details: { name, description, isDefault, permissionIds },
    })

    return ApiResponse.success({ role })
  } catch (error) {
    console.error('Update role error:', error)
    return await await ApiResponse.adminError('operation_failed', 500)
  }
}

/**
 * Update role (alias)
 * @description Update role information and permissions (alias for PATCH)
 * @tag Admin - Roles
 * @auth bearerAuth
 * @body UpdateRoleBody
 * @response 200:Role updated successfully
 * @responseSet auth
 * @openapi
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PATCH(req, { params })
}

/**
 * Delete role
 * @description Delete an admin role
 * @tag Admin - Roles
 * @auth bearerAuth
 * @responseSet auth
 * @openapi
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.ROLE_DELETE)
    if (error) return error

    if (!adminUserId) return await ApiResponse.adminError('unauthorized', 401)

    await prisma.adminRole.delete({
      where: { id },
    })

    await logAudit({
      adminUserId,
      action: AUDIT_ACTIONS.ROLE_DELETE,
      resource: 'role',
      resourceId: id,
    })

    return ApiResponse.success({ message: 'Role deleted successfully' })
  } catch (error) {
    console.error('Delete role error:', error)
    return await await ApiResponse.adminError('operation_failed', 500)
  }
}
