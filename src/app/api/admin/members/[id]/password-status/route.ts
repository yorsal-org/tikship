import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'

/**
 * Check user password status
 * @description Check if user has a password set
 * @tag Admin - Members
 * @auth bearerAuth
 * @response 200:Returns password status
 * @responseSet auth
 * @add 404
 * @openapi
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.USER_VIEW)
    if (error) return error

    const { id } = await params
    if (!adminUserId) return await ApiResponse.adminError('unauthorized', 401)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        password: true,
      },
    })

    if (!user) {
      return await ApiResponse.adminError('user_not_found', 404)
    }

    // Check if user has a password set (not null and not empty)
    const hasPassword = !!user.password

    return ApiResponse.success({ hasPassword })
  } catch (error) {
    console.error('Check member password status error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}
