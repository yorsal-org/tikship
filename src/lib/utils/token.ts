import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import type { DefaultSession } from 'next-auth'
import { jwtVerify } from 'jose'
import { authOptions } from '@/lib/auth/options'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
    } & DefaultSession['user']
  }
}

/**
 * Get full user session
 * @returns Session object or null if not authenticated
 */
export async function getUserSession() {
  try {
    
    const session = await getServerSession(authOptions)
    return session
  } catch (error) {
    console.warn('Failed to get user session:', error)
    return null
  }
}

/**
 * Get user session ID
 * @returns User ID string or undefined if not authenticated
 */
export async function getUserSessionId(): Promise<string | undefined> {
  const session = await getUserSession()
  return session?.user?.id
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
