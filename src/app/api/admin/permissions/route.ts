import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/auth/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit } from '@/lib/audit/service'
import type { CreatePermissionBody } from '@/types/api'

/**
 * Get permissions
 * @description Retrieve all available permissions from database
 * @tag Admin - Roles
 * @auth bearerAuth
 * @response 200:Returns list of permissions
 * @responseSet auth
 * @openapi
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req, [
      PERMISSIONS.PERMISSION_VIEW,
      PERMISSIONS.ROLE_ASSIGN_PERMISSION,
    ])
    if (error) return error

    // Get all permissions from database
    const permissions = await prisma.adminPermission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    })

    return ApiResponse.success({
      permissions,
    })
  } catch (error) {
    console.error('Get permissions error:', error)
    return await await ApiResponse.adminError('operation_failed', 500)
  }
}

/**
 * Create permission
 * @description Create a custom permission (non-system)
 * @tag Admin - Roles
 * @auth bearerAuth
 * @body CreatePermissionBody
 * @response 200:Permission created successfully
 * @responseSet auth
 * @openapi
 */
export async function POST(req: NextRequest) {
  try {
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.PERMISSION_CREATE)
    if (error) return error

    const { code, name, description, resource, action } = (await req.json()) as CreatePermissionBody

    // Validate required fields
    if (!code || !name || !resource || !action) {
      return await ApiResponse.adminError('invalid_input', 400)
    }

    // Check if permission code already exists
    const existingPermission = await prisma.adminPermission.findUnique({
      where: { code },
    })

    if (existingPermission) {
      return await ApiResponse.adminError('permission_code_exists', 400)
    }

    // Create custom permission (isSystem defaults to false)
    const permission = await prisma.adminPermission.create({
      data: {
        code,
        name,
        description: description || null,
        resource,
        action,
        isSystem: false,
      },
    })

    // Log audit
    await logAudit({
      adminUserId,
      action: 'create',
      resource: 'permission',
      resourceId: permission.id,
      details: { code, name },
    })

    return ApiResponse.success({ permission })
  } catch (error) {
    console.error('Create permission error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}
