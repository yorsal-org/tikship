import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/utils/api-response'
import { prisma } from '@/lib/db/prisma'

/**
 * Get current admin user
 * @description Retrieve the currently authenticated admin user's profile information
 * @tag Admin - Auth
 * @auth bearerAuth
 * @responseSet auth
 * @openapi
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-admin-user-id') as string

    // Fetch fresh user data from database to ensure roles/permissions are up to date
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        avatar: true,
        isSuperuser: true,
        isActive: true,
      },
    })

    if (!adminUser) {
      return ApiResponse.unauthorized('User not found')
    }

    if (!adminUser.isActive) {
      return ApiResponse.unauthorized('Account disabled')
    }

    return ApiResponse.success({
      user: adminUser,
    })
  } catch {
    return ApiResponse.unauthorized('Invalid token')
  }
}
