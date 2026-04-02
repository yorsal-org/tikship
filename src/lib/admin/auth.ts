import { NextRequest } from 'next/server'
import { extractToken, verifyToken } from '@/lib/utils/token'
import { prisma } from '@/lib/db/prisma'

/**
 * Get authenticated admin user from request (supports Bearer Token and Cookie)
 * @param req - NextRequest object
 * @returns Admin user ID or null if not authenticated
 */
export async function getAuthenticatedAdmin(req: NextRequest) {
  // Try to extract token from cookie or Authorization header
  const token = extractToken(req, 'admin-token')

  if (!token) {
    return null
  }

  // Verify token
  const payload = await verifyToken(token)
  if (!payload?.id) {
    return null
  }

  // Verify admin user exists and is active
  const adminUser = await prisma.adminUser.findUnique({
    where: { id: payload.id as string },
    select: {
      id: true,
      username: true,
      email: true,
      isActive: true,
      isSuperuser: true,
    },
  })

  if (!adminUser || !adminUser.isActive) {
    return null
  }

  return adminUser
}
