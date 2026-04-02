import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit } from '@/lib/audit/service'
import type { UpdatePermissionBody } from '@/types/api'

/**
 * Update permission
 * @description Update a custom permission (only non-system permissions)
 * @tag Admin - Roles
 * @auth bearerAuth
 * @body UpdatePermissionBody
 * @response 200:Permission updated successfully
 * @responseSet auth
 * @add 404
 * @openapi
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.PERMISSION_EDIT)
    if (error) return error

    const { id } = await params
    const { name, description, resource, action } = (await req.json()) as UpdatePermissionBody

    // Check if permission exists
    const permission = await prisma.adminPermission.findUnique({
      where: { id },
    })

    if (!permission) {
      return await ApiResponse.adminError('permission_not_found', 404)
    }

    // Check if it's a system permission
    if (permission.isSystem) {
      return await ApiResponse.adminError('cannot_edit_system_permission', 403)
    }

    // Validate required fields
    if (!name || !resource || !action) {
      return await ApiResponse.adminError('invalid_input', 400)
    }

    // Update permission
    const updatedPermission = await prisma.adminPermission.update({
      where: { id },
      data: {
        name,
        description: description || null,
        resource,
        action,
      },
    })

    // Log audit
    await logAudit({
      adminUserId,
      action: 'update',
      resource: 'permission',
      resourceId: id,
      details: { name, resource, action },
    })

    return ApiResponse.success({ permission: updatedPermission })
  } catch (error) {
    console.error('Update permission error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}

/**
 * Delete permission
 * @description Delete a custom permission (only non-system permissions)
 * @tag Admin - Roles
 * @auth bearerAuth
 * @responseSet auth
 * @add 404
 * @openapi
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.PERMISSION_DELETE)
    if (error) return error

    const { id } = await params

    // Check if permission exists
    const permission = await prisma.adminPermission.findUnique({
      where: { id },
      include: {
        roles: true,
      },
    })

    if (!permission) {
      return await ApiResponse.adminError('permission_not_found', 404)
    }

    // Check if it's a system permission
    if (permission.isSystem) {
      return await ApiResponse.adminError('cannot_delete_system_permission', 403)
    }

    // Check if permission is being used by any roles
    if (permission.roles.length > 0) {
      return await ApiResponse.adminError('permission_in_use', 400)
    }

    // Delete permission
    await prisma.adminPermission.delete({
      where: { id },
    })

    // Log audit
    await logAudit({
      adminUserId,
      action: 'delete',
      resource: 'permission',
      resourceId: id,
      details: { code: permission.code, name: permission.name },
    })

    return ApiResponse.success({ message: 'Permission deleted successfully' })
  } catch (error) {
    console.error('Delete permission error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}
