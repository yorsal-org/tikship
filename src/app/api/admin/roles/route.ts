import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'
import type { CreateRoleBody } from '@/types/api'

/**
 * Get roles
 * @description Retrieve all admin roles with permissions count
 * @tag Admin - Roles
 * @auth bearerAuth
 * @response 200:Returns list of roles
 * @responseSet auth
 * @openapi
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req, [
      PERMISSIONS.ROLE_VIEW,
      PERMISSIONS.ADMIN_USER_ASSIGN_ROLE,
    ])
    if (error) return error

    // Get all roles with permissions count
    const roles = await prisma.adminRole.findMany({
      include: {
        _count: {
          select: {
            adminUsers: true,
            permissions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return ApiResponse.success({ roles })
  } catch (error) {
    console.error('Get roles error:', error)
    return await await ApiResponse.adminError('operation_failed', 500)
  }
}

/**
 * Create role
 * @description Create a new admin role with optional permissions
 * @tag Admin - Roles
 * @auth bearerAuth
 * @body CreateRoleBody
 * @response 201:Role created successfully
 * @responseSet auth
 * @openapi
 */
export async function POST(req: NextRequest) {
  try {
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.ROLE_CREATE)
    if (error) return error

    if (!adminUserId) return await ApiResponse.adminError('unauthorized', 401)

    const { name, description, isDefault, permissionIds } = (await req.json()) as CreateRoleBody

    if (!name) {
      return await ApiResponse.adminError('name_required', 400)
    }

    // Check if role name already exists
    const existingRole = await prisma.adminRole.findUnique({
      where: { name },
    })

    if (existingRole) {
      return await ApiResponse.adminError('role_name_exists', 400)
    }

    // Create role
    const role = await prisma.adminRole.create({
      data: {
        name,
        description,
        isDefault: isDefault || false,
      },
    })

    // Assign permissions if provided
    if (permissionIds && Array.isArray(permissionIds)) {
      await Promise.all(
        permissionIds.map((permissionId: string) =>
          prisma.adminRolePermission.create({
            data: {
              roleId: role.id,
              permissionId,
            },
          })
        )
      )
    }

    // Log audit
    const { logAudit, AUDIT_ACTIONS } = await import('@/lib/audit/service')
    await logAudit({
      adminUserId,
      action: AUDIT_ACTIONS.ROLE_CREATE,
      resource: 'role',
      resourceId: role.id,
      details: { name, description, permissionIds },
    })

    return ApiResponse.success({ role }, 201)
  } catch (error) {
    console.error('Create role error:', error)
    return await await ApiResponse.adminError('operation_failed', 500)
  }
}
