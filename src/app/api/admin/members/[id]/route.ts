import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/auth/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit/service'
import type { UpdateMemberStatusBody } from '@/types/api'

/**
 * Get user details
 * @description Retrieve detailed information about a specific user including accounts and login history
 * @tag Admin - Members
 * @auth bearerAuth
 * @response 200:Returns user details
 * @responseSet auth
 * @add 404
 * @openapi
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.USER_VIEW)
    if (error) return error

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        accounts: {
          select: {
            provider: true,
          },
        },
        _count: {
          select: {
            loginAttempts: {
              where: { successful: true },
            },
          },
        },
      },
    })

    if (!user) {
      return await ApiResponse.adminError('user_not_found', 404)
    }

    return ApiResponse.success({ user })
  } catch (error) {
    console.error('Get member detail error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}

/**
 * Update user status
 * @description Update user's active status (enable/disable account)
 * @tag Admin - Members
 * @auth bearerAuth
 * @body UpdateMemberStatusBody
 * @response 200:User status updated successfully
 * @responseSet auth
 * @openapi
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.USER_EDIT)
    if (error) return error

    const { id } = await params
    if (!adminUserId) return await ApiResponse.adminError('unauthorized', 401)

    const { isActive } = (await req.json()) as UpdateMemberStatusBody

    const user = await prisma.user.update({
      where: { id },
      data: {
        isActive: isActive !== undefined ? isActive : undefined,
      },
    })

    await logAudit({
      adminUserId,
      action: AUDIT_ACTIONS.USER_UPDATE,
      resource: 'user',
      resourceId: user.id,
      details: { isActive },
    })

    return ApiResponse.success({ user })
  } catch (error) {
    console.error('Update member error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}

/**
 * Delete user
 * @description Permanently delete a user account and all associated data
 * @tag Admin - Members
 * @auth bearerAuth
 * @responseSet auth
 * @openapi
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.USER_DELETE)
    if (error) return error

    const { id } = await params
    if (!adminUserId) return await ApiResponse.adminError('unauthorized', 401)

    await prisma.user.delete({
      where: { id },
    })

    await logAudit({
      adminUserId,
      action: AUDIT_ACTIONS.USER_DELETE,
      resource: 'user',
      resourceId: id,
    })

    return ApiResponse.success({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete member error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}
