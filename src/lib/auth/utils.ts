import { postService } from '@/lib/post/service'
import { PostType } from '@/types/post'
import { isAdmin } from '@/lib/auth/admin'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/db/prisma'

/**
 * Get post by slug with proper URL decoding and admin permission check
 */
export async function getPostBySlug(slug: string, type: PostType) {
  const decodedSlug = decodeURIComponent(slug)
  const isAdminUser = await isAdmin()
  return await postService.getPublicPost(decodedSlug, type, isAdminUser)
}

/**
 * Extract token from request (Cookie or Authorization header)
 */
export function extractToken(req: NextRequest, cookieName = 'admin-token'): string | null {
  // Try to get token from cookie first
  let token = req.cookies.get(cookieName)?.value

  // If no cookie token, try Bearer token from Authorization header
  if (!token) {
    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7) // Remove 'Bearer ' prefix
    }
  }

  return token || null
}

/**
 * Verify JWT token and return payload
 */
export async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'secret')
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

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
