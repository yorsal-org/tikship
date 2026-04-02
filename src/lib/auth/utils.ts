import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { extractToken,verifyToken } from '@/lib/utils/token'
import { prisma } from '@/lib/db/prisma'


/**
 * Get authenticated user from request (supports Bearer Token and Session)
 * @param req - NextRequest object
 * @returns User object or null if not authenticated
 */
export async function getAuthenticatedUser(req: NextRequest) {
  // Try Bearer Token first
  const token = extractToken(req, 'next-auth.session-token')

  if (token) {
    const payload = await verifyToken(token)
    if (payload?.email) {
      const user = await prisma.user.findUnique({
        where: { email: payload.email as string },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          isActive: true,
        },
      })

      if (user && user.isActive) {
        return user
      }
    }
  }

  // Fallback to NextAuth session
  const session = await getServerSession(authOptions)
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        isActive: true,
      },
    })

    if (user && user.isActive) {
      return user
    }
  }

  return null
}

